import type { Metadata } from 'next';
import MainLayout from '@/layouts/MainLayout';
import Contact from '@/pages/Contact';

const BASE_URL = 'https://joblifyhq.com';

export const metadata: Metadata = {
  title: 'Contact JoblifyHQ',
  description: 'Get in touch with the JoblifyHQ team. We\'re here to help with job listings, partnerships, employer accounts and support.',
  keywords: ['contact JoblifyHQ', 'JoblifyHQ support', 'JoblifyHQ partnership'],
  alternates: { canonical: `${BASE_URL}/contact` },
  openGraph: {
    title: 'Contact JoblifyHQ | JoblifyHQ',
    description: 'Get in touch with the JoblifyHQ team. We\'re here to help with job listings, partnerships, employer accounts and support.',
    url: `${BASE_URL}/contact`,
    siteName: 'JoblifyHQ',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'JoblifyHQ' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@JoblifyHQ',
    title: 'Contact JoblifyHQ | JoblifyHQ',
    description: 'Get in touch with the JoblifyHQ team. We\'re here to help with job listings, partnerships, employer accounts and support.',
    images: ['/og-image.png'],
  },
};

export default function ContactPage() {
  return <MainLayout><Contact /></MainLayout>;
}
