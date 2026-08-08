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
 * Pulls `image`, creates a replacement container, then starts a one-shot
 * helper container (same image, docker.sock only) to stop/rename/start.
 *
 * The swap must NOT run inside the agent container: `docker stop` kills every
 * process in that cgroup, including a "detached" shell, so rename/start never
 * finishes and the agent never comes back.
 *
 * We reuse the image we just pulled (ships `docker-cli`) so we never need a
 * second pull from Docker Hub.
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
  await scheduleSwapViaHelper(containerName, tempName, image);

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
 * One-shot sibling container: survives stopping the agent, uses the host
 * Docker socket, AutoRemove when done.
 */
async function scheduleSwapViaHelper(
  containerName: string,
  tempName: string,
  helperImage: string,
): Promise<void> {
  const swapName = `${containerName}-swap`;
  await removeIfExists(swapName);

  const script = [
    'set -eu',
    'sleep 2',
    `docker stop ${shellQuote(containerName)} || true`,
    `docker rm -f ${shellQuote(containerName)} || true`,
    `docker rename ${shellQuote(tempName)} ${shellQuote(containerName)}`,
    `docker start ${shellQuote(containerName)}`,
  ].join('\n');

  const helper = await docker.createContainer({
    name: swapName,
    Image: helperImage,
    Entrypoint: ['/bin/sh', '-c'],
    Cmd: [script],
    Labels: {
      'ppanel.role': 'agent-swap',
    },
    HostConfig: {
      AutoRemove: true,
      Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
      NetworkMode: 'none',
      RestartPolicy: { Name: 'no' },
    },
  });

  await helper.start();
  log.info('agent swap helper started', { swapName, containerName, tempName });
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
