// src/services/providers/firebase/scholarships.ts
// ─── Firebase Scholarships Provider ──────────────────────────────────────────
// All Firebase scholarship logic lives here. Nothing outside this folder touches Firebase.

import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, where, orderBy,
  limit, Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Scholarship } from '@/types';

export interface ScholarshipFilters {
  category?: string;
  country?: string;
  funding?: string;
  search?: string;
  [key: string]: unknown;
}

export const ScholarshipsService = {

  async getScholarships(filters: ScholarshipFilters = {}, limitCount = 20): Promise<Scholarship[]> {
    let constraints: any[] = [orderBy('createdAt', 'desc'), limit(limitCount)];

    if (filters.category) constraints.push(where('category', '==', filters.category));
    if (filters.country)  constraints.push(where('country', '==', filters.country));
    if (filters.funding)  constraints.push(where('funding', '==', filters.funding));

    const q = query(collection(db, 'scholarships'), ...constraints);
    const snapshot = await getDocs(q);
    let scholarships = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Scholarship[];

    if (filters.search) {
      const s = filters.search.toLowerCase().trim();
      scholarships = scholarships.filter(sch =>
        (sch.title    || '').toLowerCase().includes(s) ||
        (sch.provider || '').toLowerCase().includes(s) ||
        (sch.description || '').toLowerCase().includes(s)
      );
    }

    return scholarships;
  },

  async getScholarshipById(id: string): Promise<Scholarship | null> {
    const docRef = doc(db, 'scholarships', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    updateDoc(docRef, {
      views: (docSnap.data().views || 0) + 1,
      updatedAt: Timestamp.now(),
    }).catch(() => {});
    return { id: docSnap.id, ...docSnap.data() } as Scholarship;
  },

  async getEmployerScholarships(userId: string): Promise<Scholarship[]> {
    const q = query(
      collection(db, 'scholarships'),
      where('postedBy', '==', userId)
    );
    const snapshot = await getDocs(q);
    const scholarships = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Scholarship[];
    return scholarships.sort((a: any, b: any) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  },

  async createScholarship(data: Partial<Scholarship>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'scholarships'), {
      ...data,
      postedBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      applications: 0,
      views: 0,
      isFeatured: false,
      status: 'active',
    });
    return docRef.id;
  },

  async updateScholarship(id: string, updates: Partial<Scholarship>): Promise<void> {
    await updateDoc(doc(db, 'scholarships', id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteScholarship(id: string): Promise<void> {
    await deleteDoc(doc(db, 'scholarships', id));
  },

  async boostScholarship(id: string, userId: string, durationDays = 14): Promise<void> {
    const schRef = doc(db, 'scholarships', id);
    const schSnap = await getDoc(schRef);
    if (!schSnap.exists()) throw new Error('Scholarship not found');
    if (schSnap.data().postedBy !== userId) throw new Error('Unauthorized');
    await updateDoc(schRef, {
      isFeatured: true,
      featuredUntil: Timestamp.fromMillis(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      updatedAt: Timestamp.now(),
    });
  },
};
