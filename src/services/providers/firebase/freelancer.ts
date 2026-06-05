// src/services/providers/firebase/freelancer.ts
// ─── Freelancer Profile, Portfolio, Skills, Resume ────────────────────────────

import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, setDoc, query, where,
  orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { PortfolioItem, SkillBadge, SkillBadgeStatus, Resume, EmployerKyc, KycStatus } from '@/types';

export const FreelancerService = {

  // ── Portfolio ───────────────────────────────────────────────────────────────

  async getPortfolio(userId: string): Promise<PortfolioItem[]> {
    const q = query(collection(db, 'portfolio'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as PortfolioItem[];
  },

  async addPortfolioItem(item: Omit<PortfolioItem, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'portfolio'), { ...item, createdAt: serverTimestamp() });
    return ref.id;
  },

  async updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<void> {
    await updateDoc(doc(db, 'portfolio', id), updates);
  },

  async deletePortfolioItem(id: string): Promise<void> {
    await deleteDoc(doc(db, 'portfolio', id));
  },

  // ── Skill Badges ────────────────────────────────────────────────────────────

  async getUserBadges(userId: string): Promise<SkillBadge[]> {
    const q = query(collection(db, 'skill_badges'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as SkillBadge[];
  },

  async requestBadge(badge: Omit<SkillBadge, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const ref = await addDoc(collection(db, 'skill_badges'), {
      ...badge,
      status: 'pending' as SkillBadgeStatus,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async getAllPendingBadges(): Promise<SkillBadge[]> {
    const q = query(collection(db, 'skill_badges'), where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as SkillBadge[];
  },

  async reviewBadge(id: string, status: SkillBadgeStatus, reviewerUid: string, rejectionReason?: string): Promise<void> {
    await updateDoc(doc(db, 'skill_badges', id), {
      status,
      verifiedBy: reviewerUid,
      verifiedAt: serverTimestamp(),
      ...(rejectionReason ? { rejectionReason } : {}),
    });
  },

  // ── Resume ──────────────────────────────────────────────────────────────────

  async getResume(userId: string): Promise<Resume | null> {
    const ref = doc(db, 'resumes', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Resume;
  },

  async saveResume(userId: string, resume: Omit<Resume, 'id'>): Promise<void> {
    await setDoc(doc(db, 'resumes', userId), { ...resume, updatedAt: serverTimestamp() }, { merge: true });
  },

  // ── KYC / Employer Verification ─────────────────────────────────────────────

  async submitKyc(kyc: Omit<EmployerKyc, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const ref = await addDoc(collection(db, 'employer_kyc'), {
      ...kyc,
      status: 'pending' as KycStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async getKycByEmployer(employerId: string): Promise<EmployerKyc | null> {
    const q = query(collection(db, 'employer_kyc'), where('employerId', '==', employerId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as EmployerKyc;
  },

  async getAllKycApplications(status?: KycStatus): Promise<EmployerKyc[]> {
    const constraints: any[] = [orderBy('createdAt', 'desc')];
    if (status) constraints.unshift(where('status', '==', status));
    const q = query(collection(db, 'employer_kyc'), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as EmployerKyc[];
  },

  async reviewKyc(kycId: string, employerId: string, status: KycStatus, reviewerUid: string, rejectionReason?: string): Promise<void> {
    await updateDoc(doc(db, 'employer_kyc', kycId), {
      status,
      reviewedBy: reviewerUid,
      rejectionReason: rejectionReason || null,
      updatedAt: serverTimestamp(),
    });
    if (status === 'approved') {
      await updateDoc(doc(db, 'users', employerId), {
        employerVerified: true,
        isVerified: true,
        updatedAt: serverTimestamp(),
      });
    }
  },

  // ── Moderator Logs ─────────────────────────────────────────────────────────

  async logModeratorAction(log: { moderatorId: string; moderatorName: string; action: string; targetId: string; targetType: string; note?: string }): Promise<void> {
    await addDoc(collection(db, 'moderator_logs'), { ...log, createdAt: serverTimestamp() });
  },

  // ── Reports ────────────────────────────────────────────────────────────────

  async submitReport(report: { reportedBy: string; reportedByName: string; targetId: string; targetType: string; type: string; description: string }): Promise<string> {
    const ref = await addDoc(collection(db, 'reports'), {
      ...report,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async getReports(status?: string): Promise<any[]> {
    const constraints: any[] = [orderBy('createdAt', 'desc')];
    if (status) constraints.unshift(where('status', '==', status));
    const q = query(collection(db, 'reports'), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async updateReport(reportId: string, updates: { status: string; assignedTo?: string; resolution?: string }): Promise<void> {
    await updateDoc(doc(db, 'reports', reportId), { ...updates, updatedAt: serverTimestamp() });
  },
};
