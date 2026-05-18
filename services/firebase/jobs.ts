import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, where, orderBy,
  limit, startAfter, Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';

const PAGE_SIZE = 20;

/**
 * Fetch jobs from Firestore.
 *
 * Status filter behaviour:
 * - If filters.status is explicitly set, filter by that value.
 * - If filters.status is 'all', skip the status filter entirely (shows everything).
 * - Default (homepage / jobs page): fetches ALL jobs so existing posts without
 *   a status field are still visible. New jobs created via createJob() will
 *   always have status:'active' set automatically.
 */

interface JobFilters {
  status?: string; type?: string; country?: string; category?: string;
  isRemote?: boolean; search?: string; activeHiringOnly?: boolean;
  [key: string]: unknown;
}
export const getJobs = async (filters: JobFilters = {}, pageLimit = PAGE_SIZE, lastDoc = null) => {
  let constraints = [orderBy('createdAt', 'desc')];

  // Only apply status filter when explicitly requested
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

  let jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;

  // JS-only: full-text search
  if (filters.search) {
    const s = filters.search.toLowerCase().trim();
    jobs = jobs.filter(j =>
      (j.title       || '').toLowerCase().includes(s) ||
      (j.company     || '').toLowerCase().includes(s) ||
      (j.description || '').toLowerCase().includes(s) ||
      (j.category    || '').toLowerCase().includes(s)
    );
  }

  // JS-only: posted within last 7 days
  if (filters.activeHiringOnly) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    jobs = jobs.filter(j => {
      const posted = j.createdAt?.seconds
        ? j.createdAt.seconds * 1000
        : new Date(j.createdAt).getTime();
      return posted >= sevenDaysAgo;
    });
  }

  return { jobs, lastDoc: newLastDoc, hasMore: snapshot.docs.length === pageLimit };
};

export const getJobById = async (id: string) => {
  const docRef = doc(db, 'jobs', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  updateDoc(docRef, { views: (docSnap.data().views || 0) + 1, updatedAt: Timestamp.now() }).catch(() => {});
  return { id: docSnap.id, ...docSnap.data() } as any;
};

export const createJob = async (jobData, userId) => {
  const docRef = await addDoc(collection(db, 'jobs'), {
    ...jobData,
    postedBy: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    applications: 0,
    views: 0,
    isFeatured: false,
    isRemote: jobData.isRemote || false,
    status: 'active', // always set on new jobs
  });
  return docRef.id;
};

export const updateJob = async (id: string, updates: Record<string, unknown>) => {
  await updateDoc(doc(db, 'jobs', id), {
    ...updates,
    status: updates.status || 'active', // ensure job is always visible
    updatedAt: Timestamp.now()
  });
};

export const deleteJob = async (id: string) => {
  await deleteDoc(doc(db, 'jobs', id));
};

export const getEmployerJobs = async (userId: string) => {
  const q = query(
    collection(db, 'jobs'),
    where('postedBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const boostJob = async (id: string, userId: string, durationDays = 14) => {
  const jobRef = doc(db, 'jobs', id);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) throw new Error('Job not found');
  await updateDoc(jobRef, {
    isFeatured: true,
    featuredUntil: Timestamp.fromMillis(Date.now() + durationDays * 24 * 60 * 60 * 1000),
    updatedAt: Timestamp.now(),
  });
};

export const createReferral = async (jobId, referrerId, friendEmail) => {
  const docRef = await addDoc(collection(db, 'referrals'), {
    jobId, referrerId, friendEmail, createdAt: Timestamp.now(), status: 'pending',
  });
  return docRef.id;
};

export const getReferralCount = async (userId: string) => {
  const q = query(collection(db, 'referrals'), where('referrerId', '==', userId));
  const snap = await getDocs(q);
  return snap.size;
};

const TIER_RANK: Record<string, number> = { 'premium-annual': 0, 'premium': 1, 'free': 2, 'undefined': 3 };
export const sortApplicationsByBoost = (applications) =>
  [...applications].sort((a, b) => {
    const tierDiff = (TIER_RANK[a.applicantTier] ?? 3) - (TIER_RANK[b.applicantTier] ?? 3);
    if (tierDiff !== 0) return tierDiff;
    return (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0);
  });
