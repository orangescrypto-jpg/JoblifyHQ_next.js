import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { DashboardProvider } from '@/context/DashboardContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://joblifyhq.com'),
  title: {
    default: 'JoblifyHQ | Jobs, Scholarships & Career Insights in Africa',
    template: '%s | JoblifyHQ',
  },
  description: 'Find the best jobs, scholarships, and career resources in Africa and beyond. JoblifyHQ connects talent with opportunity across Nigeria, Ghana, Kenya, and more.',
  keywords: [
    'jobs in Africa', 'scholarships in Africa', 'careers Nigeria', 'remote jobs Africa',
    'internships', 'employment', 'JoblifyHQ', 'jobs Ghana', 'jobs Kenya',
    'career resources', 'salary portal Africa', 'African scholarships',
  ],
  authors: [{ name: 'JoblifyHQ', url: 'https://joblifyhq.com' }],
  creator: 'JoblifyHQ',
  publisher: 'JoblifyHQ',
  alternates: {
    canonical: 'https://joblifyhq.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://joblifyhq.com',
    siteName: 'JoblifyHQ',
    title: 'JoblifyHQ | Jobs, Scholarships & Career Insights in Africa',
    description: 'Find the best jobs, scholarships, and career resources in Africa. JoblifyHQ connects talent with opportunity.',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'JoblifyHQ – Jobs & Scholarships in Africa' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@JoblifyHQ',
    creator: '@JoblifyHQ',
    title: 'JoblifyHQ | Jobs, Scholarships & Career Insights in Africa',
    description: 'Find jobs, scholarships, and career resources on JoblifyHQ.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    // Add your Google Search Console verification token here
    // google: 'your-google-verification-token',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <DashboardProvider>
              {children}
            </DashboardProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
