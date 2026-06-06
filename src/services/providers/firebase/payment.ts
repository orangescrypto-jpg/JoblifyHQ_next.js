// src/services/providers/firebase/payment.ts
// ─── Firebase Payment Provider ────────────────────────────────────────────────
//
// Payment routing:
//   Nigeria (users/employers/job seekers) → Manual bank transfer OR Crypto (USDT/USDC)
//   Outside Nigeria (other Africa)        → Flutterwave OR PayPal OR Crypto
//
// Freelancer payouts:
//   Nigeria freelancers → Admin pays to their saved bank account
//   International       → Admin pays via PayPal or Crypto wallet
//
// All amounts are stored in USD. NGN conversion shown to Nigerian users in UI.
// After any payment the record stays "pending" until admin confirms it.

import {
  doc, getDoc, setDoc, addDoc, updateDoc,
  collection, serverTimestamp, Timestamp,
  query, where, orderBy, getDocs,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { AppUser, WithdrawalRequest, WithdrawalMethod, FreelancerPayoutDetails } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export type PaymentMethod =
  | 'manual_transfer'   // Nigerian bank transfer
  | 'flutterwave'       // Card / mobile money — outside Nigeria
  | 'paypal'            // PayPal — outside Nigeria
  | 'crypto_usdt_eth'   // USDT on Ethereum
  | 'crypto_usdc_eth'   // USDC on Ethereum
  | 'crypto_usdt_bnb'   // USDT on BNB Chain
  | 'crypto_usdc_bnb';  // USDC on BNB Chain

export type PaymentPlan =
  | 'premium'
  | 'premium-annual'
  | 'employer-growth'
  | 'employer-scale'
  | 'freelancer-pro'
  | 'boost'
  | 'featured_job'
  | 'featured_gig'
  | 'scholarship_boost';

export interface PendingPayment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userCountry: string;
  plan: PaymentPlan;
  method: PaymentMethod;
  amountUSD: number;
  /** NGN equivalent — populated for Nigerian users */
  amountNGN?: number;
  /** USDT/USDC equivalent — populated when method is crypto */
  amountCrypto?: number;
  status: PaymentStatus;
  reference: string;
  flwTransactionId?: string;
  note?: string;
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
}

export interface AdminPaymentSettings {
  // ── Nigerian bank details ─────────────────────────────────────────────────
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode?: string;

  // ── Crypto wallets (admin sets these — shown to payers) ──────────────────
  cryptoWalletEth: string;   // USDT / USDC on Ethereum
  cryptoWalletBnb: string;   // USDT / USDC on BNB Chain

  // ── PayPal (outside Nigeria) ──────────────────────────────────────────────
  paypalEmail: string;

  // ── Subscription pricing (USD) ────────────────────────────────────────────
  premiumMonthlyUSD: number;
  premiumAnnualUSD: number;
  employerGrowthUSD: number;
  employerScaleUSD: number;
  freelancerProUSD: number;
  boostUSD: number;
  featuredJobUSD: number;
  featuredGigUSD: number;
  scholarshipBoostUSD: number;

  // ── Escrow fee ────────────────────────────────────────────────────────────
  escrowFeePercent: number;

  // ── FX / Crypto rates ─────────────────────────────────────────────────────
  ngnPerUSD: number;
  /** USDT / USDC rate — usually 1:1 but admin can set a small buffer */
  usdtPerUSD: number;

  // ── Gateway toggles (admin can turn each on/off) ──────────────────────────
  bankTransferEnabled: boolean;
  flutterwaveEnabled: boolean;
  paypalEnabled: boolean;
  cryptoEthEnabled: boolean;
  cryptoBnbEnabled: boolean;

  updatedAt?: Timestamp;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AdminPaymentSettings = {
  bankName:            'Access Bank',
  accountName:         'JoblifyHQ Ltd',
  accountNumber:       '0000000000',
  cryptoWalletEth:     '',
  cryptoWalletBnb:     '',
  paypalEmail:         '',
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
  usdtPerUSD:          1,
  bankTransferEnabled: true,
  flutterwaveEnabled:  true,
  paypalEnabled:       true,
  cryptoEthEnabled:    true,
  cryptoBnbEnabled:    true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateRef(userId: string, plan: string): string {
  return `JBF_${userId.slice(0, 6)}_${plan}_${Date.now()}`;
}

function getPlanAmountUSD(plan: PaymentPlan, s: AdminPaymentSettings): number {
  const map: Record<PaymentPlan, number> = {
    'premium':           s.premiumMonthlyUSD,
    'premium-annual':    s.premiumAnnualUSD,
    'employer-growth':   s.employerGrowthUSD,
    'employer-scale':    s.employerScaleUSD,
    'freelancer-pro':    s.freelancerProUSD,
    'boost':             s.boostUSD,
    'featured_job':      s.featuredJobUSD,
    'featured_gig':      s.featuredGigUSD,
    'scholarship_boost': s.scholarshipBoostUSD,
  };
  return map[plan] ?? 0;
}

const PLAN_DAYS: Record<PaymentPlan, number> = {
  'premium':           30,
  'premium-annual':    365,
  'employer-growth':   30,
  'employer-scale':    30,
  'freelancer-pro':    30,
  'boost':             14,
  'featured_job':      14,
  'featured_gig':      14,
  'scholarship_boost': 14,
};

async function activateUserPlan(userId: string, plan: PaymentPlan, adminUid?: string): Promise<void> {
  const days = PLAN_DAYS[plan] || 30;
  const isEmployer   = plan === 'employer-growth' || plan === 'employer-scale';
  const isFreelancer = plan === 'freelancer-pro';
  await updateDoc(doc(db, 'users', userId), {
    tier: plan,
    ...(isEmployer   ? { employerTier: plan }  : {}),
    ...(isFreelancer ? { freelancerTier: plan } : {}),
    premiumSince:     serverTimestamp(),
    premiumExpiresAt: Timestamp.fromDate(new Date(Date.now() + days * 86_400_000)),
    premiumPlan:      plan,
    updatedAt:        serverTimestamp(),
    ...(adminUid ? { lastConfirmedBy: adminUid } : {}),
  });
}

// ── Payment Service ───────────────────────────────────────────────────────────

export const PaymentService = {

  // ── Admin settings ──────────────────────────────────────────────────────────

  async getAdminSettings(): Promise<AdminPaymentSettings> {
    const snap = await getDoc(doc(db, 'admin_config', 'payment_settings'));
    if (!snap.exists()) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...snap.data() } as AdminPaymentSettings;
  },

  async saveAdminSettings(settings: Partial<AdminPaymentSettings>): Promise<void> {
    await setDoc(
      doc(db, 'admin_config', 'payment_settings'),
      { ...settings, updatedAt: serverTimestamp() },
      { merge: true },
    );
  },

  // ── Create pending payment record ────────────────────────────────────────────

  async createPendingPayment(params: {
    user: AppUser;
    plan: PaymentPlan;
    method: PaymentMethod;
    settings: AdminPaymentSettings;
  }): Promise<PendingPayment> {
    const { user, plan, method, settings } = params;
    const amountUSD   = getPlanAmountUSD(plan, settings);
    const amountNGN   = Math.round(amountUSD * settings.ngnPerUSD);
    const amountCrypto = +(amountUSD * settings.usdtPerUSD).toFixed(2);
    const isCrypto    = method.startsWith('crypto_');
    const isNigeria   = (user.country || '').toLowerCase() === 'nigeria';

    const payload = {
      userId:      user.uid,
      userEmail:   user.email || '',
      userName:    user.displayName || user.name || 'User',
      userCountry: user.country || 'Unknown',
      plan,
      method,
      amountUSD,
      ...(isNigeria  ? { amountNGN }    : {}),
      ...(isCrypto   ? { amountCrypto } : {}),
      status:      'pending' as PaymentStatus,
      reference:   generateRef(user.uid, plan),
      createdAt:   serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'payments'), payload);
    return { id: ref.id, ...payload, createdAt: Timestamp.now() };
  },

  // ── User claims they paid (manual / crypto) ──────────────────────────────────

  async submitPaymentClaim(paymentId: string, note?: string): Promise<void> {
    await updateDoc(doc(db, 'payments', paymentId), {
      status:        'pending',
      userClaimedAt: serverTimestamp(),
      ...(note ? { note } : {}),
    });
  },

  // ── Admin confirms a manual/crypto/PayPal payment ────────────────────────────

  async confirmManualPayment(params: {
    paymentId: string;
    adminUid: string;
    plan: PaymentPlan;
    userId: string;
  }): Promise<void> {
    const { paymentId, adminUid, plan, userId } = params;
    await updateDoc(doc(db, 'payments', paymentId), {
      status:      'confirmed',
      confirmedAt: serverTimestamp(),
      confirmedBy: adminUid,
    });
    await activateUserPlan(userId, plan, adminUid);
  },

  // ── Flutterwave callback (auto-confirm for international users) ───────────────

  async recordFlutterwaveSuccess(params: {
    paymentId: string;
    flwTransactionId: string | number;
    plan: PaymentPlan;
    userId: string;
  }): Promise<void> {
    const { paymentId, flwTransactionId, plan, userId } = params;
    await updateDoc(doc(db, 'payments', paymentId), {
      status:           'confirmed',
      flwTransactionId: String(flwTransactionId),
      confirmedAt:      serverTimestamp(),
    });
    await activateUserPlan(userId, plan);
  },

  async cancelPayment(paymentId: string): Promise<void> {
    await updateDoc(doc(db, 'payments', paymentId), {
      status:      'cancelled',
      cancelledAt: serverTimestamp(),
    });
  },

  // ── Freelancer payout details (save / get) ───────────────────────────────────

  async savePayoutDetails(userId: string, details: FreelancerPayoutDetails): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      payoutDetails: { ...details, updatedAt: serverTimestamp() },
      updatedAt:     serverTimestamp(),
    });
  },

  async getPayoutDetails(userId: string): Promise<FreelancerPayoutDetails | null> {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    return (snap.data().payoutDetails as FreelancerPayoutDetails) || null;
  },

  // ── Withdrawal requests (freelancer requests payout) ─────────────────────────

  async requestWithdrawal(params: {
    freelancer: AppUser;
    amountUSD: number;
    method: WithdrawalMethod;
    payoutDetails: FreelancerPayoutDetails;
    settings: AdminPaymentSettings;
  }): Promise<string> {
    const { freelancer, amountUSD, method, payoutDetails, settings } = params;
    const isNigeria = (freelancer.country || '').toLowerCase() === 'nigeria';

    const payload: Omit<WithdrawalRequest, 'id'> = {
      freelancerId:      freelancer.uid,
      freelancerName:    freelancer.displayName || freelancer.name || 'Freelancer',
      freelancerEmail:   freelancer.email || '',
      freelancerCountry: freelancer.country || 'Unknown',
      amountUSD,
      ...(isNigeria ? { amountNGN: Math.round(amountUSD * settings.ngnPerUSD) } : {}),
      method,
      // Snapshot payout details at request time
      ...(payoutDetails.bankName      ? { bankName: payoutDetails.bankName }           : {}),
      ...(payoutDetails.accountName   ? { accountName: payoutDetails.accountName }     : {}),
      ...(payoutDetails.accountNumber ? { accountNumber: payoutDetails.accountNumber } : {}),
      ...(payoutDetails.paypalEmail   ? { paypalEmail: payoutDetails.paypalEmail }     : {}),
      ...(payoutDetails.cryptoAddress ? { cryptoAddress: payoutDetails.cryptoAddress } : {}),
      ...(payoutDetails.cryptoNetwork ? { cryptoNetwork: payoutDetails.cryptoNetwork } : {}),
      status:      'pending',
      requestedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'withdrawal_requests'), payload);
    return ref.id;
  },

  async getWithdrawalRequests(status?: WithdrawalRequest['status']): Promise<WithdrawalRequest[]> {
    const constraints = status
      ? [where('status', '==', status), orderBy('requestedAt', 'desc')]
      : [orderBy('requestedAt', 'desc')];
    const snap = await getDocs(query(collection(db, 'withdrawal_requests'), ...constraints));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest));
  },

  async getFreelancerWithdrawals(freelancerId: string): Promise<WithdrawalRequest[]> {
    const snap = await getDocs(
      query(
        collection(db, 'withdrawal_requests'),
        where('freelancerId', '==', freelancerId),
        orderBy('requestedAt', 'desc'),
      ),
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest));
  },

  async processWithdrawal(params: {
    withdrawalId: string;
    adminUid: string;
    status: 'paid' | 'rejected';
    adminNote?: string;
    rejectionReason?: string;
  }): Promise<void> {
    const { withdrawalId, adminUid, status, adminNote, rejectionReason } = params;
    await updateDoc(doc(db, 'withdrawal_requests', withdrawalId), {
      status,
      processedBy:  adminUid,
      processedAt:  serverTimestamp(),
      ...(adminNote       ? { adminNote }       : {}),
      ...(rejectionReason ? { rejectionReason } : {}),
    });
  },

  planDaysMap: PLAN_DAYS,
};
