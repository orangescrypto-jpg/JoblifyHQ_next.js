// src/services/providers/firebase/payment.ts
// ─── Firebase Payment Provider ────────────────────────────────────────────────
// All payment logic lives here. Nothing outside this folder touches Firebase.
// Supports dual payment modes:
//   - Nigerian users → Manual bank transfer (pending → admin confirms)
//   - Rest of Africa  → Flutterwave card / mobile money

import {
  doc, getDoc, setDoc, addDoc, updateDoc,
  collection, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { AppUser } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';
export type PaymentMethod = 'manual_transfer' | 'flutterwave';
export type PaymentPlan =
  | 'premium'
  | 'premium-annual'
  | 'employer-growth'
  | 'employer-scale'
  | 'boost';

export interface PendingPayment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: PaymentPlan;
  method: PaymentMethod;
  amountNGN: number;
  amountUSD: number;
  status: PaymentStatus;
  reference: string;
  flwTransactionId?: string;
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
  confirmedBy?: string; // admin uid
  note?: string;
}

export interface AdminPaymentSettings {
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode?: string;
  // Pricing in USD (source of truth)
  premiumMonthlyUSD: number;
  premiumAnnualUSD: number;
  employerGrowthUSD: number;
  employerScaleUSD: number;
  boostUSD: number;
  // Exchange rate for display/manual payments
  ngnPerUSD: number;
  // Toggle Flutterwave for non-NG users
  flutterwaveEnabled: boolean;
  updatedAt?: Timestamp;
}

export const DEFAULT_SETTINGS: AdminPaymentSettings = {
  bankName: 'Access Bank',
  accountName: 'JoblifyHQ Ltd',
  accountNumber: '0000000000',
  premiumMonthlyUSD: 4,
  premiumAnnualUSD: 40,
  employerGrowthUSD: 10,
  employerScaleUSD: 25,
  boostUSD: 3,
  ngnPerUSD: 1470,
  flutterwaveEnabled: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateRef(userId: string, plan: string): string {
  return `JBF_${userId.slice(0, 6)}_${plan}_${Date.now()}`;
}

function toNGN(usd: number, rate: number): number {
  return Math.round(usd * rate);
}

// ── Service ───────────────────────────────────────────────────────────────────

export const PaymentService = {

  // ── Admin Settings ──────────────────────────────────────────────────────────

  async getAdminSettings(): Promise<AdminPaymentSettings> {
    const ref = doc(db, 'admin_config', 'payment_settings');
    const snap = await getDoc(ref);
    if (!snap.exists()) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...snap.data() } as AdminPaymentSettings;
  },

  async saveAdminSettings(settings: Partial<AdminPaymentSettings>): Promise<void> {
    const ref = doc(db, 'admin_config', 'payment_settings');
    await setDoc(ref, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
  },

  // ── Create a pending payment record ────────────────────────────────────────

  async createPendingPayment(params: {
    user: AppUser;
    plan: PaymentPlan;
    method: PaymentMethod;
    settings: AdminPaymentSettings;
  }): Promise<PendingPayment> {
    const { user, plan, method, settings } = params;

    const usdMap: Record<PaymentPlan, number> = {
      premium:          settings.premiumMonthlyUSD,
      'premium-annual': settings.premiumAnnualUSD,
      'employer-growth': settings.employerGrowthUSD,
      'employer-scale': settings.employerScaleUSD,
      boost:            settings.boostUSD,
    };

    const amountUSD = usdMap[plan];
    const amountNGN = toNGN(amountUSD, settings.ngnPerUSD);
    const reference = generateRef(user.uid, plan);

    const payload = {
      userId:    user.uid,
      userEmail: user.email || '',
      userName:  user.displayName || user.name || 'User',
      plan,
      method,
      amountNGN,
      amountUSD,
      status:    'pending' as PaymentStatus,
      reference,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'payments'), payload);
    return { id: docRef.id, ...payload, createdAt: Timestamp.now() };
  },

  // ── User confirms they have made a manual transfer ──────────────────────────

  async submitManualTransferClaim(paymentId: string, note?: string): Promise<void> {
    const ref = doc(db, 'payments', paymentId);
    await updateDoc(ref, {
      status: 'pending',          // stays pending until admin confirms
      userClaimedAt: serverTimestamp(),
      ...(note ? { note } : {}),
    });
  },

  // ── Admin confirms a manual transfer ───────────────────────────────────────

  async confirmManualPayment(params: {
    paymentId: string;
    adminUid: string;
    plan: PaymentPlan;
    userId: string;
  }): Promise<void> {
    const { paymentId, adminUid, plan, userId } = params;

    const daysMap: Record<PaymentPlan, number> = {
      premium:           30,
      'premium-annual':  365,
      'employer-growth': 30,
      'employer-scale':  30,
      boost:             14,
    };

    const days = daysMap[plan];

    // Update payment record
    await updateDoc(doc(db, 'payments', paymentId), {
      status:      'confirmed',
      confirmedAt: serverTimestamp(),
      confirmedBy: adminUid,
    });

    // Update user profile
    await updateDoc(doc(db, 'users', userId), {
      tier:              plan,
      premiumSince:      serverTimestamp(),
      premiumExpiresAt:  Timestamp.fromDate(new Date(Date.now() + days * 86400_000)),
      premiumPlan:       plan,
      updatedAt:         serverTimestamp(),
    });
  },

  // ── Flutterwave callback — record successful payment ────────────────────────

  async recordFlutterwaveSuccess(params: {
    paymentId: string;
    flwTransactionId: string | number;
    plan: PaymentPlan;
    userId: string;
  }): Promise<void> {
    const { paymentId, flwTransactionId, plan, userId } = params;

    const daysMap: Record<PaymentPlan, number> = {
      premium:           30,
      'premium-annual':  365,
      'employer-growth': 30,
      'employer-scale':  30,
      boost:             14,
    };

    const days = daysMap[plan];

    await updateDoc(doc(db, 'payments', paymentId), {
      status:           'confirmed',
      flwTransactionId: String(flwTransactionId),
      confirmedAt:      serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', userId), {
      tier:             plan,
      premiumSince:     serverTimestamp(),
      premiumExpiresAt: Timestamp.fromDate(new Date(Date.now() + days * 86400_000)),
      premiumPlan:      plan,
      flwTransactionId: String(flwTransactionId),
      updatedAt:        serverTimestamp(),
    });
  },

  // ── Cancel / fail a payment ─────────────────────────────────────────────────

  async cancelPayment(paymentId: string): Promise<void> {
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
    });
  },

  // ── Get all pending payments (admin) ────────────────────────────────────────
  // NOTE: real filtering is done in the admin page via query; this is a helper
  // for the PaymentService index export pattern.

  planDaysMap: {
    premium:           30,
    'premium-annual':  365,
    'employer-growth': 30,
    'employer-scale':  30,
    boost:             14,
  } as Record<PaymentPlan, number>,
};
