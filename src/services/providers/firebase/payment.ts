// src/services/providers/firebase/payment.ts
// ─── Firebase Payment Provider ────────────────────────────────────────────────
// Payment modes:
//   Nigeria     → Manual bank transfer OR Paystack
//   Rest Africa → Flutterwave or Paystack
// Escrow for freelance gigs is also managed here.

import {
  doc, getDoc, setDoc, addDoc, updateDoc,
  collection, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { AppUser } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';
export type PaymentMethod = 'manual_transfer' | 'flutterwave' | 'paystack';
export type PaymentPlan =
  | 'premium'
  | 'premium-annual'
  | 'employer-growth'
  | 'employer-scale'
  | 'freelancer-pro'
  | 'boost'
  | 'featured_job'
  | 'featured_gig';

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
  paystackReference?: string;
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
  note?: string;
}

export interface AdminPaymentSettings {
  // Bank details (Nigeria)
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode?: string;
  // Job seeker pricing (USD)
  premiumMonthlyUSD: number;
  premiumAnnualUSD: number;
  // Employer pricing (USD)
  employerGrowthUSD: number;
  employerScaleUSD: number;
  // Freelancer pricing (USD)
  freelancerProUSD: number;
  // Boost / featured
  boostUSD: number;
  featuredJobUSD: number;
  featuredGigUSD: number;
  scholarshipBoostUSD: number;
  // Escrow fee
  escrowFeePercent: number;
  // FX rate
  ngnPerUSD: number;
  // Gateway toggles
  flutterwaveEnabled: boolean;
  paystackEnabled: boolean;
  bankTransferEnabled: boolean;
  updatedAt?: Timestamp;
}

export const DEFAULT_SETTINGS: AdminPaymentSettings = {
  bankName:            'Access Bank',
  accountName:         'JoblifyHQ Ltd',
  accountNumber:       '0000000000',
  premiumMonthlyUSD:   4,
  premiumAnnualUSD:    40,
  employerGrowthUSD:   10,
  employerScaleUSD:    25,
  freelancerProUSD:    6,
  boostUSD:            3,
  featuredJobUSD:      5,
  featuredGigUSD:      4,
  scholarshipBoostUSD: 3,
  escrowFeePercent:    5,
  ngnPerUSD:           1470,
  flutterwaveEnabled:  true,
  paystackEnabled:     true,
  bankTransferEnabled: true,
};

function generateRef(userId: string, plan: string): string {
  return `JBF_${userId.slice(0, 6)}_${plan}_${Date.now()}`;
}

function toNGN(usd: number, rate: number): number {
  return Math.round(usd * rate);
}

export const PaymentService = {

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

  async createPendingPayment(params: {
    user: AppUser;
    plan: PaymentPlan;
    method: PaymentMethod;
    settings: AdminPaymentSettings;
  }): Promise<PendingPayment> {
    const { user, plan, method, settings } = params;
    const usdMap: Record<PaymentPlan, number> = {
      'premium':          settings.premiumMonthlyUSD,
      'premium-annual':   settings.premiumAnnualUSD,
      'employer-growth':  settings.employerGrowthUSD,
      'employer-scale':   settings.employerScaleUSD,
      'freelancer-pro':   settings.freelancerProUSD,
      'boost':            settings.boostUSD,
      'featured_job':     settings.featuredJobUSD,
      'featured_gig':     settings.featuredGigUSD,
    };
    const amountUSD = usdMap[plan] ?? 0;
    const amountNGN = toNGN(amountUSD, settings.ngnPerUSD);
    const reference = generateRef(user.uid, plan);
    const payload = {
      userId:    user.uid,
      userEmail: user.email || '',
      userName:  user.displayName || user.name || 'User',
      plan, method, amountNGN, amountUSD,
      status: 'pending' as PaymentStatus,
      reference,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'payments'), payload);
    return { id: docRef.id, ...payload, createdAt: Timestamp.now() };
  },

  async submitManualTransferClaim(paymentId: string, note?: string): Promise<void> {
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'pending',
      userClaimedAt: serverTimestamp(),
      ...(note ? { note } : {}),
    });
  },

  async confirmManualPayment(params: {
    paymentId: string; adminUid: string; plan: PaymentPlan; userId: string;
  }): Promise<void> {
    const { paymentId, adminUid, plan, userId } = params;
    const daysMap: Record<PaymentPlan, number> = {
      'premium': 30, 'premium-annual': 365,
      'employer-growth': 30, 'employer-scale': 30,
      'freelancer-pro': 30,
      'boost': 14, 'featured_job': 14, 'featured_gig': 14,
    };
    const days = daysMap[plan] || 30;
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'confirmed', confirmedAt: serverTimestamp(), confirmedBy: adminUid,
    });
    const isEmployer   = plan === 'employer-growth' || plan === 'employer-scale';
    const isFreelancer = plan === 'freelancer-pro';
    await updateDoc(doc(db, 'users', userId), {
      tier: plan,
      ...(isEmployer   ? { employerTier: plan }   : {}),
      ...(isFreelancer ? { freelancerTier: plan }  : {}),
      premiumSince:     serverTimestamp(),
      premiumExpiresAt: Timestamp.fromDate(new Date(Date.now() + days * 86400_000)),
      premiumPlan:      plan,
      updatedAt:        serverTimestamp(),
    });
  },

  async recordFlutterwaveSuccess(params: {
    paymentId: string; flwTransactionId: string | number; plan: PaymentPlan; userId: string;
  }): Promise<void> {
    const { paymentId, flwTransactionId, plan, userId } = params;
    const days = ({ 'premium': 30, 'premium-annual': 365, 'employer-growth': 30, 'employer-scale': 30, 'freelancer-pro': 30, 'boost': 14, 'featured_job': 14, 'featured_gig': 14 } as any)[plan] || 30;
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'confirmed', flwTransactionId: String(flwTransactionId), confirmedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', userId), {
      tier: plan, premiumSince: serverTimestamp(),
      premiumExpiresAt: Timestamp.fromDate(new Date(Date.now() + days * 86400_000)),
      premiumPlan: plan, updatedAt: serverTimestamp(),
    });
  },

  async recordPaystackSuccess(params: {
    paymentId: string; paystackReference: string; plan: PaymentPlan; userId: string;
  }): Promise<void> {
    const { paymentId, paystackReference, plan, userId } = params;
    const days = ({ 'premium': 30, 'premium-annual': 365, 'employer-growth': 30, 'employer-scale': 30, 'freelancer-pro': 30, 'boost': 14, 'featured_job': 14, 'featured_gig': 14 } as any)[plan] || 30;
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'confirmed', paystackReference, confirmedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', userId), {
      tier: plan, premiumSince: serverTimestamp(),
      premiumExpiresAt: Timestamp.fromDate(new Date(Date.now() + days * 86400_000)),
      premiumPlan: plan, updatedAt: serverTimestamp(),
    });
  },

  async cancelPayment(paymentId: string): Promise<void> {
    await updateDoc(doc(db, 'payments', paymentId), { status: 'cancelled', cancelledAt: serverTimestamp() });
  },

  planDaysMap: {
    'premium': 30, 'premium-annual': 365,
    'employer-growth': 30, 'employer-scale': 30,
    'freelancer-pro': 30,
    'boost': 14, 'featured_job': 14, 'featured_gig': 14,
  } as Record<PaymentPlan, number>,
};
