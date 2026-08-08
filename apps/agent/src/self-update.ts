import { spawn } from 'node:child_process';
import type Docker from 'dockerode';
import { docker, pullImage } from './docker/client.js';
import { log } from './logger.js';

/** Only digest/tag refs — never shell metacharacters. */
const SAFE_IMAGE = /^[a-zA-Z0-9._\/:-]+$/;
const SAFE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

export type UpdateProgress = (
  phase: string,
  message: string,
  percent: number | null,
) => void;

/**
 * Pulls `image`, creates a replacement container, then detaches a local
 * `docker` CLI swap script. We deliberately do not pull a helper image
 * (docker:cli) — that hung on hosts that cannot reach Docker Hub quickly.
 */
export async function scheduleAgentUpdate(input: {
  containerName: string;
  image: string;
  progress: UpdateProgress;
}): Promise<{ image: string; containerName: string }> {
  const { containerName, image, progress } = input;
  if (!SAFE_IMAGE.test(image)) {
    throw new Error(`Refusing unsafe image reference: ${image}`);
  }
  if (!SAFE_NAME.test(containerName)) {
    throw new Error(`Refusing unsafe container name: ${containerName}`);
  }

  progress('pulling', `Pulling ${image}`, 10);
  await pullImage(image, (event) => {
    if (event.status) {
      progress(
        'pulling',
        event.progress ? `${event.status} ${event.progress}` : event.status,
        null,
      );
    }
  });

  progress('preparing', 'Preparing the replacement container', 55);
  const current = await docker.getContainer(containerName).inspect();
  const tempName = `${containerName}-next`;

  await removeIfExists(tempName);
  await createReplacement(tempName, image, current);

  progress('scheduling', 'Scheduling container swap', 75);
  scheduleLocalSwap(containerName, tempName);

  progress('restarting', 'Restarting with the new image', 90);
  log.info('agent update scheduled', { containerName, image, tempName });
  return { image, containerName };
}

async function removeIfExists(name: string): Promise<void> {
  try {
    await docker.getContainer(name).remove({ force: true });
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode !== 404) throw error;
  }
}

async function createReplacement(
  tempName: string,
  image: string,
  current: Docker.ContainerInspectInfo,
): Promise<void> {
  const binds = current.HostConfig?.Binds ?? [];
  const networkMode = current.HostConfig?.NetworkMode ?? 'ppanel';
  const restart = current.HostConfig?.RestartPolicy ?? {
    Name: 'unless-stopped',
  };

  await docker.createContainer({
    name: tempName,
    Image: image,
    Env: current.Config.Env ?? [],
    Labels: {
      ...(current.Config.Labels ?? {}),
      'ppanel.role': 'agent',
    },
    HostConfig: {
      Binds: binds,
      NetworkMode: networkMode,
      RestartPolicy: restart,
    },
  });
}

/**
 * Detach a shell that uses the host docker CLI via the mounted socket. The
 * agent image ships `docker-cli` so we never need a second pull.
 */
function scheduleLocalSwap(containerName: string, tempName: string): void {
  const script = [
    'set -eu',
    'sleep 2',
    `docker stop ${shellQuote(containerName)} || true`,
    `docker rm -f ${shellQuote(containerName)} || true`,
    `docker rename ${shellQuote(tempName)} ${shellQuote(containerName)}`,
    `docker start ${shellQuote(containerName)}`,
  ].join('\n');

  const child = spawn('sh', ['-c', script], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
