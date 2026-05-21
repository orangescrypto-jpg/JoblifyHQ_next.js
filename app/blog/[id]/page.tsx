import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import MainLayout from '@/layouts/MainLayout';
import BlogDetails from '@/pages/BlogDetails';

const BASE_URL = 'https://joblifyhq.com';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const snap = await getDoc(doc(db, 'blog', id));
    if (!snap.exists()) return { title: 'Blog Not Found | JoblifyHQ' };
    const post = snap.data();
    const title = post.title || 'Blog Post';
    const desc = post.excerpt || post.summary || `Read ${title} on JoblifyHQ.`;
    return {
      title,
      description: desc,
      alternates: { canonical: `${BASE_URL}/blog/${id}` },
      openGraph: {
        title: `${title} | JoblifyHQ`,
        description: desc,
        url: `${BASE_URL}/blog/${id}`,
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
    return { title: 'Blog Details | JoblifyHQ' };
  }
}

export default function BlogDetailsPage() {
  return <MainLayout><BlogDetails /></MainLayout>;
}
