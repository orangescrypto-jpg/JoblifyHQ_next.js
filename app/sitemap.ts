import { MetadataRoute } from 'next';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

const BASE_URL = 'https://joblifyhq.com';

// Static routes with their priorities and change frequencies
const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE_URL,                        lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
  { url: `${BASE_URL}/jobs`,              lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
  { url: `${BASE_URL}/scholarships`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
  { url: `${BASE_URL}/blog`,              lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
  { url: `${BASE_URL}/salaries`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
  { url: `${BASE_URL}/remote-jobs`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
  { url: `${BASE_URL}/students`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
  { url: `${BASE_URL}/premium`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/contact`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/privacy-policy`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  { url: `${BASE_URL}/terms`,             lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
];

async function getJobUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      orderBy('postedAt', 'desc'),
      limit(500)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      url: `${BASE_URL}/jobs/${doc.id}`,
      lastModified: (doc.data().updatedAt as any)?.toDate?.() ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

async function getScholarshipUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const q = query(
      collection(db, 'scholarships'),
      where('status', '==', 'active'),
      orderBy('postedAt', 'desc'),
      limit(500)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      url: `${BASE_URL}/scholarships/${doc.id}`,
      lastModified: (doc.data().updatedAt as any)?.toDate?.() ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

async function getBlogUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const q = query(
      collection(db, 'blog'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(200)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      url: `${BASE_URL}/blog/${doc.id}`,
      lastModified: (doc.data().updatedAt as any)?.toDate?.() ?? new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobUrls, scholarshipUrls, blogUrls] = await Promise.all([
    getJobUrls(),
    getScholarshipUrls(),
    getBlogUrls(),
  ]);

  return [
    ...staticRoutes,
    ...jobUrls,
    ...scholarshipUrls,
    ...blogUrls,
  ];
}
