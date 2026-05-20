// src/services/providers/firebase/jobs.ts
// ─── Firebase Jobs Provider ───────────────────────────────────────────────────
// All Firebase job logic lives here. Nothing outside this folder touches Firebase.

import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, where, orderBy,
  limit, startAfter, Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Job } from '@/types';

const PAGE_SIZE = 20;

export interface JobFilters {
  status?: string;
  type?: string;
  country?: string;
  category?: string;
  isRemote?: boolean;
  search?: string;
  activeHiringOnly?: boolean;
  [key: string]: unknown;
}

export interface JobsPage {
  jobs: Job[];
  lastDoc: unknown;
  hasMore: boolean;
}

export const JobsService = {

  async getJobs(filters: JobFilters = {}, pageLimit = PAGE_SIZE, lastDoc: any = null): Promise<JobsPage> {
    let constraints: any[] = [orderBy('createdAt', 'desc')];

    if (filters.status && filters.status !== 'all') {
      constraints.unshift(where('status', '==', filters.status));
    }
    if (filters.type)     constraints.push(where('type', '==', filters.type));
    if (filters.country)  constraints.push(where('country', '==', filters.country));
    if (filters.category) constraints.push(where('category', '==', filters.category));
    if (filters.isRemote) constraints.push(where('isRemote', '==', true));

    constraints.push(limit(pageLimit));
    if (lastDoc) constraints.push(startAfter(lastDoc));

    const q = query(collection(db, 'jobs'), ...constraints);
    const snapshot = await getDocs(q);

    let jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Job[];
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;

    if (filters.search) {
      const s = filters.search.toLowerCase().trim();
      jobs = jobs.filter(j =>
        (j.title       || '').toLowerCase().includes(s) ||
        (j.company     || '').toLowerCase().includes(s) ||
        (j.description || '').toLowerCase().includes(s)
      );
    }

    if (filters.activeHiringOnly) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      jobs = jobs.filter(j => {
        const posted = (j.postedAt as any)?.seconds
          ? (j.postedAt as any).seconds * 1000
          : new Date(j.postedAt as any).getTime();
        return posted >= sevenDaysAgo;
      });
    }

    return { jobs, lastDoc: newLastDoc, hasMore: snapshot.docs.length === pageLimit };
  },

  async getJobById(id: string): Promise<Job | null> {
    const docRef = doc(db, 'jobs', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    updateDoc(docRef, { views: (docSnap.data().views || 0) + 1, updatedAt: Timestamp.now() }).catch(() => {});
    return { id: docSnap.id, ...docSnap.data() } as Job;
  },

  async getFeaturedJobs(limitCount = 6): Promise<Job[]> {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Job[];
  },

  async getRemoteJobs(limitCount = 20): Promise<Job[]> {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      where('isRemote', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Job[];
  },

  async getEmployerJobs(userId: string): Promise<Job[]> {
    const q = query(
      collection(db, 'jobs'),
      where('postedBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Job[];
  },

  async createJob(jobData: Partial<Job>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...jobData,
      postedBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      applications: 0,
      views: 0,
      isFeatured: false,
      isRemote: jobData.isRemote || false,
      status: 'active',
    });
    return docRef.id;
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<void> {
    await updateDoc(doc(db, 'jobs', id), {
      ...updates,
      status: updates.status || 'active',
      updatedAt: Timestamp.now(),
    });
  },

  async deleteJob(id: string): Promise<void> {
    await deleteDoc(doc(db, 'jobs', id));
  },

  async boostJob(id: string, userId: string, durationDays = 14): Promise<void> {
    const jobRef = doc(db, 'jobs', id);
    const jobSnap = await getDoc(jobRef);
    if (!jobSnap.exists()) throw new Error('Job not found');
    await updateDoc(jobRef, {
      isFeatured: true,
      featuredUntil: Timestamp.fromMillis(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      updatedAt: Timestamp.now(),
    });
  },

  async createReferral(jobId: string, referrerId: string, friendEmail: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'referrals'), {
      jobId, referrerId, friendEmail,
      createdAt: Timestamp.now(),
      status: 'pending',
    });
    return docRef.id;
  },

  async getReferralCount(userId: string): Promise<number> {
    const q = query(collection(db, 'referrals'), where('referrerId', '==', userId));
    const snap = await getDocs(q);
    return snap.size;
  },

  sortApplicationsByBoost(applications: any[]): any[] {
    const TIER_RANK: Record<string, number> = { 'premium-annual': 0, 'premium': 1, 'free': 2, 'undefined': 3 };
    return [...applications].sort((a, b) => {
      const tierDiff = (TIER_RANK[a.applicantTier] ?? 3) - (TIER_RANK[b.applicantTier] ?? 3);
      if (tierDiff !== 0) return tierDiff;
      return (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0);
    });
  },
};
