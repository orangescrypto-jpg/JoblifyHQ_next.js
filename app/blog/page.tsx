import type { Metadata } from 'next';
import MainLayout from '@/layouts/MainLayout';
import Blog from '@/pages/Blog';

const BASE_URL = 'https://joblifyhq.com';

export const metadata: Metadata = {
  title: 'Career Blog – Job Tips & Advice',
  description: 'Career advice, job search tips, interview guides and industry insights for African professionals. Expert articles from the JoblifyHQ team.',
  keywords: ['career advice Africa', 'job search tips', 'interview tips', 'career blog', 'CV tips Africa', 'professional development'],
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'Career Blog – Job Tips & Advice | JoblifyHQ',
    description: 'Career advice, job search tips, interview guides and industry insights for African professionals. Expert articles from the JoblifyHQ team.',
    url: `${BASE_URL}/blog`,
    siteName: 'JoblifyHQ',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'JoblifyHQ' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@JoblifyHQ',
    title: 'Career Blog – Job Tips & Advice | JoblifyHQ',
    description: 'Career advice, job search tips, interview guides and industry insights for African professionals. Expert articles from the JoblifyHQ team.',
    images: ['/og-image.png'],
  },
};

export default function BlogPage() {
  return <MainLayout><Blog /></MainLayout>;
}
