import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { AuthProvider }     from '@/context/AuthContext';
import { DashboardProvider } from '@/context/DashboardContext';
import { PlatformProvider }  from '@/context/PlatformContext';
import ErrorBoundary         from '@/components/common/ErrorBoundary';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://joblifyhq.com'),
  title: {
    default: 'JoblifyHQ | Jobs, Freelance & Scholarships in Africa',
    template: '%s | JoblifyHQ',
  },
  description: 'Africa\'s #1 job board and freelance marketplace. Find jobs, post gigs, hire talent, and grow your career across Nigeria, Ghana, Kenya, South Africa and more.',
  keywords: [
    'jobs in Africa', 'freelance Nigeria', 'scholarships Africa', 'remote jobs Africa',
    'hire freelancers Nigeria', 'escrow freelance Africa', 'JoblifyHQ',
    'jobs Ghana', 'jobs Kenya', 'career Africa', 'salary portal Africa',
  ],
  authors: [{ name: 'JoblifyHQ', url: 'https://joblifyhq.com' }],
  creator: 'JoblifyHQ',
  openGraph: {
    type: 'website', locale: 'en_US',
    url: 'https://joblifyhq.com', siteName: 'JoblifyHQ',
    title: 'JoblifyHQ | Jobs, Freelance & Scholarships in Africa',
    description: 'Africa\'s #1 job board and freelance marketplace with escrow protection.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'JoblifyHQ' }],
  },
  twitter: {
    card: 'summary_large_image', site: '@JoblifyHQ',
    title: 'JoblifyHQ | Africa\'s #1 Job & Freelance Marketplace',
    description: 'Find jobs, hire freelancers, pay securely with escrow.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <PlatformProvider>
            <AuthProvider>
              <DashboardProvider>
                {children}
              </DashboardProvider>
            </AuthProvider>
          </PlatformProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
