import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionUser, type SessionUser } from './session';
import { prisma } from './db';
import type { UserRole } from '@ppanel/db';

const ROLE_RANK: Record<UserRole, number> = {
  VIEWER: 0,
  OPERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function hasRole(user: SessionUser, minimum: UserRole): boolean {
  return ROLE_RANK[user.role] >= ROLE_RANK[minimum];
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(minimum: UserRole): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasRole(user, minimum)) redirect('/login?denied=1');
  return user;
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** For server actions, where redirecting on failure would hide the reason. */
export async function assertRole(minimum: UserRole): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ForbiddenError('Not signed in');
  if (!hasRole(user, minimum)) throw new ForbiddenError();
  return user;
}

export async function audit(
  user: SessionUser | null,
  action: string,
  targetType: string,
  targetId: string | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: user?.id ?? null,
      action,
      targetType,
      targetId,
      meta: meta ? (meta as object) : undefined,
    },
  });
}
