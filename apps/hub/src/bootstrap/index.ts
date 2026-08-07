import { generateAgentToken, hashAgentToken } from '@ppanel/db';
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
  done: 100,
};

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
    await updateTask(taskId, {
      status: 'RUNNING',
      phase: 'preflight',
      percent: 5,
      message: 'Connected over SSH — starting bootstrap',
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

    const run = await runBootstrapScript(credentials, script, (line) => {
      if (line.kind === 'phase') {
        void updateTask(taskId, {
          phase: line.text,
          percent: PHASE_PERCENT[line.text] ?? null,
          message: describePhase(line.text),
        });
        return;
      }
      if (line.kind === 'info' || line.kind === 'raw') {
        log.info({ remote: line.text }, 'bootstrap');
        void updateTask(taskId, { message: line.text });
      }
      if (line.kind === 'error') {
        log.error({ remote: line.text }, 'bootstrap failed');
        void updateTask(taskId, { message: line.text, error: line.text });
      }
    });

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
      status: 'SUCCEEDED',
      phase: 'done',
      percent: 100,
      message: 'Agent deployed. Waiting for it to connect.',
      error: null,
      result: {
        hostKeyFingerprint: `SHA256:${run.hostKeyFingerprint}`,
        ...run.result,
      },
    });
    log.info('bootstrap completed');
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

function describePhase(phase: string): string {
  switch (phase) {
    case 'preflight':
      return 'Checking operating system and architecture';
    case 'docker':
      return 'Ensuring Docker is installed and running';
    case 'disk':
      return 'Checking free disk space';
    case 'network':
      return 'Creating the ppanel Docker network';
    case 'credentials':
      return 'Writing the agent credentials file';
    case 'agent':
      return 'Pulling and starting the agent container';
    case 'done':
      return 'Agent deployed';
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
