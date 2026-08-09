/**
 * SteamCMD reports progress on stdout while the container boots. Turning those
 * lines into a percentage is what makes the first install bearable: CS2 is
 * roughly 60 GB, so without feedback the UI would sit blank for half an hour.
 */
export interface SteamProgress {
  phase: 'validating' | 'preallocating' | 'downloading' | 'committing' | 'verifying';
  percent: number | null;
  downloadedBytes: number | null;
  totalBytes: number | null;
}

const STATE_NAMES: Record<string, SteamProgress['phase']> = {
  '0x3': 'validating',
  '0x11': 'preallocating',
  '0x61': 'downloading',
  '0x81': 'committing',
  '0x101': 'verifying',
  '0x401': 'verifying',
};

const UPDATE_RE =
  /Update state \((0x[0-9a-f]+)\)\s*([a-z ]+?),\s*progress:\s*([\d.]+)\s*\((\d+)\s*\/\s*(\d+)\)/i;

const INSTALLED_RE = /Success!\s+App\s+'730'\s+.*?(?:fully installed|already up to date)/i;
const ERROR_RE = /Error!\s+App\s+'730'\s+state is\s+(.+)/i;

export function parseSteamProgress(line: string): SteamProgress | null {
  const match = UPDATE_RE.exec(line);
  if (!match) return null;

  const percent = Number.parseFloat(match[3]!);
  const downloaded = Number.parseInt(match[4]!, 10);
  const total = Number.parseInt(match[5]!, 10);

  return {
    phase: STATE_NAMES[match[1]!.toLowerCase()] ?? 'downloading',
    percent: Number.isFinite(percent) ? percent : null,
    downloadedBytes: Number.isFinite(downloaded) ? downloaded : null,
    totalBytes: Number.isFinite(total) ? total : null,
  };
}

export function isInstallComplete(line: string): boolean {
  return INSTALLED_RE.test(line);
}

export function steamError(line: string): string | null {
  const match = ERROR_RE.exec(line);
  return match?.[1]?.trim() ?? null;
}

/**
 * Markers that the game server itself, rather than SteamCMD, is up. CS2 prints
 * several of these depending on configuration, so any one is enough.
 */
const READY_PATTERNS = [
  /Connection to Steam servers successful/i,
  /GC Connection established/i,
  /Server is hibernating/i,
  /^Host activate:/im,
  /Game server authentication:? SUCCESS/i,
  /^Loading map "/im,
];

export function isServerReady(line: string): boolean {
  return READY_PATTERNS.some((pattern) => pattern.test(line));
}

/** The one failure mode worth calling out by name, since it is not obvious. */
export function gsltProblem(line: string): string | null {
  if (/Token has been banned/i.test(line)) {
    return 'The GSLT token is banned. Create a new one at steamcommunity.com/dev/managegameservers.';
  }
  if (/no account token specified/i.test(line)) {
    return 'No GSLT token was accepted by the server, so it will not appear on the public list.';
  }
  if (/Invalid Game Server Account token/i.test(line)) {
    return 'The GSLT token is not valid for CS2 (app 730).';
  }
  return null;
}

