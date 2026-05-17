import type { Metadata } from 'next';
import MainLayout from '@/layouts/MainLayout';
import GlobalRemoteJobs from '@/pages/GlobalRemoteJobs';

const BASE_URL = 'https://joblifyhq.com';

export const metadata: Metadata = {
  title: 'Remote Jobs – Work From Anywhere',
  description: 'Find remote and work-from-home jobs open to candidates in Africa. Global remote opportunities across tech, marketing, design and more on JoblifyHQ.',
  keywords: ['remote jobs Africa', 'work from home Nigeria', 'remote work Ghana', 'global remote jobs', 'online jobs Africa', 'digital nomad jobs'],
  alternates: { canonical: `${BASE_URL}/remote-jobs` },
  openGraph: {
    title: 'Remote Jobs – Work From Anywhere | JoblifyHQ',
    description: 'Find remote and work-from-home jobs open to candidates in Africa. Global remote opportunities across tech, marketing, design and more on JoblifyHQ.',
    url: `${BASE_URL}/remote-jobs`,
    siteName: 'JoblifyHQ',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'JoblifyHQ' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@JoblifyHQ',
    title: 'Remote Jobs – Work From Anywhere | JoblifyHQ',
    description: 'Find remote and work-from-home jobs open to candidates in Africa. Global remote opportunities across tech, marketing, design and more on JoblifyHQ.',
    images: ['/og-image.png'],
  },
};

export default function RemoteJobsPage() {
  return <MainLayout><GlobalRemoteJobs /></MainLayout>;
}
