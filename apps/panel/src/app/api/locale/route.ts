import { NextResponse } from 'next/server';
import { isLocale, LOCALE_COOKIE } from '@/lib/i18n/dictionaries';

/**
 * Prefer a relative Location. Absolute redirects built from `request.url`
 * point at the Node bind address (often localhost), which breaks the moment
 * the panel is reached through a reverse proxy hostname.
 */
function safeReturnPath(request: Request, form: FormData): string {
  const fromForm = form.get('return');
  if (typeof fromForm === 'string' && fromForm.startsWith('/') && !fromForm.startsWith('//')) {
    return fromForm;
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return `${url.pathname}${url.search}` || '/';
    } catch {
      // fall through
    }
  }

  return '/';
}

export async function POST(request: Request) {
  const form = await request.formData();
  const locale = form.get('locale');
  const path = safeReturnPath(request, form);

  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });

  if (isLocale(locale)) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      // Leave Secure unset: the panel is reached over both http://LAN and
      // https://proxy; a Secure cookie would silently fail on plain HTTP.
    });
  }

  return response;
}

