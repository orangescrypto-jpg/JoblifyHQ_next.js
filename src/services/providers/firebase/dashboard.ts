// src/services/providers/firebase/dashboard.ts
// ─── Firebase Dashboard Provider ─────────────────────────────────────────────
// All Firebase saved items and applications logic lives here.

import {
  collection, addDoc, getDocs, query,
  where, doc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Application, SavedItem, Job, Scholarship, ApplicationType } from '@/types';

export interface SubmitApplicationParams {
  userId: string;
  userEmail: string;
  userName: string;
  type: ApplicationType;
  opportunityId: string;
  title: string;
  org: string;
  cvUrl: string;
  coverLetter?: string;
}

export const DashboardService = {

  async fetchUserData(userId: string): Promise<{ savedJobs: SavedItem[]; savedScholarships: SavedItem[]; applications: Application[] }> {
    const [jobsSnap, schSnap, appsSnap] = await Promise.all([
      getDocs(query(collection(db, 'user_saves'), where('userId', '==', userId), where('type', '==', 'job'))),
      getDocs(query(collection(db, 'user_saves'), where('userId', '==', userId), where('type', '==', 'scholarship'))),
      getDocs(query(collection(db, 'applications'), where('userId', '==', userId))),
    ]);
    return {
      savedJobs:          jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SavedItem)),
      savedScholarships:  schSnap.docs.map(d => ({ id: d.id, ...d.data() } as SavedItem)),
      applications:       appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application)),
    };
  },

  async saveJob(userId: string, job: Job): Promise<SavedItem> {
    const ref = await addDoc(collection(db, 'user_saves'), {
      userId, type: 'job', jobId: job.id, itemData: job, savedAt: serverTimestamp(),
    });
    return { id: ref.id, userId, type: 'job', jobId: job.id, itemData: job, savedAt: null };
  },

  async unsaveItem(saveId: string): Promise<void> {
    await deleteDoc(doc(db, 'user_saves', saveId));
  },

  async saveScholarship(userId: string, sch: Scholarship): Promise<SavedItem> {
    const ref = await addDoc(collection(db, 'user_saves'), {
      userId, type: 'scholarship', scholarshipId: sch.id, itemData: sch, savedAt: serverTimestamp(),
    });
    return { id: ref.id, userId, type: 'scholarship', scholarshipId: sch.id, itemData: sch, savedAt: null };
  },

  async submitApplication(params: SubmitApplicationParams): Promise<string> {
    const ref = await addDoc(collection(db, 'applications'), {
      ...params,
      coverLetter: params.coverLetter || '',
      status: 'Submitted',
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async getApplicationsByOpportunity(opportunityId: string): Promise<Application[]> {
    const q = query(collection(db, 'applications'), where('opportunityId', '==', opportunityId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
  },
};
