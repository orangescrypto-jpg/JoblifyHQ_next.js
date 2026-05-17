'use client';
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import MainLayout from '@/layouts/MainLayout';
import BlogDetails from '@/pages/BlogDetails';

const BASE_URL = 'https://joblifyhq.com';

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const snap = await getDoc(doc(db, 'blog', params.id));
    if (!snap.exists()) return { title: 'Article Not Found | JoblifyHQ' };
    const post = snap.data();
    const title = post.title || 'Career Article';
    const desc = post.summary || post.excerpt
      || `Read "${title}" on JoblifyHQ. Career advice, job tips and industry insights for African professionals.`;
    const image = post.image || post.coverImage || '/og-image.png';
    const publishedTime = post.publishedAt?.toDate?.()?.toISOString?.();
    return {
      title,
      description: desc,
      authors: post.author ? [{ name: post.author }] : undefined,
      alternates: { canonical: `${BASE_URL}/blog/${params.id}` },
      openGraph: {
        title: `${title} | JoblifyHQ`,
        description: desc,
        url: `${BASE_URL}/blog/${params.id}`,
        siteName: 'JoblifyHQ',
        images: [{ url: image, width: 1200, height: 630, alt: title }],
        type: 'article',
        publishedTime,
        authors: post.author ? [post.author] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        site: '@JoblifyHQ',
        title: `${title} | JoblifyHQ`,
        description: desc,
        images: [image],
      },
    };
  } catch {
    return { title: 'Blog Post | JoblifyHQ' };
  }
}

export default function BlogDetailsPage() {
  return <MainLayout><BlogDetails /></MainLayout>;
}
