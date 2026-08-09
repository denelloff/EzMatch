import { generateAgentToken, hashAgentToken } from '@ppanel/db';
import { agents } from '../agent/registry.js';
import type { AgentDeployConfig } from '../config.js';
import { db } from '../db.js';
import { logger } from '../logger.js';
import { updateTask, failTask } from '../tasks.js';
import { buildBootstrapScript } from './script.js';
import { runBootstrapScript, SshError, type SshCredentials } from './ssh.js';

const PHASE_PERCENT: Record<string, number> = {
  preflight: 10,
  docker: 30,
  disk: 45,
  network: 55,
  credentials: 65,
  agent: 80,
  done: 95,
};

/** How long to wait for the agent WebSocket after the container starts. */
const AGENT_CONNECT_TIMEOUT_MS = 90_000;

export interface BootstrapInput {
  serverId: string;
  taskId: string;
  credentials: SshCredentials;
  agentConfig: AgentDeployConfig;
}

/**
 * Deploys the agent onto a host. Runs in the background: the caller gets a task
 * id immediately and follows progress over SSE.
 *
 * The SSH credentials passed in are never persisted. Once this returns, the
 * only credential tying the panel to the host is the agent token, of which the
 * panel keeps a hash.
 */
export async function bootstrapServer(input: BootstrapInput): Promise<void> {
  const { serverId, taskId, credentials, agentConfig } = input;
  const log = logger.child({ serverId, taskId });

  const { token, prefix } = generateAgentToken();

  try {
    // Clear the previous failure as soon as a new install starts so the panel
    // does not keep showing a stale ERROR banner while the task is running.
    await db().server.update({
      where: { id: serverId },
      data: { status: 'PENDING', lastError: null },
    });

    await updateTask(taskId, {
      status: 'RUNNING',
      phase: 'preflight',
      percent: 2,
      message: `Preparing bootstrap for ${credentials.host}:${credentials.port}…`,
    });

    // The token row is written before the script runs. If bootstrap fails
    // halfway the agent may already be up with a valid token, and a token the
    // panel does not recognise would leave an orphaned agent retrying forever.
    await db().agentToken.upsert({
      where: { serverId },
      create: { serverId, tokenHash: hashAgentToken(token), tokenPrefix: prefix },
      update: {
        tokenHash: hashAgentToken(token),
        tokenPrefix: prefix,
        revokedAt: null,
      },
    });

    await updateTask(taskId, {
      percent: 4,
      message: `Opening SSH to ${credentials.username}@${credentials.host}:${credentials.port}…`,
    });

    const script = buildBootstrapScript({
      serverId,
      agentToken: token,
      hubUrl: agentConfig.hubPublicUrl,
      agentImage: agentConfig.image,
      containerName: agentConfig.containerName,
      network: agentConfig.network,
      minFreeBytes: agentConfig.minFreeBytes,
      logPort: agentConfig.logPort,
      stateVolume: agentConfig.stateVolume,
    });

    // Serialize console updates so lines stay in order on the SSE stream.
    let logChain: Promise<void> = Promise.resolve();
    const pushLog = (
      update: Parameters<typeof updateTask>[1],
      persist = true,
    ) => {
      logChain = logChain
        .then(() => updateTask(taskId, update, { persist }))
        .catch(() => undefined);
    };

    const run = await runBootstrapScript(credentials, script, (line) => {
      if (line.kind === 'phase') {
        pushLog({
          phase: line.text,
          percent: PHASE_PERCENT[line.text] ?? null,
          message: describePhase(line.text),
        });
        return;
      }
      if (line.kind === 'info' || line.kind === 'raw') {
        log.info({ remote: line.text }, 'bootstrap');
        // Persist only milestones; every line still hits the live console buffer.
        pushLog({ message: line.text }, line.kind === 'info');
      }
      if (line.kind === 'error') {
        log.error({ remote: line.text }, 'bootstrap failed');
        pushLog({ message: line.text, error: line.text });
      }
    });

    await logChain;

    if (run.exitCode !== 0) {
      throw new Error(
        run.errorText ??
          `Bootstrap script exited with code ${run.exitCode}. Check the live console for the last remote lines.`,
      );
    }

    await db().server.update({
      where: { id: serverId },
      data: {
        status: 'PENDING',
        lastError: null,
        hostInfo: run.result ? (run.result as object) : undefined,
      },
    });

    await updateTask(taskId, {
      phase: 'done',
      percent: 90,
      message: `Container up — waiting for WebSocket to ${agentConfig.hubPublicUrl}`,
    });

    const connected = await waitForAgent(
      serverId,
      AGENT_CONNECT_TIMEOUT_MS,
      (secondsLeft) => {
        void updateTask(taskId, {
          message: `Waiting for agent at ${agentConfig.hubPublicUrl} (${secondsLeft}s left)`,
        });
      },
    );

    if (!connected) {
      throw new Error(
        `Agent container started but never reached the hub at ${agentConfig.hubPublicUrl}. ` +
          'From the game host that address must be reachable (not 127.0.0.1). ' +
          'Forward/open the hub port on the eZ-Match machine, set HUB_PUBLIC_URL to a public ws:// or wss:// URL, then reinstall ez-agent.',
      );
    }

    await updateTask(taskId, {
      status: 'SUCCEEDED',
      phase: 'done',
      percent: 100,
      message: 'Agent connected to the hub.',
      error: null,
      result: {
        hostKeyFingerprint: `SHA256:${run.hostKeyFingerprint}`,
        ...run.result,
      },
    });
    log.info('bootstrap completed — agent online');
  } catch (error) {
    const message =
      error instanceof SshError
        ? `${describeSshError(error)}: ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error);

    await db()
      .server.update({
        where: { id: serverId },
        data: { status: 'ERROR', lastError: message },
      })
      .catch(() => undefined);

    await failTask(taskId, new Error(message));
    log.error({ error }, 'bootstrap failed');
  }
}

export async function waitForAgent(
  serverId: string,
  timeoutMs: number,
  onTick?: (secondsLeft: number) => void,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  let lastReported = -1;
  while (Date.now() < deadline) {
    if (agents.get(serverId)) return true;
    const secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (onTick && secondsLeft !== lastReported && secondsLeft % 5 === 0) {
      lastReported = secondsLeft;
      onTick(secondsLeft);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return !!agents.get(serverId);
}

function describePhase(phase: string): string {
  switch (phase) {
    case 'preflight':
      return 'Checking operating system and architecture';
    case 'docker':
      return 'Ensuring Docker is installed and running';
    case 'disk':
      return 'Checking free disk space';
    case 'network':
      return 'Creating the eZ-Match Docker network';
    case 'credentials':
      return 'Writing the agent credentials file';
    case 'agent':
      return 'Pulling and starting the agent container';
    case 'done':
      return 'Waiting for the agent to connect';
    default:
      return phase;
  }
}

function describeSshError(error: SshError): string {
  switch (error.code) {
    case 'AUTH_FAILED':
      return 'SSH authentication failed';
    case 'TIMEOUT':
      return 'SSH connection timed out';
    case 'CONNECT_FAILED':
      return 'Could not reach the host over SSH';
    default:
      return 'SSH error';
  }
}
