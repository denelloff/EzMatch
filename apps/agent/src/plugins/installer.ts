import { createHash } from 'node:crypto';
import { dirname, posix } from 'node:path';
import type Docker from 'dockerode';
import type { InstallStep, PluginSpec } from '@ppanel/protocol';
import { docker } from '../docker/client.js';
import { putFiles, readTextFile, unpackArchive } from '../docker/archive.js';
import { CS2_ROOT, resolveInstallPath } from '../docker/paths.js';
import { log } from '../logger.js';

/** Releases are tens of megabytes at most; anything larger is not a plugin. */
const MAX_DOWNLOAD_BYTES = 256 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 5 * 60_000;

export interface StepReporter {
  (message: string, percent: number | null): void;
}

export async function runInstallSteps(
  containerName: string,
  steps: InstallStep[],
  report: StepReporter,
): Promise<void> {
  const container = docker.getContainer(containerName);

  for (const [index, step] of steps.entries()) {
    const percent = Math.round(((index + 1) / steps.length) * 100);
    await runStep(container, step, report, percent);
  }
}

async function runStep(
  container: Docker.Container,
  step: InstallStep,
  report: StepReporter,
  percent: number,
): Promise<void> {
  switch (step.kind) {
    case 'download-extract': {
      report(`Downloading ${step.url}`, percent);
      const data = await download(step.url, step.sha256);
      report(`Unpacking into ${step.dest}`, percent);
      const entries = await unpackArchive(
        data,
        step.archive,
        step.stripComponents,
      );
      if (entries.length === 0) {
        throw new Error(`The archive at ${step.url} contained no files`);
      }
      const destination = resolveInstallPath(step.dest);
      await ensureDirectory(container, destination);
      await putFiles(container, destination, entries);
      break;
    }

    case 'ensure-line-in-file': {
      const path = resolveInstallPath(step.file);
      report(`Patching ${step.file}`, percent);
      await ensureLineInFile(container, path, step.afterLine, step.line);
      break;
    }

    case 'write-file': {
      const path = resolveInstallPath(step.file);
      if (step.skipIfExists) {
        const existing = await readTextFile(container, path);
        if (existing !== null) break;
      }
      report(`Writing ${step.file}`, percent);
      const directory = posix.dirname(path);
      await ensureDirectory(container, directory);
      await putFiles(container, directory, [
        {
          name: posix.basename(path),
          content: Buffer.from(step.contentBase64, 'base64'),
        },
      ]);
      break;
    }

    case 'ensure-dir': {
      const path = resolveInstallPath(step.path);
      report(`Creating ${step.path}`, percent);
      await ensureDirectory(container, path);
      break;
    }

    case 'remove-path': {
      const path = resolveInstallPath(step.path);
      if (path === CS2_ROOT || !path.startsWith(`${CS2_ROOT}/`)) {
        throw new Error(`Refusing to remove ${path}`);
      }
      report(`Removing ${step.path}`, percent);
      await execInContainer(container, ['rm', '-rf', '--', path]);
      break;
    }
  }
}

async function download(url: string, expectedSha256: string | null): Promise<Buffer> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error(`Plugin downloads must use https, got ${parsed.protocol}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!response.ok) {
      throw new Error(`${url} returned ${response.status} ${response.statusText}`);
    }

    const declared = Number.parseInt(
      response.headers.get('content-length') ?? '',
      10,
    );
    if (Number.isFinite(declared) && declared > MAX_DOWNLOAD_BYTES) {
      throw new Error(`${url} is ${declared} bytes, over the ${MAX_DOWNLOAD_BYTES} limit`);
    }

    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > MAX_DOWNLOAD_BYTES) {
      throw new Error(`${url} exceeded the ${MAX_DOWNLOAD_BYTES} byte limit`);
    }

    if (expectedSha256) {
      const actual = createHash('sha256').update(data).digest('hex');
      if (actual !== expectedSha256.toLowerCase()) {
        throw new Error(
          `Checksum mismatch for ${url}: expected ${expectedSha256}, got ${actual}`,
        );
      }
    } else {
      log.warn('installing an artifact without a checksum', { url });
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * `putArchive` fails if the destination does not exist, and there is no Docker
 * API for creating a directory, so this shells out inside the target container.
 */
async function ensureDirectory(
  container: Docker.Container,
  path: string,
): Promise<void> {
  await execInContainer(container, ['mkdir', '-p', '--', path]);
}

/**
 * Metamod is only loaded once `Game csgo/addons/metamod` appears in
 * `gameinfo.gi`, directly after the `Game_LowViolence csgo_lv` line. CS2 updates
 * rewrite this file, so the edit has to be re-applied and must stay idempotent.
 */
async function ensureLineInFile(
  container: Docker.Container,
  path: string,
  afterLine: string,
  line: string,
): Promise<void> {
  const contents = await readTextFile(container, path);
  if (contents === null) {
    throw new Error(`${path} does not exist, so it cannot be patched`);
  }

  const normalizedLine = line.trim();
  if (contents.split('\n').some((existing) => existing.trim() === normalizedLine)) {
    return;
  }

  const lines = contents.split('\n');
  const anchor = lines.findIndex((existing) =>
    existing.trim().startsWith(afterLine.trim()),
  );
  if (anchor === -1) {
    throw new Error(
      `Could not find "${afterLine}" in ${path}. The file layout changed; the plugin descriptor needs updating.`,
    );
  }

  // Match the anchor's indentation so the file stays readable for a human who
  // opens it after an update.
  const indentation = /^\s*/.exec(lines[anchor]!)?.[0] ?? '';
  lines.splice(anchor + 1, 0, `${indentation}${normalizedLine}`);

  await putFiles(container, dirname(path).replace(/\\/g, '/'), [
    {
      name: posix.basename(path),
      content: Buffer.from(lines.join('\n'), 'utf8'),
    },
  ]);
}

async function execInContainer(
  container: Docker.Container,
  command: string[],
): Promise<string> {
  const exec = await container.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
    User: 'root',
  });
  const stream = await exec.start({ hijack: true, stdin: false });

  const output = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });

  const result = await exec.inspect();
  if (result.ExitCode !== 0) {
    throw new Error(
      `${command.join(' ')} failed with exit code ${result.ExitCode}: ${output.trim()}`,
    );
  }
  return output;
}

export interface VerifyResult {
  ok: boolean;
  output: string;
}

/**
 * Confirms a plugin actually loaded. `meta list` is the only reliable signal
 * for Metamod and CounterStrikeSharp: the files can be perfectly in place and
 * the plugin still fail to load after a CS2 update.
 */
export async function verifyPlugin(
  plugin: PluginSpec,
  runConsole: (command: string, captureMs: number) => Promise<string[]>,
): Promise<VerifyResult> {
  if (!plugin.verifyCommand) return { ok: true, output: '' };

  const lines = await runConsole(plugin.verifyCommand, 3000);
  const output = lines.join('\n');
  if (!plugin.verifyExpect) return { ok: lines.length > 0, output };

  return {
    ok: output.toLowerCase().includes(plugin.verifyExpect.toLowerCase()),
    output,
  };
}
