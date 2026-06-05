// src/services/providers/firebase/escrow.ts
// ─── Escrow Service ───────────────────────────────────────────────────────────
// Manages escrow lifecycle: funding → in_progress → submitted → approved → released
// Nigerian users pay via bank transfer; others via Flutterwave/Paystack.

import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { EscrowTransaction, EscrowStatus, Dispute } from '@/types';

export const EscrowService = {

  async createEscrow(data: {
    gigId: string; gigTitle: string;
    clientId: string; clientName: string;
    freelancerId: string; freelancerName: string;
    proposalId: string;
    amount: number; currency: string;
    platformFeePercent: number;
    paymentMethod: 'bank_transfer' | 'flutterwave' | 'paystack';
  }): Promise<string> {
    const platformFee = Math.round(data.amount * data.platformFeePercent / 100);
    const ref = await addDoc(collection(db, 'escrow'), {
      ...data,
      platformFee,
      freelancerAmount: data.amount - platformFee,
      status: 'pending_funding' as EscrowStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async getEscrowById(id: string): Promise<EscrowTransaction | null> {
    const snap = await getDoc(doc(db, 'escrow', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as EscrowTransaction;
  },

  async getEscrowByGig(gigId: string): Promise<EscrowTransaction | null> {
    const q = query(collection(db, 'escrow'), where('gigId', '==', gigId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as EscrowTransaction;
  },

  async getClientEscrows(clientId: string): Promise<EscrowTransaction[]> {
    const q = query(collection(db, 'escrow'), where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as EscrowTransaction[];
  },

  async getFreelancerEscrows(freelancerId: string): Promise<EscrowTransaction[]> {
    const q = query(collection(db, 'escrow'), where('freelancerId', '==', freelancerId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as EscrowTransaction[];
  },

  async getAllEscrows(): Promise<EscrowTransaction[]> {
    const q = query(collection(db, 'escrow'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as EscrowTransaction[];
  },

  // Client funds escrow (bank transfer confirmed by admin, or payment gateway callback)
  async markFunded(escrowId: string, reference?: string): Promise<void> {
    await updateDoc(doc(db, 'escrow', escrowId), {
      status: 'funded',
      paymentReference: reference || null,
      fundedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async recordGatewayPayment(escrowId: string, transactionId: string, method: 'flutterwave' | 'paystack'): Promise<void> {
    await updateDoc(doc(db, 'escrow', escrowId), {
      status: 'funded',
      paymentMethod: method,
      flwTransactionId: transactionId,
      fundedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  // Freelancer submits work
  async submitWork(escrowId: string): Promise<void> {
    await updateDoc(doc(db, 'escrow', escrowId), {
      status: 'submitted',
      workSubmittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  // Client approves work
  async approveWork(escrowId: string): Promise<void> {
    await updateDoc(doc(db, 'escrow', escrowId), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  // Admin releases funds to freelancer
  async releaseFunds(escrowId: string, adminUid: string): Promise<void> {
    await updateDoc(doc(db, 'escrow', escrowId), {
      status: 'released',
      releasedAt: serverTimestamp(),
      resolvedBy: adminUid,
      updatedAt: serverTimestamp(),
    });
    // Update gig status
    const escrow = await this.getEscrowById(escrowId);
    if (escrow) {
      await updateDoc(doc(db, 'gigs', escrow.gigId), { status: 'completed', updatedAt: serverTimestamp() });
    }
  },

  // Client or freelancer raises dispute
  async raiseDispute(params: {
    escrowId: string; gigId: string; gigTitle: string;
    clientId: string; clientName: string;
    freelancerId: string; freelancerName: string;
    raisedBy: 'client' | 'freelancer'; reason: string;
    evidence?: string[];
  }): Promise<string> {
    await updateDoc(doc(db, 'escrow', params.escrowId), {
      status: 'disputed',
      disputeReason: params.reason,
      disputedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const ref = await addDoc(collection(db, 'disputes'), {
      escrowId: params.escrowId,
      gigId: params.gigId,
      gigTitle: params.gigTitle,
      clientId: params.clientId,
      clientName: params.clientName,
      freelancerId: params.freelancerId,
      freelancerName: params.freelancerName,
      raisedBy: params.raisedBy,
      reason: params.reason,
      evidence: params.evidence || [],
      status: 'open',
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async resolveDispute(disputeId: string, escrowId: string, resolution: 'resolved_client' | 'resolved_freelancer', moderatorUid: string, resolutionNote: string): Promise<void> {
    await updateDoc(doc(db, 'disputes', disputeId), {
      status: resolution,
      resolution: resolutionNote,
      resolvedAt: serverTimestamp(),
      assignedModerator: moderatorUid,
    });
    const newEscrowStatus = resolution === 'resolved_client' ? 'refunded' : 'released';
    await updateDoc(doc(db, 'escrow', escrowId), {
      status: newEscrowStatus,
      resolvedAt: serverTimestamp(),
      resolvedBy: moderatorUid,
      updatedAt: serverTimestamp(),
    });
  },

  async getDisputes(filters?: { status?: string; assignedTo?: string }): Promise<Dispute[]> {
    let constraints: any[] = [orderBy('createdAt', 'desc')];
    if (filters?.status) constraints.unshift(where('status', '==', filters.status));
    if (filters?.assignedTo) constraints.unshift(where('assignedModerator', '==', filters.assignedTo));
    const q = query(collection(db, 'disputes'), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Dispute[];
  },

  async refund(escrowId: string, adminUid: string): Promise<void> {
    await updateDoc(doc(db, 'escrow', escrowId), {
      status: 'refunded',
      resolvedAt: serverTimestamp(),
      resolvedBy: adminUid,
      updatedAt: serverTimestamp(),
    });
  },
};
