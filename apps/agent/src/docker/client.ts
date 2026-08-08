import Docker from 'dockerode';
import { log } from '../logger.js';

export const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export interface DockerFacts {
  version: string | null;
  rootDir: string | null;
}

let cached: DockerFacts | null = null;

export async function dockerFacts(refresh = false): Promise<DockerFacts> {
  if (cached && !refresh) return cached;
  try {
    const info = (await docker.info()) as {
      ServerVersion?: string;
      DockerRootDir?: string;
    };
    cached = {
      version: info.ServerVersion ?? null,
      rootDir: info.DockerRootDir ?? null,
    };
  } catch (error) {
    log.error('cannot reach the Docker daemon', { error });
    cached = { version: null, rootDir: null };
  }
  return cached;
}

export async function ensureNetwork(name: string): Promise<void> {
  try {
    await docker.getNetwork(name).inspect();
    return;
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode !== 404) throw error;
  }
  log.info('creating docker network', { name });
  await docker.createNetwork({ Name: name, Driver: 'bridge' });
}

export async function ensureVolume(name: string): Promise<void> {
  try {
    await docker.getVolume(name).inspect();
    return;
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode !== 404) throw error;
  }
  log.info('creating docker volume', { name });
  await docker.createVolume({ Name: name, Labels: { 'ppanel.managed': 'true' } });
}

export async function containerExists(name: string): Promise<boolean> {
  try {
    await docker.getContainer(name).inspect();
    return true;
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return false;
    throw error;
  }
}

export interface PullProgress {
  status: string;
  progress?: string;
  id?: string;
}

export async function pullImage(
  image: string,
  onProgress?: (event: PullProgress) => void,
): Promise<void> {
  try {
    const auth = ghcrAuthFromEnv();
    const stream = auth
      ? await docker.pull(image, { authconfig: auth })
      : await docker.pull(image);
    await new Promise<void>((resolve, reject) => {
      docker.modem.followProgress(
        stream,
        (error: Error | null) => (error ? reject(error) : resolve()),
        (event: PullProgress) => onProgress?.(event),
      );
    });
  } catch (error) {
    throw mapPullError(image, error);
  }
}

/**
 * Optional GHCR credentials for private agent images.
 * Prefer making `ghcr.io/.../ez-agent` public so game hosts need no login.
 */
function ghcrAuthFromEnv(): {
  username: string;
  password: string;
  serveraddress: string;
} | null {
  const password =
    process.env.PPANEL_GHCR_TOKEN?.trim() ||
    process.env.GHCR_TOKEN?.trim() ||
    process.env.GITHUB_TOKEN?.trim() ||
    '';
  if (!password) return null;
  const username =
    process.env.PPANEL_GHCR_USER?.trim() ||
    process.env.GHCR_USER?.trim() ||
    'token';
  return {
    username,
    password,
    serveraddress: 'ghcr.io',
  };
}

function mapPullError(image: string, error: unknown): Error {
  const text = error instanceof Error ? error.message : String(error);
  if (/unauthorized|authentication required|denied/i.test(text)) {
    return new Error(
      `Cannot pull ${image}: registry returned unauthorized. ` +
        `Make the GHCR package public (Package settings → Change visibility → Public), ` +
        `or set PPANEL_GHCR_TOKEN on the agent for a private pull. Original: ${text}`,
    );
  }
  return error instanceof Error ? error : new Error(text);
}

export function dockerStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const e = error as { statusCode?: number; status?: number };
  return e.statusCode ?? e.status;
}

export function isNotFound(error: unknown): boolean {
  return dockerStatusCode(error) === 404;
}

/** Docker returns 304 when start/stop is a no-op (already in that state). */
export function isAlreadyInState(error: unknown): boolean {
  return dockerStatusCode(error) === 304;
}
