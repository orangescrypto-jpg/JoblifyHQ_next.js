'use client';
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import MainLayout from '@/layouts/MainLayout';
import JobDetails from '@/pages/JobDetails';

const BASE_URL = 'https://joblifyhq.com';

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const snap = await getDoc(doc(db, 'jobs', params.id));
    if (!snap.exists()) return { title: 'Job Not Found | JoblifyHQ' };
    const job = snap.data();
    const company = job.company || job.org || 'Company';
    const title = `${job.title} at ${company}`;
    const location = job.location ? ` in ${job.location}` : '';
    const jobType = job.type ? ` ${job.type} role.` : '';
    const desc = `Apply for ${job.title} at ${company}${location}.${jobType} Find this and more on JoblifyHQ.`;
    return {
      title,
      description: desc,
      alternates: { canonical: `${BASE_URL}/jobs/${params.id}` },
      openGraph: {
        title: `${title} | JoblifyHQ`,
        description: desc,
        url: `${BASE_URL}/jobs/${params.id}`,
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
    return { title: 'Job Details | JoblifyHQ' };
  }
}

export default function JobDetailsPage() {
  return <MainLayout><JobDetails /></MainLayout>;
}
