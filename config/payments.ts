/* eslint-disable */
declare const process: { env: Record<string, string | undefined> };
export const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? '';

// ── Admin settings helpers ────────────────────────────────────────────────────
// These are thin async wrappers used by EmployerPremium and other pages
// that need pricing/bank details without importing PaymentService directly.

import type { AdminPaymentSettings } from '@/src/services/payment';
import { PaymentService } from '@/src/services/payment';

// Type alias — keeps any existing import { type PaymentSettings } from '@/config/payments' working
export type { AdminPaymentSettings as PaymentSettings };

export async function getPaymentSettings(): Promise<AdminPaymentSettings> {
  return PaymentService.getAdminSettings();
}

export function isBankDetailsComplete(settings: AdminPaymentSettings): boolean {
  return (
    !!settings.bankName?.trim() &&
    !!settings.accountName?.trim() &&
    !!settings.accountNumber?.trim()
  );
}
