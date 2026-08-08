import { resolve } from 'node:path';
import type { NextConfig } from 'next';

/**
 * Every app in the monorepo shares one .env at the repository root. Next only
 * looks inside its own directory, and passing --env-file is not an option
 * because the dev server forwards node flags through NODE_OPTIONS, which
 * rejects that flag. Loading it from the config runs early enough for the
 * server runtime and for anything the workers inherit.
 */
try {
  process.loadEnvFile(resolve(process.cwd(), '../../.env'));
} catch {
  // No root .env: the environment is expected to be populated already.
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js generates AGENTS.md and CLAUDE.md next to the app otherwise, which
  // is not something this repository wants checked in.
  agentRules: false,
  // Reaching the dev server through pm.denello.ru (reverse proxy) needs that
  // origin listed, or Next refuses to serve dev assets.
  allowedDevOrigins: [
    'pm.denello.ru',
    ...(process.env.PANEL_DEV_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ],
  // Prisma and the workspace packages ship as real Node modules; bundling them
  // into the server build breaks the driver adapter's native bindings.
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-mariadb', 'mariadb'],
  transpilePackages: ['@ppanel/protocol'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // Next.js App Router injects inline bootstrap/hydration scripts
            // (`self.__next_f.push`, …). Without 'unsafe-inline' (or a per-request
            // nonce middleware) those are blocked, React never hydrates, and every
            // client onClick — including Delete — does nothing. Styles need
            // 'unsafe-inline' for Next's own style injection; 'unsafe-eval' only
            // in development for React's error overlays.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://flagcdn.com",
              "connect-src 'self'",
              "font-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
