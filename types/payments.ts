// types/payments.ts
// ─── Payment Types ─────────────────────────────────────────────────────────────
// Shared across all payment providers. Keep this stable when switching providers.

export type PaymentStatus = 'pending' | 'confirmed' | 'rejected';

export type PaymentPlan =
  | 'seeker-monthly'
  | 'seeker-annual'
  | 'employer-growth'
  | 'employer-pro';

export type PaymentUserType = 'seeker' | 'employer';

export type PaymentProvider =
  | 'manual_bank_transfer'
  | 'flutterwave'
  | 'paystack'
  | 'stripe';

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: PaymentPlan;
  userType: PaymentUserType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  note?: string;
  submittedAt: unknown;
  updatedAt: unknown;
  confirmedAt: unknown | null;
  confirmedBy: string | null;
  rejectedAt: unknown | null;
  rejectedReason: string | null;
  transactionId: string | null;
}

export interface BankDetails {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingOrSortCode?: string;   // optional: sort code / routing number
  swiftCode?: string;           // optional: for international
  currency: string;             // e.g. NGN, USD, KES
  additionalNote?: string;      // e.g. "Use your email as payment reference"
  updatedAt: unknown;
  updatedBy?: string;
}

// Plan metadata — amounts, labels, durations
export interface PlanMeta {
  id: PaymentPlan;
  label: string;
  amount: number;
  currency: string;
  localHint?: string;
  durationDays: number;
  userType: PaymentUserType;
}

export const PLAN_META: Record<PaymentPlan, PlanMeta> = {
  'seeker-monthly': {
    id: 'seeker-monthly',
    label: 'Premium Monthly',
    amount: 6400,
    currency: 'NGN',
    localHint: '≈ $4 USD',
    durationDays: 30,
    userType: 'seeker',
  },
  'seeker-annual': {
    id: 'seeker-annual',
    label: 'Premium Annual',
    amount: 64000,
    currency: 'NGN',
    localHint: '≈ $40 USD',
    durationDays: 365,
    userType: 'seeker',
  },
  'employer-growth': {
    id: 'employer-growth',
    label: 'Employer Growth',
    amount: 16000,
    currency: 'NGN',
    localHint: '≈ $10 USD',
    durationDays: 30,
    userType: 'employer',
  },
  'employer-pro': {
    id: 'employer-pro',
    label: 'Employer Pro',
    amount: 48000,
    currency: 'NGN',
    localHint: '≈ $30 USD',
    durationDays: 30,
    userType: 'employer',
  },
};
