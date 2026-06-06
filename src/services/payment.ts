// src/services/payment.ts
// ─── Payment Service — Thin Wrapper ──────────────────────────────────────────
// Import PaymentService from here in your app code.
// Never import from 'firebase/*' directly outside src/services/providers/firebase/

export { PaymentService } from '@/src/services/providers/firebase/payment';
export type {
  PendingPayment,
  PaymentStatus,
  PaymentMethod,
  PaymentPlan,
  AdminPaymentSettings,
} from '@/src/services/providers/firebase/payment';
