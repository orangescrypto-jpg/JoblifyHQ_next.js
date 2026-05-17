/**
 * Server-side data fetchers — run on the server, never ship to the browser.
 * Import these in Server Components (no 'use client' directive).
 */

import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Job, Scholarship, BlogPost } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(val: unknown): string {
  if (!val) return '';
  if (val instanceof Timestamp) return ((val) as any).toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return '';
}

function serializeJob(id: string, data: Record<string, unknown>): Job {
  return {
    id,
    title: (data.title as string) || '',
    company: (data.company as string) || '',
    location: (data.location as string) || '',
    type: (data.type as string) || '',
    salary: (data.salary as string) || undefined,
    description: (data.description as string) || '',
    requirements: (data.requirements as string[]) || [],
    benefits: (data.benefits as string[]) || [],
    tags: (data.tags as string[]) || [],
    logo: (data.logo as string) || undefined,
    postedAt: toDate(data.postedAt),
    deadline: (data.deadline as string) || undefined,
    isRemote: (data.isRemote as boolean) || false,
    isFeatured: (data.isFeatured as boolean) || false,
    isPromoted: (data.isPromoted as boolean) || false,
    status: (data.status as Job['status']) || 'active',
    employerId: (data.employerId as string) || undefined,
    applicationCount: (data.applicationCount as number) || 0,
    externalUrl: (data.externalUrl as string) || undefined,
  };
}

function serializeScholarship(id: string, data: Record<string, unknown>): Scholarship {
  return {
    id,
    title: (data.title as string) || '',
    provider: (data.provider as string) || '',
    amount: (data.amount as string) || '',
    deadline: (data.deadline as string) || '',
    description: (data.description as string) || '',
    eligibility: (data.eligibility as string[]) || [],
    tags: (data.tags as string[]) || [],
    logo: (data.logo as string) || undefined,
    postedAt: toDate(data.postedAt),
    country: (data.country as string) || undefined,
    level: (data.level as string) || undefined,
    status: (data.status as Scholarship['status']) || 'active',
    externalUrl: (data.externalUrl as string) || undefined,
  };
}

function serializeBlogPost(id: string, data: Record<string, unknown>): BlogPost {
  return {
    id,
    title: (data.title as string) || '',
    excerpt: (data.excerpt as string) || '',
    content: (data.content as string) || '',
    author: (data.author as string) || '',
    authorPhoto: (data.authorPhoto as string) || undefined,
    coverImage: (data.coverImage as string) || undefined,
    tags: (data.tags as string[]) || [],
    publishedAt: toDate(data.publishedAt),
    updatedAt: toDate(data.updatedAt),
    slug: (data.slug as string) || undefined,
    status: (data.status as BlogPost['status']) || 'published',
    views: (data.views as number) || 0,
  };
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function getJobs(limitCount = 20): Promise<Job[]> {
  try {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      orderBy('postedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => serializeJob(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error('getJobs error:', err);
    return [];
  }
}

export async function getJobById(id: string): Promise<Job | null> {
  try {
    const snap = await getDoc(doc(db, 'jobs', id));
    if (!snap.exists()) return null;
    return serializeJob(snap.id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.error('getJobById error:', err);
    return null;
  }
}

export async function getFeaturedJobs(limitCount = 6): Promise<Job[]> {
  try {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      where('isFeatured', '==', true),
      orderBy('postedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => serializeJob(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error('getFeaturedJobs error:', err);
    return [];
  }
}

export async function getRemoteJobs(limitCount = 20): Promise<Job[]> {
  try {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      where('isRemote', '==', true),
      orderBy('postedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => serializeJob(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error('getRemoteJobs error:', err);
    return [];
  }
}

// ─── Scholarships ─────────────────────────────────────────────────────────────

export async function getScholarships(limitCount = 20): Promise<Scholarship[]> {
  try {
    const q = query(
      collection(db, 'scholarships'),
      where('status', '==', 'active'),
      orderBy('postedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => serializeScholarship(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error('getScholarships error:', err);
    return [];
  }
}

export async function getScholarshipById(id: string): Promise<Scholarship | null> {
  try {
    const snap = await getDoc(doc(db, 'scholarships', id));
    if (!snap.exists()) return null;
    return serializeScholarship(snap.id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.error('getScholarshipById error:', err);
    return null;
  }
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export async function getBlogPosts(limitCount = 12): Promise<BlogPost[]> {
  try {
    const q = query(
      collection(db, 'blog'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => serializeBlogPost(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error('getBlogPosts error:', err);
    return [];
  }
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const snap = await getDoc(doc(db, 'blog', id));
    if (!snap.exists()) return null;
    return serializeBlogPost(snap.id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.error('getBlogPostById error:', err);
    return null;
  }
}
