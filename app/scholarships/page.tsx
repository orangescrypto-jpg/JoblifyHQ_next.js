import type { Metadata } from 'next';
import MainLayout from '@/layouts/MainLayout';
import Scholarships from '@/pages/Scholarships';

const BASE_URL = 'https://joblifyhq.com';

export const metadata: Metadata = {
  title: 'Scholarships for African Students',
  description: 'Discover fully-funded and partial scholarships for African students. Find undergraduate, postgraduate and PhD scholarships worldwide on JoblifyHQ.',
  keywords: ['scholarships Africa', 'fully funded scholarships', 'scholarships Nigeria', 'postgraduate scholarships', 'PhD scholarships', 'study abroad Africa'],
  alternates: { canonical: `${BASE_URL}/scholarships` },
  openGraph: {
    title: 'Scholarships for African Students | JoblifyHQ',
    description: 'Discover fully-funded and partial scholarships for African students. Find undergraduate, postgraduate and PhD scholarships worldwide on JoblifyHQ.',
    url: `${BASE_URL}/scholarships`,
    siteName: 'JoblifyHQ',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'JoblifyHQ' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@JoblifyHQ',
    title: 'Scholarships for African Students | JoblifyHQ',
    description: 'Discover fully-funded and partial scholarships for African students. Find undergraduate, postgraduate and PhD scholarships worldwide on JoblifyHQ.',
    images: ['/og-image.png'],
  },
};

export default function ScholarshipsPage() {
  return <MainLayout><Scholarships /></MainLayout>;
}
