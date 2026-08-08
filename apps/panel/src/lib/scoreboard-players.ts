/** Warmup boards should only show who is currently on the server. */
export function scoreboardPlayersVisible(
  state: string,
  connected: boolean,
): boolean {
  if (
    state === 'WARMUP' ||
    state === 'KNIFE' ||
    state === 'KNIFE_DECISION' ||
    state === 'DRAFT'
  ) {
    return connected;
  }
  return true;
}
