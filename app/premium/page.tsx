'use client';
import { Suspense } from 'react';
import PaymentCheckout from '@/pages/PaymentCheckout';
export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <PaymentCheckout />
    </Suspense>
  );
}
