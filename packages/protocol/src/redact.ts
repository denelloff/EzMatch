/**
 * Console output and log lines routinely contain credentials: an admin typing
 * `rcon_password ...`, the server echoing `sv_setsteamaccount`, or a cvar dump
 * on map change. Everything leaving the agent goes through here first, so
 * secrets never reach the database, the UI or the panel's own logs.
 */

const SENSITIVE_KEYS = [
  'rcon_password',
  'fake_rcon_password',
  'sv_password',
  'sv_setsteamaccount',
  'sv_steamaccount',
  'srcds_token',
  'matchzy_remote_log_header_value',
  'matchzy_loadmatch_header_value',
  'matchzy_match_report_header_value',
  'matchzy_demo_upload_header_value',
  'password',
  'token',
];

export const REDACTED = '[redacted]';

const KEY_VALUE_RE = new RegExp(
  `\\b(${SENSITIVE_KEYS.join('|')})\\b(\\s*[=:]?\\s*)("[^"]*"|'[^']*'|\\S+)`,
  'gi',
);

/** Masks anything that looks like `secret_key value` in a free-form line. */
export function redactLine(line: string): string {
  return line.replace(KEY_VALUE_RE, (_match, key: string, sep: string) => {
    return `${key}${sep || ' '}${REDACTED}`;
  });
}

/**
 * Masks known literal secret values wherever they appear, including inside
 * URLs. Values shorter than 6 characters are skipped: masking them would turn
 * ordinary words into noise without protecting anything meaningful.
 */
export function redactValues(line: string, secrets: readonly string[]): string {
  let out = line;
  for (const secret of secrets) {
    if (!secret || secret.length < 6) continue;
    out = out.split(secret).join(REDACTED);
  }
  return out;
}

export function redact(line: string, secrets: readonly string[] = []): string {
  return redactValues(redactLine(line), secrets);
}

