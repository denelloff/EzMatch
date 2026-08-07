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
  const stream = await docker.pull(image);
  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (error: Error | null) => (error ? reject(error) : resolve()),
      (event: PullProgress) => onProgress?.(event),
    );
  });
}

export function isNotFound(error: unknown): boolean {
  return (error as { statusCode?: number })?.statusCode === 404;
}
