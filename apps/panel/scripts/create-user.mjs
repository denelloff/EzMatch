#!/usr/bin/env node
/**
 * Creates or updates a panel user.
 *
 *   node scripts/create-user.mjs                     # interactive
 *   node scripts/create-user.mjs a@b.c "Name" OWNER  # non-interactive, password prompted
 *
 * The password is always read from the terminal so it never lands in shell
 * history or a process listing.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, argv, exit, env } from 'node:process';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { getPrisma } from '@ppanel/db';

const scryptAsync = promisify(scrypt);
const ROLES = ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER'];

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64, {
    N: 2 ** 15,
    r: 8,
    p: 1,
    maxmem: 96 * 1024 * 1024,
  });
  return [
    'scrypt',
    2 ** 15,
    8,
    1,
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

async function readHidden(rl, prompt) {
  stdout.write(prompt);
  const wasRaw = stdin.isRaw;
  if (stdin.isTTY) stdin.setRawMode(true);

  let value = '';
  try {
    for await (const chunk of stdin) {
      const text = chunk.toString('utf8');
      if (text === '\r' || text === '\n') break;
      if (text === '\u0003') {
        stdout.write('\n');
        exit(130);
      }
      if (text === '\u007f' || text === '\b') {
        value = value.slice(0, -1);
        continue;
      }
      value += text;
    }
  } finally {
    if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
  }
  stdout.write('\n');
  return value;
}

async function main() {
  if (!env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Load your .env first.');
    exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const email = (argv[2] ?? (await rl.question('Email: '))).trim().toLowerCase();
    const displayName = (argv[3] ?? (await rl.question('Display name: '))).trim();
    const role = (argv[4] ?? (await rl.question(`Role (${ROLES.join('/')}) [OWNER]: `)))
      .trim()
      .toUpperCase() || 'OWNER';

    if (!email.includes('@')) throw new Error('Email looks invalid');
    if (!displayName) throw new Error('Display name is required');
    if (!ROLES.includes(role)) throw new Error(`Role must be one of ${ROLES.join(', ')}`);

    const password = await readHidden(rl, 'Password: ');
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }
    const confirm = await readHidden(rl, 'Confirm password: ');
    if (password !== confirm) throw new Error('Passwords do not match');

    const passwordHash = await hashPassword(password);
    const prisma = getPrisma();

    const user = await prisma.user.upsert({
      where: { email },
      create: { email, displayName, role, passwordHash },
      update: { displayName, role, passwordHash, disabledAt: null },
    });

    console.log(`\nUser ${user.email} saved with role ${user.role}.`);
    await prisma.$disconnect();
  } catch (error) {
    console.error(`\n${error instanceof Error ? error.message : String(error)}`);
    exit(1);
  } finally {
    rl.close();
  }
}

await main();

