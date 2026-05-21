import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import MainLayout from '@/layouts/MainLayout';
import ScholarshipDetails from '@/pages/ScholarshipDetails';

const BASE_URL = 'https://joblifyhq.com';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
  const { id } = await params
): Promise<Metadata> {
  try {
    const snap = await getDoc(doc(db, 'scholarships', id)); // ✅ Fixed: was 'jobs'
    if (!snap.exists()) return { title: 'Scholarship Not Found | JoblifyHQ' };
    const s = snap.data();
    const org = s.org || s.company || 'Organization';
    const title = `${s.title} by ${org}`;
    const desc = `Apply for ${s.title} by ${org}. Find this and more scholarships on JoblifyHQ.`;
    return {
      title,
      description: desc,
      alternates: { canonical: `${BASE_URL}/scholarships/${id}` },
      openGraph: {
        title: `${title} | JoblifyHQ`,
        description: desc,
        url: `${BASE_URL}/scholarships/${id}`,
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
  return <MainLayout><ScholarshipDetails /></MainLayout>; // ✅ Fixed: was JobDetails
}
