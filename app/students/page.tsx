import type { Metadata } from 'next';
import MainLayout from '@/layouts/MainLayout';
import Students from '@/pages/Students';

const BASE_URL = 'https://joblifyhq.com';

export const metadata: Metadata = {
  title: 'Student Hub – Internships & Graduate Jobs',
  description: 'Internships, graduate programs, scholarships and career resources tailored for African students. Kickstart your career with JoblifyHQ.',
  keywords: ['internships Africa', 'graduate jobs Nigeria', 'student jobs Africa', 'NYSC jobs', 'entry level jobs Africa', 'graduate programs'],
  alternates: { canonical: `${BASE_URL}/students` },
  openGraph: {
    title: 'Student Hub – Internships & Graduate Jobs | JoblifyHQ',
    description: 'Internships, graduate programs, scholarships and career resources tailored for African students. Kickstart your career with JoblifyHQ.',
    url: `${BASE_URL}/students`,
    siteName: 'JoblifyHQ',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'JoblifyHQ' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@JoblifyHQ',
    title: 'Student Hub – Internships & Graduate Jobs | JoblifyHQ',
    description: 'Internships, graduate programs, scholarships and career resources tailored for African students. Kickstart your career with JoblifyHQ.',
    images: ['/og-image.png'],
  },
};

export default function StudentsPage() {
  return <MainLayout><Students /></MainLayout>;
}
