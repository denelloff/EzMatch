import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { prisma } from './db';
import type { UserRole } from '@ppanel/db';

export const SESSION_COOKIE = 'ppanel_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Sliding window: a session older than this gets its expiry pushed forward. */
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

/**
 * The cookie carries the raw token; the database stores only its hash. A dump of
 * the sessions table therefore cannot be replayed to impersonate anyone.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const headerList = await headers();

  await prisma.session.create({
    data: {
      id: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      userAgent: headerList.get('user-agent')?.slice(0, 512) ?? null,
      ip: clientIp(headerList),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .delete({ where: { id: hashToken(token) } })
      .catch(() => undefined);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (session.user.disabledAt) return null;

  if (session.expiresAt.getTime() - Date.now() < SESSION_TTL_MS - REFRESH_AFTER_MS) {
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
  }

  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role,
  };
}

function clientIp(headerList: Headers): string | null {
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim().slice(0, 45);
  return headerList.get('x-real-ip')?.slice(0, 45) ?? null;
}

