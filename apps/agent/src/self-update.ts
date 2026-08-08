import type Docker from 'dockerode';
import { docker, pullImage } from './docker/client.js';
import { log } from './logger.js';

const HELPER_IMAGE = process.env.PPANEL_UPDATE_HELPER_IMAGE ?? 'docker:27-cli';

/** Only digest/tag refs — never shell metacharacters. */
const SAFE_IMAGE = /^[a-zA-Z0-9._\/:-]+$/;
const SAFE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

export type UpdateProgress = (
  phase: string,
  message: string,
  percent: number | null,
) => void;

/**
 * Pulls `image`, creates a replacement container, then starts a short-lived
 * helper that swaps it in after this process returns. The current agent keeps
 * answering until the helper stops it.
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
  await pullImage(HELPER_IMAGE).catch(() => undefined);
  await startSwapHelper(containerName, tempName);

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
      // Keep the same docker.sock / host mounts the previous container had.
    },
  });
}

/**
 * Helper with the Docker CLI stops the live agent, drops it, renames the
 * prepared replacement into place, and starts it. Auto-remove cleans up.
 */
async function startSwapHelper(
  containerName: string,
  tempName: string,
): Promise<void> {
  const script = [
    'set -eu',
    'sleep 3',
    `docker stop ${shellQuote(containerName)} || true`,
    `docker rm -f ${shellQuote(containerName)} || true`,
    `docker rename ${shellQuote(tempName)} ${shellQuote(containerName)}`,
    `docker start ${shellQuote(containerName)}`,
  ].join('\n');

  const helperName = `ppanel-agent-swap-${Date.now()}`;
  await removeIfExists(helperName);

  const helper = await docker.createContainer({
    name: helperName,
    Image: HELPER_IMAGE,
    Cmd: ['sh', '-c', script],
    HostConfig: {
      Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
      AutoRemove: true,
      NetworkMode: 'none',
    },
  });
  await helper.start();
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
