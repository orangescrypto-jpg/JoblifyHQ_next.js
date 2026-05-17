import type { Metadata } from 'next';
import MainLayout from '@/layouts/MainLayout';
import SalaryPortal from '@/pages/SalaryPortal';

const BASE_URL = 'https://joblifyhq.com';

export const metadata: Metadata = {
  title: 'Salary Portal – African Salary Data',
  description: 'Research salaries by role, industry and city across Africa. Compare pay for software engineers, marketers, accountants and more. Real salary data on JoblifyHQ.',
  keywords: ['salary Africa', 'salary Nigeria', 'average salary Kenya', 'software engineer salary Africa', 'salary comparison Africa', 'pay data Africa'],
  alternates: { canonical: `${BASE_URL}/salaries` },
  openGraph: {
    title: 'Salary Portal – African Salary Data | JoblifyHQ',
    description: 'Research salaries by role, industry and city across Africa. Compare pay for software engineers, marketers, accountants and more. Real salary data on JoblifyHQ.',
    url: `${BASE_URL}/salaries`,
    siteName: 'JoblifyHQ',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'JoblifyHQ' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@JoblifyHQ',
    title: 'Salary Portal – African Salary Data | JoblifyHQ',
    description: 'Research salaries by role, industry and city across Africa. Compare pay for software engineers, marketers, accountants and more. Real salary data on JoblifyHQ.',
    images: ['/og-image.png'],
  },
};

export default function SalariesPage() {
  return <MainLayout><SalaryPortal /></MainLayout>;
}
