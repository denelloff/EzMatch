import { createHash } from 'node:crypto';
import { Client } from 'ssh2';

export interface SshCredentials {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  /**
   * SHA-256 fingerprint (base64, as printed by `ssh-keygen -lf`) the host key
   * must match. Without it the first connection is trust-on-first-use and is
   * theoretically interceptable, so the observed fingerprint is always
   * reported back for the operator to verify out of band.
   */
  expectedHostKey?: string;
}

export interface SshLine {
  kind: 'phase' | 'info' | 'error' | 'result' | 'raw';
  text: string;
}

export interface SshRunResult {
  exitCode: number;
  hostKeyFingerprint: string;
  result: Record<string, unknown> | null;
  errorText: string | null;
}

export class SshError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'SshError';
  }
}

const MARKER = '::ppanel::';

function parseLine(line: string): SshLine {
  if (!line.startsWith(MARKER)) return { kind: 'raw', text: line };
  const rest = line.slice(MARKER.length);
  const separator = rest.indexOf('::');
  if (separator === -1) return { kind: 'raw', text: line };
  const kind = rest.slice(0, separator);
  const text = rest.slice(separator + 2);
  if (
    kind === 'phase' ||
    kind === 'info' ||
    kind === 'error' ||
    kind === 'result'
  ) {
    return { kind, text };
  }
  return { kind: 'raw', text: line };
}

/**
 * Runs a script on the remote host by piping it into `bash -s`. Credentials are
 * held only for the duration of this call; nothing here writes them anywhere.
 */
export function runBootstrapScript(
  credentials: SshCredentials,
  script: string,
  onLine: (line: SshLine) => void,
): Promise<SshRunResult> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let hostKeyFingerprint = '';
    let settled = false;
    let stdoutBuffer = '';
    let stderrBuffer = '';
    let result: Record<string, unknown> | null = null;
    let errorText: string | null = null;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
      conn.end();
    };

    const flush = (chunk: string, isStderr: boolean) => {
      if (isStderr) {
        stderrBuffer += chunk;
      } else {
        stdoutBuffer += chunk;
      }
      const buffer = isStderr ? stderrBuffer : stdoutBuffer;
      const lines = buffer.split('\n');
      const remainder = lines.pop() ?? '';
      if (isStderr) {
        stderrBuffer = remainder;
      } else {
        stdoutBuffer = remainder;
      }

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, '');
        if (!line) continue;
        const parsed = parseLine(line);
        if (parsed.kind === 'error') errorText = parsed.text;
        if (parsed.kind === 'result') {
          try {
            result = JSON.parse(parsed.text) as Record<string, unknown>;
          } catch {
            result = null;
          }
          continue;
        }
        onLine(parsed);
      }
    };

    conn.on('ready', () => {
      conn.exec('bash -s', (err, stream) => {
        if (err) {
          finish(() => reject(new SshError(err.message, 'EXEC_FAILED')));
          return;
        }

        stream.on('close', (code: number | null) => {
          flush('\n', false);
          flush('\n', true);
          finish(() =>
            resolve({
              exitCode: code ?? -1,
              hostKeyFingerprint,
              result,
              errorText,
            }),
          );
        });
        stream.on('data', (chunk: Buffer) => flush(chunk.toString('utf8'), false));
        stream.stderr.on('data', (chunk: Buffer) =>
          flush(chunk.toString('utf8'), true),
        );

        stream.end(script);
      });
    });

    conn.on('error', (err: Error & { level?: string }) => {
      const code =
        err.level === 'client-authentication' ? 'AUTH_FAILED' : 'CONNECT_FAILED';
      finish(() => reject(new SshError(err.message, code)));
    });

    conn.on('timeout', () => {
      finish(() => reject(new SshError('Connection timed out', 'TIMEOUT')));
    });

    conn.connect({
      host: credentials.host,
      port: credentials.port,
      username: credentials.username,
      ...(credentials.password ? { password: credentials.password } : {}),
      ...(credentials.privateKey ? { privateKey: credentials.privateKey } : {}),
      ...(credentials.passphrase ? { passphrase: credentials.passphrase } : {}),
      readyTimeout: 30_000,
      keepaliveInterval: 10_000,
      hostVerifier: (key: Buffer) => {
        hostKeyFingerprint = createHash('sha256').update(key).digest('base64');
        if (!credentials.expectedHostKey) return true;
        const expected = credentials.expectedHostKey
          .replace(/^SHA256:/, '')
          .replace(/=+$/, '');
        return hostKeyFingerprint.replace(/=+$/, '') === expected;
      },
    });
  });
}
