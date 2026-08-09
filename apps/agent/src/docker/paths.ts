/**
 * Layout of the `joedwards32/cs2` image. The volume is mounted at CS2_ROOT, so
 * everything below survives a container recreation.
 */
export const CS2_ROOT = '/home/steam/cs2-dedicated';
export const CS2_GAME_DIR = `${CS2_ROOT}/game/csgo`;
export const CS2_ADDONS_DIR = `${CS2_GAME_DIR}/addons`;
export const CS2_CFG_DIR = `${CS2_GAME_DIR}/cfg`;
export const GAMEINFO_PATH = `${CS2_GAME_DIR}/gameinfo.gi`;
/** Steam writes the installed build id here; it is how CS2 updates are noticed. */
export const APPMANIFEST_PATH = `${CS2_ROOT}/steamapps/appmanifest_730.acf`;

/** Resolves a plugin-relative destination against the CS2 install root. */
export function resolveInstallPath(relative: string): string {
  const normalized = relative.replace(/^\/+/, '');
  const parts: string[] = [];
  for (const part of normalized.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      // A plugin descriptor must not be able to write outside the game
      // directory, so traversal is dropped rather than resolved.
      continue;
    }
    parts.push(part);
  }
  return `${CS2_ROOT}/${parts.join('/')}`;
}
