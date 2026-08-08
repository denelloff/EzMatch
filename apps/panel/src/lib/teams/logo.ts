import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomBytes } from 'node:crypto';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'teams');
const PUBLIC_PREFIX = '/uploads/teams';

const ALLOWED = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/svg+xml', '.svg'],
  ['image/gif', '.gif'],
]);

const MAX_BYTES = 2 * 1024 * 1024;

export async function ensureTeamUploadDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export function teamLogoPublicUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null;
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
  if (logoPath.startsWith('/')) return logoPath;
  return `${PUBLIC_PREFIX}/${logoPath}`;
}

/** Writes an uploaded image; returns the public path (/uploads/teams/…). */
export async function saveTeamLogoUpload(
  file: File,
  preferredStem?: string,
): Promise<string> {
  if (file.size <= 0) throw new Error('Empty logo file');
  if (file.size > MAX_BYTES) throw new Error('Logo must be 2 MB or smaller');

  const ext = ALLOWED.get(file.type);
  if (!ext) {
    throw new Error('Logo must be PNG, JPEG, WebP, GIF or SVG');
  }

  await ensureTeamUploadDir();
  const stem =
    (preferredStem ?? randomBytes(8).toString('hex')).replace(/[^a-zA-Z0-9_-]/g, '') ||
    randomBytes(8).toString('hex');
  const filename = `${stem}${ext}`;
  const absolute = join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);
  return `${PUBLIC_PREFIX}/${filename}`;
}

/** Generates a simple badge SVG and returns its public path. */
export async function saveGeneratedTeamLogo(
  tag: string,
  colorHex: string,
  stem: string,
): Promise<string> {
  await ensureTeamUploadDir();
  const safe = stem.replace(/[^a-zA-Z0-9_-]/g, '') || randomBytes(6).toString('hex');
  const filename = `${safe}.svg`;
  const absolute = join(UPLOAD_DIR, filename);
  const color = /^[0-9a-fA-F]{6}$/.test(colorHex) ? colorHex : '3b82f6';
  const label = (tag || '?').slice(0, 6).toUpperCase();
  const fontSize = label.length > 4 ? 28 : 36;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="40" fill="#${color}"/>
  <text x="128" y="140" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff">${escapeXml(label)}</text>
</svg>
`;
  await writeFile(absolute, svg, 'utf8');
  return `${PUBLIC_PREFIX}/${filename}`;
}

export async function removeTeamLogoFile(logoPath: string | null | undefined): Promise<void> {
  if (!logoPath || !logoPath.startsWith(`${PUBLIC_PREFIX}/`)) return;
  const filename = logoPath.slice(PUBLIC_PREFIX.length + 1);
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return;
  }
  try {
    await unlink(join(UPLOAD_DIR, filename));
  } catch {
    // Missing file is fine.
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function extensionOf(path: string): string {
  return extname(path).toLowerCase();
}
