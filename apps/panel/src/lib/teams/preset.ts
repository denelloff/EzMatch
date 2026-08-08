/**
 * Known CS2 professional organisations. Logos are generated as SVG badges on
 * import (stable, no third-party CDN dependency); operators can replace them
 * with official marks via Edit.
 */
export interface ProTeamPreset {
  key: string;
  name: string;
  tag: string;
  country: string;
  /** Hex without # — used for the generated logo badge. */
  color: string;
}

export const CS2_PRO_TEAM_PRESET: ProTeamPreset[] = [
  { key: 'navi', name: 'Natus Vincere', tag: 'NAVI', country: 'ua', color: 'ffe500' },
  { key: 'vitality', name: 'Team Vitality', tag: 'Vitality', country: 'fr', color: 'ffc72c' },
  { key: 'g2', name: 'G2 Esports', tag: 'G2', country: 'de', color: 'ed1c24' },
  { key: 'faze', name: 'FaZe Clan', tag: 'FaZe', country: 'us', color: 'e10600' },
  { key: 'spirit', name: 'Team Spirit', tag: 'Spirit', country: 'ru', color: '1a1a1a' },
  { key: 'mouz', name: 'MOUZ', tag: 'MOUZ', country: 'de', color: 'e10600' },
  { key: 'astralis', name: 'Astralis', tag: 'Astralis', country: 'dk', color: 'ef2d36' },
  { key: 'falcons', name: 'Team Falcons', tag: 'Falcons', country: 'sa', color: '00a651' },
  { key: 'furia', name: 'FURIA', tag: 'FURIA', country: 'br', color: '000000' },
  { key: 'complexity', name: 'Complexity', tag: 'COL', country: 'us', color: '0055a5' },
  { key: 'liquid', name: 'Team Liquid', tag: 'Liquid', country: 'us', color: '0a2540' },
  { key: 'eternal-fire', name: 'Eternal Fire', tag: 'EF', country: 'tr', color: 'c8102e' },
  { key: 'heroic', name: 'Heroic', tag: 'Heroic', country: 'dk', color: 'e30613' },
  { key: '3dmax', name: '3DMAX', tag: '3DMAX', country: 'fr', color: '00a0e3' },
  { key: 'pain', name: 'paiN Gaming', tag: 'paiN', country: 'br', color: 'e30613' },
  { key: 'mibr', name: 'MIBR', tag: 'MIBR', country: 'br', color: 'c4a237' },
  { key: 'mongolz', name: 'The MongolZ', tag: 'MGLZ', country: 'mn', color: '0066b3' },
  { key: 'aurora', name: 'Aurora Gaming', tag: 'Aurora', country: 'ru', color: '7b2cbf' },
  { key: 'betboom', name: 'BetBoom Team', tag: 'BB', country: 'ru', color: 'ff6b00' },
  { key: 'virtuspro', name: 'Virtus.pro', tag: 'VP', country: 'ru', color: 'ff6600' },
  { key: 'cloud9', name: 'Cloud9', tag: 'C9', country: 'us', color: '0099ff' },
  { key: 'big', name: 'BIG', tag: 'BIG', country: 'de', color: 'ff6600' },
  { key: 'nip', name: 'Ninjas in Pyjamas', tag: 'NIP', country: 'se', color: 'a09163' },
  { key: 'fnatic', name: 'Fnatic', tag: 'Fnatic', country: 'se', color: 'ff5500' },
  { key: 'og', name: 'OG', tag: 'OG', country: 'gb', color: '00ff85' },
  { key: 'legacy', name: 'Legacy', tag: 'Legacy', country: 'br', color: '1d4ed8' },
  { key: 'flyquest', name: 'FlyQuest', tag: 'FlyQ', country: 'us', color: '00c853' },
  { key: 'wildcard', name: 'Wildcard', tag: 'WC', country: 'us', color: '7c3aed' },
  { key: 'rare-atom', name: 'Rare Atom', tag: 'RA', country: 'cn', color: 'e11d48' },
  { key: 'tyloo', name: 'TYLOO', tag: 'TYLOO', country: 'cn', color: 'dc2626' },
  { key: 'atox', name: 'ATOX', tag: 'ATOX', country: 'mn', color: '0ea5e9' },
  { key: 'saw', name: 'SAW', tag: 'SAW', country: 'pt', color: '16a34a' },
  { key: 'ecstatic', name: 'ECSTATIC', tag: 'ECS', country: 'dk', color: 'f59e0b' },
  { key: 'b8', name: 'B8', tag: 'B8', country: 'ua', color: '2563eb' },
  { key: 'parivision', name: 'PARIVISION', tag: 'PARI', country: 'ru', color: '9333ea' },
  { key: 'nemiga', name: 'Nemiga', tag: 'Nemiga', country: 'by', color: '22c55e' },
  { key: 'monte', name: 'Monte', tag: 'Monte', country: 'ua', color: '0f766e' },
  { key: 'imperial', name: 'Imperial Esports', tag: 'Imperial', country: 'br', color: 'eab308' },
  { key: 'fluxo', name: 'Fluxo', tag: 'Fluxo', country: 'br', color: 'a855f7' },
  { key: 'ence', name: 'ENCE', tag: 'ENCE', country: 'fi', color: 'ff6600' },
  { key: 'sinners', name: 'SINNERS', tag: 'SIN', country: 'cz', color: 'ef4444' },
  { key: 'into-the-breach', name: 'Into The Breach', tag: 'ITB', country: 'gb', color: '64748b' },
  { key: 'gamerlegion', name: 'GamerLegion', tag: 'GL', country: 'de', color: 'f97316' },
  { key: 'passion-ua', name: 'Passion UA', tag: 'PAS', country: 'ua', color: '0057b7' },
];
