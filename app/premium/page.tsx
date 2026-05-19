import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import MainLayout from '@/layouts/MainLayout';
import Premium from '@/pages/Premium';

const BASE_URL = 'https://joblifyhq.com';

export const metadata: Metadata = {
  title: 'Premium Plans – JoblifyHQ',
  description: 'Unlock JoblifyHQ Premium. Get early access to top jobs, featured profile, priority applications and exclusive career resources.',
  keywords: ['JoblifyHQ premium', 'premium job platform Africa', 'featured profile', 'priority job applications'],
  alternates: { canonical: `${BASE_URL}/premium` },
  openGraph: {
    title: 'Premium Plans – JoblifyHQ | JoblifyHQ',
    description: 'Unlock JoblifyHQ Premium. Get early access to top jobs, featured profile, priority applications and exclusive career resources.',
    url: `${BASE_URL}/premium`,
    siteName: 'JoblifyHQ',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'JoblifyHQ' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@JoblifyHQ',
    title: 'Premium Plans – JoblifyHQ | JoblifyHQ',
    description: 'Unlock JoblifyHQ Premium. Get early access to top jobs, featured profile, priority applications and exclusive career resources.',
    images: ['/og-image.png'],
  },
};

export default function PremiumPage() {
  return <MainLayout><Premium /></MainLayout>;
}
