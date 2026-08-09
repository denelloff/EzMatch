import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
  createHash,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const PREFIX = 'v1';

export class SecretKeyError extends Error {}

/**
 * Reads the 32-byte master key used for field-level encryption of GSLT tokens,
 * RCON passwords and join passwords.
 */
export function loadMasterKey(raw = process.env.PPANEL_SECRET_KEY): Buffer {
  if (!raw) {
    throw new SecretKeyError(
      'PPANEL_SECRET_KEY is not set. Generate one with: openssl rand -base64 32',
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new SecretKeyError(
      `PPANEL_SECRET_KEY must decode to 32 bytes, got ${key.length}`,
    );
  }
  return key;
}

/** Returns `v1.<iv>.<tag>.<ciphertext>`, all base64url. */
export function encryptSecret(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

export function decryptSecret(encoded: string, key: Buffer): string {
  const parts = encoded.split('.');
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new SecretKeyError('Malformed encrypted value');
  }
  const iv = Buffer.from(parts[1]!, 'base64url');
  const tag = Buffer.from(parts[2]!, 'base64url');
  const ciphertext = Buffer.from(parts[3]!, 'base64url');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new SecretKeyError('Malformed encrypted value');
  }
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}

/** Agent tokens are stored as a hash so a database leak cannot control hosts. */
export function hashAgentToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function safeCompareHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

export function generateAgentToken(): { token: string; prefix: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, prefix: token.slice(0, 8) };
}

