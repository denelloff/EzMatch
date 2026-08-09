import 'server-only';
import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';
import { promisify } from 'node:util';

// promisify resolves to the three-argument overload, which drops the options
// parameter we need for the cost factors.
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

// 2^15 iterations needs 128 * N * r = 32 MiB of memory, which is above Node's
// 32 MiB default, hence the explicit maxmem.
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LEN = 64;
const MAX_MEM = 96 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, KEY_LEN, {
    N,
    r: R,
    p: P,
    maxmem: MAX_MEM,
  })) as Buffer;
  return [
    'scrypt',
    N,
    R,
    P,
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const n = Number.parseInt(parts[1]!, 10);
  const r = Number.parseInt(parts[2]!, 10);
  const p = Number.parseInt(parts[3]!, 10);
  const salt = Buffer.from(parts[4]!, 'base64url');
  const expected = Buffer.from(parts[5]!, 'base64url');
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }

  const derived = (await scryptAsync(password, salt, expected.length, {
    N: n,
    r,
    p,
    maxmem: MAX_MEM,
  })) as Buffer;
  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}
