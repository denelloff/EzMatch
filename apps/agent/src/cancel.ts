/** Thrown when the hub asks the agent to abort a running command. */
export class CommandCancelledError extends Error {
  constructor(message = 'Cancelled by operator') {
    super(message);
    this.name = 'CommandCancelledError';
  }
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new CommandCancelledError();
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new CommandCancelledError());
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new CommandCancelledError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
