// src/services/providers/firebase/gigs.ts
// ─── Freelance Gig Service ────────────────────────────────────────────────────

import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, where, orderBy,
  limit, startAfter, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Gig, Proposal, GigStatus, ProposalStatus } from '@/types';

const PAGE_SIZE = 20;

export interface GigFilters {
  status?: GigStatus | 'all';
  category?: string;
  country?: string;
  isRemote?: boolean;
  search?: string;
  budgetMin?: number;
  budgetMax?: number;
  clientId?: string;
}

export const GigsService = {

  async getGigs(filters: GigFilters = {}, pageLimit = PAGE_SIZE, lastDoc: any = null) {
    let constraints: any[] = [];

    if (filters.status && filters.status !== 'all') {
      constraints.push(where('status', '==', filters.status));
    } else if (!filters.clientId) {
      constraints.push(where('status', '==', 'open'));
    }

    if (filters.category)  constraints.push(where('category', '==', filters.category));
    if (filters.country)   constraints.push(where('country', '==', filters.country));
    if (filters.isRemote)  constraints.push(where('isRemote', '==', true));
    if (filters.clientId)  constraints.push(where('clientId', '==', filters.clientId));

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageLimit));
    if (lastDoc) constraints.push(startAfter(lastDoc));

    const q = query(collection(db, 'gigs'), ...constraints);
    const snap = await getDocs(q);

    let gigs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Gig[];
    const newLastDoc = snap.docs[snap.docs.length - 1] ?? null;

    if (filters.search) {
      const s = filters.search.toLowerCase().trim();
      gigs = gigs.filter(g =>
        g.title.toLowerCase().includes(s) ||
        g.description.toLowerCase().includes(s) ||
        g.skills.some(sk => sk.toLowerCase().includes(s))
      );
    }
    if (filters.budgetMin !== undefined) gigs = gigs.filter(g => g.budgetMax >= filters.budgetMin!);
    if (filters.budgetMax !== undefined) gigs = gigs.filter(g => g.budgetMin <= filters.budgetMax!);

    return { gigs, lastDoc: newLastDoc, hasMore: snap.docs.length === pageLimit };
  },

  async getGigById(id: string): Promise<Gig | null> {
    const snap = await getDoc(doc(db, 'gigs', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Gig;
  },

  async createGig(data: Omit<Gig, 'id' | 'createdAt' | 'updatedAt'>, needsApproval: boolean): Promise<string> {
    const ref = await addDoc(collection(db, 'gigs'), {
      ...data,
      status: needsApproval ? 'pending_review' : 'open',
      proposalCount: 0,
      isFeatured: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async updateGig(id: string, updates: Partial<Gig>): Promise<void> {
    await updateDoc(doc(db, 'gigs', id), { ...updates, updatedAt: serverTimestamp() });
  },

  async deleteGig(id: string): Promise<void> {
    await deleteDoc(doc(db, 'gigs', id));
  },

  async getFeaturedGigs(limitCount = 6): Promise<Gig[]> {
    const q = query(
      collection(db, 'gigs'),
      where('status', '==', 'open'),
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Gig[];
  },

  // ── Proposals ──────────────────────────────────────────────────────────────

  async submitProposal(data: Omit<Proposal, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const ref = await addDoc(collection(db, 'proposals'), {
      ...data,
      status: 'pending' as ProposalStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Increment proposal count
    await updateDoc(doc(db, 'gigs', data.gigId), {
      proposalCount: (await getDoc(doc(db, 'gigs', data.gigId))).data()?.proposalCount + 1 || 1,
    });
    return ref.id;
  },

  async getProposalsForGig(gigId: string): Promise<Proposal[]> {
    const q = query(collection(db, 'proposals'), where('gigId', '==', gigId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Proposal[];
  },

  async getFreelancerProposals(freelancerId: string): Promise<Proposal[]> {
    const q = query(collection(db, 'proposals'), where('freelancerId', '==', freelancerId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Proposal[];
  },

  async updateProposalStatus(proposalId: string, status: ProposalStatus): Promise<void> {
    await updateDoc(doc(db, 'proposals', proposalId), { status, updatedAt: serverTimestamp() });
  },

  async acceptProposal(proposalId: string, gigId: string, freelancerId: string): Promise<void> {
    // Accept proposal, reject others, update gig
    await updateDoc(doc(db, 'proposals', proposalId), { status: 'accepted', updatedAt: serverTimestamp() });
    await updateDoc(doc(db, 'gigs', gigId), {
      status: 'in_progress',
      assignedFreelancerId: freelancerId,
      assignedProposalId: proposalId,
      updatedAt: serverTimestamp(),
    });
    // Reject all other proposals
    const others = query(collection(db, 'proposals'),
      where('gigId', '==', gigId),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(others);
    const rejects = snap.docs.filter(d => d.id !== proposalId);
    await Promise.all(rejects.map(d => updateDoc(d.ref, { status: 'rejected', updatedAt: serverTimestamp() })));
  },
};
