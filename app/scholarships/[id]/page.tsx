'use client';
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import MainLayout from '@/layouts/MainLayout';
import ScholarshipDetails from '@/pages/ScholarshipDetails';

const BASE_URL = 'https://joblifyhq.com';

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const snap = await getDoc(doc(db, 'scholarships', params.id));
    if (!snap.exists()) return { title: 'Scholarship Not Found | JoblifyHQ' };
    const s = snap.data();
    const title = s.title || 'Scholarship Opportunity';
    const org = s.org || s.provider || '';
    const country = s.country || '';
    const orgPart = org ? ` offered by ${org}` : '';
    const countryPart = country ? ` in ${country}` : '';
    const desc = `Apply for the ${title}${orgPart}${countryPart}. Find eligibility, deadlines and how to apply on JoblifyHQ.`;
    return {
      title,
      description: desc,
      alternates: { canonical: `${BASE_URL}/scholarships/${params.id}` },
      openGraph: {
        title: `${title} | JoblifyHQ`,
        description: desc,
        url: `${BASE_URL}/scholarships/${params.id}`,
        siteName: 'JoblifyHQ',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        site: '@JoblifyHQ',
        title: `${title} | JoblifyHQ`,
        description: desc,
        images: ['/og-image.png'],
      },
    };
  } catch {
    return { title: 'Scholarship Details | JoblifyHQ' };
  }
}

export default function ScholarshipDetailsPage() {
  return <MainLayout><ScholarshipDetails /></MainLayout>;
}
