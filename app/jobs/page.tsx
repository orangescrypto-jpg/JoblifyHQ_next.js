import type { Metadata } from 'next';
import MainLayout from '@/layouts/MainLayout';
import Jobs from '@/pages/Jobs';

const BASE_URL = 'https://joblifyhq.com';

export const metadata: Metadata = {
  title: 'Browse Jobs in Africa & Remote',
  description: 'Find full-time, part-time, contract and remote jobs in Nigeria, Ghana, Kenya and across Africa. New listings added daily on JoblifyHQ.',
  keywords: ['jobs in Nigeria', 'jobs in Ghana', 'jobs in Kenya', 'remote jobs Africa', 'full-time jobs', 'contract jobs', 'job listings Africa'],
  alternates: { canonical: `${BASE_URL}/jobs` },
  openGraph: {
    title: 'Browse Jobs in Africa & Remote | JoblifyHQ',
    description: 'Find full-time, part-time, contract and remote jobs in Nigeria, Ghana, Kenya and across Africa. New listings added daily on JoblifyHQ.',
    url: `${BASE_URL}/jobs`,
    siteName: 'JoblifyHQ',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'JoblifyHQ' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@JoblifyHQ',
    title: 'Browse Jobs in Africa & Remote | JoblifyHQ',
    description: 'Find full-time, part-time, contract and remote jobs in Nigeria, Ghana, Kenya and across Africa. New listings added daily on JoblifyHQ.',
    images: ['/og-image.png'],
  },
};

export default function JobsPage() {
  return <MainLayout><Jobs /></MainLayout>;
}
