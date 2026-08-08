import 'server-only';

import { decryptSecret, encryptSecret, loadMasterKey } from '@ppanel/db';
import { randomBytes } from 'node:crypto';

let cached: Buffer | null = null;

function masterKey(): Buffer {
  cached ??= loadMasterKey();
  return cached;
}

/**
 * Encrypts a value for storage. GSLT / RCON stay hub-only when possible; match
 * join passwords are also unsealed in the panel for the connect copy button.
 */
export function seal(plaintext: string): string {
  return encryptSecret(plaintext, masterKey());
}

/** Decrypts a sealed secret. Empty ciphertext → empty string. */
export function unseal(encoded: string): string {
  if (!encoded) return '';
  return decryptSecret(encoded, masterKey());
}

/** Base64url, so it survives being pasted into a config file or an env var. */
export function generatePassword(bytes = 18): string {
  return randomBytes(bytes).toString('base64url');
}
