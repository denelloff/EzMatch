'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSession, destroySession } from '@/lib/session';
import { rateLimit, resetRateLimit } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().min(3).max(254),
  password: z.string().min(1).max(1024),
});

export interface LoginState {
  error: string | null;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Enter an email address and a password.' };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';

  // Limit per address and per account, so one attacker cannot lock out a user
  // by hammering their email from many addresses, nor spray many accounts.
  for (const key of [`login:ip:${ip}`, `login:email:${email}`]) {
    const { allowed, retryAfterMs } = rateLimit(key, 10, 5 * 60_000);
    if (!allowed) {
      const seconds = Math.ceil(retryAfterMs / 1000);
      return { error: `Too many attempts. Try again in ${seconds}s.` };
    }
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run a verification so the response time does not reveal whether the
  // account exists.
  const stored =
    user?.passwordHash ??
    'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const ok = await verifyPassword(parsed.data.password, stored);

  if (!user || !ok || user.disabledAt) {
    return { error: 'Invalid email or password.' };
  }

  resetRateLimit(`login:ip:${ip}`);
  resetRateLimit(`login:email:${email}`);

  await createSession(user.id);
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'auth.login',
      targetType: 'user',
      targetId: user.id,
      ip,
    },
  });

  redirect('/');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}

