import 'server-only';

import { encryptSecret, loadMasterKey } from '@ppanel/db';
import { randomBytes } from 'node:crypto';

let cached: Buffer | null = null;

function masterKey(): Buffer {
  cached ??= loadMasterKey();
  return cached;
}

/**
 * Encrypts a value for storage. The panel only ever encrypts: reading these
 * back is the hub's job, so a panel compromise cannot dump GSLT tokens.
 */
export function seal(plaintext: string): string {
  return encryptSecret(plaintext, masterKey());
}

/** Base64url, so it survives being pasted into a config file or an env var. */
export function generatePassword(bytes = 18): string {
  return randomBytes(bytes).toString('base64url');
}
