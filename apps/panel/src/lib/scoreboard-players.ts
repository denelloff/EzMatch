/**
 * Active boards only show who is currently on the server. Finished/cancelled
 * matches keep the full roster so the final scoreboard stays readable.
 */
export function scoreboardPlayersVisible(
  state: string,
  connected: boolean,
): boolean {
  if (state === 'FINISHED' || state === 'CANCELLED') return true;
  return connected;
}
