import type { PluginId, PluginSpec } from './plugins.js';

/**
 * Pinned plugin versions.
 *
 * Nothing here resolves "latest" on purpose. Metamod and CounterStrikeSharp
 * link against the game binaries and break whenever Valve ships a patch, so an
 * install that silently picks up a new build is an outage waiting for the next
 * match. Upgrading is an explicit edit to this file.
 *
 * The checksums were taken from the published artifacts. If one stops matching,
 * the upstream file was replaced under the same URL, which is exactly the case
 * worth refusing to install.
 *
 * The panel sends the full descriptor to the agent, so bumping a version does
 * not require redeploying agents.
 */

const GAME_DIR = 'game/csgo';

export const METAMOD_BUILD = '2.0.0-git1410';
export const COUNTERSTRIKESHARP_VERSION = '1.0.371';
export const FAKE_RCON_VERSION = '1.2.8';

export const PLUGIN_CATALOG: Record<PluginId, PluginSpec> = {
  metamod: {
    id: 'metamod',
    version: METAMOD_BUILD,
    requires: [],
    install: [
      {
        kind: 'download-extract',
        url: `https://mms.alliedmods.net/mmsdrop/2.0/mmsource-${METAMOD_BUILD}-linux.tar.gz`,
        archive: 'tar.gz',
        sha256:
          'abffda9e94aaed8271eb4ef154f85eb73c8054bc3df0ec38eafb4954f33c7674',
        dest: GAME_DIR,
        stripComponents: 0,
      },
      {
        // Without this line the game never loads Metamod. CS2 updates rewrite
        // gameinfo.gi; when Game_LowViolence is missing the agent inserts
        // before the first plain `Game csgo` SearchPaths entry instead.
        kind: 'ensure-line-in-file',
        file: `${GAME_DIR}/gameinfo.gi`,
        afterLine: 'Game_LowViolence',
        line: 'Game csgo/addons/metamod',
      },
    ],
    uninstall: [
      { kind: 'remove-path', path: `${GAME_DIR}/addons/metamod` },
      { kind: 'remove-path', path: `${GAME_DIR}/addons/metamod.vdf` },
      { kind: 'remove-path', path: `${GAME_DIR}/addons/metamod_x64.vdf` },
    ],
    verifyCommand: 'meta version',
    verifyExpect: 'Metamod:Source',
  },

  counterstrikesharp: {
    id: 'counterstrikesharp',
    version: COUNTERSTRIKESHARP_VERSION,
    requires: ['metamod'],
    install: [
      {
        // The "with-runtime" build bundles the .NET runtime. The plain build
        // assumes a matching runtime is already installed on the host, which
        // inside the CS2 container it is not.
        kind: 'download-extract',
        url: `https://github.com/roflmuffin/CounterStrikeSharp/releases/download/v${COUNTERSTRIKESHARP_VERSION}/counterstrikesharp-with-runtime-linux-${COUNTERSTRIKESHARP_VERSION}.zip`,
        archive: 'zip',
        sha256:
          '447f699d574348c9ffafc3d54a88363f29cd7ecba3d8e52adcccd9201812d01d',
        dest: GAME_DIR,
        stripComponents: 0,
      },
    ],
    uninstall: [
      { kind: 'remove-path', path: `${GAME_DIR}/addons/counterstrikesharp` },
      {
        kind: 'remove-path',
        path: `${GAME_DIR}/addons/metamod/counterstrikesharp.vdf`,
      },
    ],
    verifyCommand: 'meta list',
    verifyExpect: 'CounterStrikeSharp',
  },

  fake_rcon: {
    id: 'fake_rcon',
    version: FAKE_RCON_VERSION,
    requires: ['metamod'],
    install: [
      {
        kind: 'download-extract',
        url: `https://github.com/Salvatore-Als/cs2-fake-rcon/releases/download/${FAKE_RCON_VERSION}/linux.tar.gz`,
        archive: 'tar.gz',
        sha256:
          'c55a2fc282923b3f701b360b721c70476e8f5778f5ff96c0738585d6d8ed3cec',
        dest: GAME_DIR,
        stripComponents: 0,
      },
    ],
    uninstall: [
      { kind: 'remove-path', path: `${GAME_DIR}/addons/fake_rcon` },
      {
        kind: 'remove-path',
        path: `${GAME_DIR}/addons/metamod/fake_rcon.vdf`,
      },
    ],
    verifyCommand: 'meta list',
    verifyExpect: 'fake_rcon',
  },
};

export interface PluginCatalogEntry {
  id: PluginId;
  name: string;
  version: string;
  summary: string;
  /** Shown next to the checkbox so the trade-off is visible before installing. */
  caution: string | null;
  requires: PluginId[];
}

export const PLUGIN_DESCRIPTIONS: PluginCatalogEntry[] = [
  {
    id: 'metamod',
    name: 'Metamod:Source',
    version: METAMOD_BUILD,
    summary:
      'Plugin loader every other server plugin builds on. Patches gameinfo.gi so the game loads it.',
    caution:
      'Links against the game binaries. A CS2 update can stop it loading until a newer build is pinned here.',
    requires: [],
  },
  {
    id: 'counterstrikesharp',
    name: 'CounterStrikeSharp',
    version: COUNTERSTRIKESHARP_VERSION,
    summary:
      'C# scripting framework. Install the with-runtime build, which ships the .NET runtime the container lacks.',
    caution:
      'Links against CS2 binaries. A Valve patch often makes it segfault on boot (cs2.sh Segmentation fault) until a newer build is pinned. PPanel matches do not need it — remove it if the server will not start.',
    requires: ['metamod'],
  },
  {
    id: 'fake_rcon',
    name: 'Fake RCON',
    version: FAKE_RCON_VERSION,
    summary:
      'Restores fake_rcon_password and fake_rcon for admins typing into the in-game console.',
    caution:
      'Uses the same password as RCON (rcon_password). PMatch itself drives the server through the container console and does not need this plugin.',
    requires: ['metamod'],
  },
];

export function pluginSpec(id: PluginId): PluginSpec {
  return PLUGIN_CATALOG[id];
}

const PLUGIN_NAMES = new Map<string, string>(
  PLUGIN_DESCRIPTIONS.map((entry) => [entry.id, entry.name]),
);

/** Human-readable label for progress messages and the UI. */
export function pluginName(id: string): string {
  return PLUGIN_NAMES.get(id) ?? id;
}

export function isPluginId(value: string): value is PluginId {
  return value in PLUGIN_CATALOG;
}

/** Returns the requested plugins plus their dependencies, in install order. */
export function resolvePluginOrder(requested: PluginId[]): PluginId[] {
  const ordered: PluginId[] = [];
  const seen = new Set<PluginId>();

  const visit = (id: PluginId) => {
    if (seen.has(id)) return;
    seen.add(id);
    for (const dependency of PLUGIN_CATALOG[id].requires) visit(dependency);
    ordered.push(id);
  };

  for (const id of requested) visit(id);
  return ordered;
}
