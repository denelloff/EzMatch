/** CS2 client console line for joining a gameserver. */
export function connectCommand(
  host: string,
  port: number,
  password?: string | null,
): string {
  const base = `connect ${host}:${port}`;
  const pwd = password?.trim();
  return pwd ? `${base}; password ${pwd}` : base;
}
