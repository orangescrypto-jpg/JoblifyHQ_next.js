// src/services/payments.ts
// ─── Payments Service Interface ───────────────────────────────────────────────
// Your app imports from here ONLY. Never import from firebase directly.
//
// ─── HOW TO SWITCH PAYMENT PROVIDER ─────────────────────────────────────────
// Want to move to Paystack, Stripe, or Flutterwave later?
//   1. Create: src/services/providers/paystack/payments.ts  (same method signatures)
//   2. Change ONE line below:
//      Before:  export { PaymentsService } from '@/src/services/providers/firebase/payments';
//      After:   export { PaymentsService } from '@/src/services/providers/paystack/payments';
//   3. Pages and components need ZERO changes. ✅

export { PaymentsService } from '@/src/services/providers/firebase/payments';
a
