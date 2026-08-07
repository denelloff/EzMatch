import type Docker from 'dockerode';
import type { DemoFile } from '@ppanel/protocol';
import { CS2_GAME_DIR } from './docker/paths.js';

/**
 * GOTV writes demos into the game directory, which lives on the instance
 * volume. Listing happens inside the container rather than on the host so the
 * agent does not need to know where Docker put the volume.
 */
export async function listDemos(container: Docker.Container): Promise<DemoFile[]> {
  const output = await execCapture(container, [
    'sh',
    '-c',
    // %s size, %Y mtime, %n name — one demo per line, newest last.
    `find ${CS2_GAME_DIR} -maxdepth 1 -name '*.dem' -printf '%s\\t%Y\\t%f\\n' 2>/dev/null || true`,
  ]);

  const files: DemoFile[] = [];
  for (const line of output.split('\n')) {
    const [size, mtime, name] = line.trim().split('\t');
    if (!name || !size || !mtime) continue;

    const sizeBytes = Number(size);
    const seconds = Number(mtime);
    if (!Number.isFinite(sizeBytes) || !Number.isFinite(seconds)) continue;

    files.push({
      name,
      sizeBytes,
      modifiedAt: new Date(seconds * 1000).toISOString(),
    });
  }

  return files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

async function execCapture(
  container: Docker.Container,
  command: string[],
): Promise<string> {
  const exec = await container.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: false,
    User: 'root',
  });
  const stream = await exec.start({ hijack: true, stdin: false });

  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(demultiplex(Buffer.concat(chunks))));
    stream.on('error', reject);
  });
}

/**
 * A hijacked exec stream is framed: 8-byte header per chunk, with the payload
 * length in the last four bytes. Reading it as plain text would splice the
 * headers into the file names.
 */
function demultiplex(buffer: Buffer): string {
  let offset = 0;
  const parts: Buffer[] = [];

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset + 4);
    const start = offset + 8;
    const end = Math.min(start + length, buffer.length);
    parts.push(buffer.subarray(start, end));
    offset = end;
  }

  return Buffer.concat(parts).toString('utf8');
}
