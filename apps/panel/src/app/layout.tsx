import type { Metadata } from 'next';
import { IBM_Plex_Sans, Manrope } from 'next/font/google';
import { getLocale } from '@/lib/i18n';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'eZ-Match',
  description: 'Control panel for Counter-Strike 2 servers and matches',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${ibmPlexSans.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
