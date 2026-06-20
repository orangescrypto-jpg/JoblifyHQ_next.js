'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PaymentService } from '@/src/services/providers/firebase/payment';
import type { AdminPaymentSettings, PaymentPlan, PendingPayment } from '@/src/services/providers/firebase/payment';

declare const FlutterwaveCheckout: any;

const PLAN_NAMES: Record<PaymentPlan, string> = {
  'premium':           'Job Seeker Premium (Monthly)',
  'premium-annual':    'Job Seeker Premium (Annual)',
  'employer-growth':   'Employer Growth',
  'employer-scale':    'Employer Scale',
  'freelancer-pro':    'Freelancer Pro',
  'boost':             'Profile Boost',
  'featured_job':      'Featured Job Listing',
  'featured_gig':      'Featured Gig Listing',
  'scholarship_boost': 'Scholarship Boost',
};

export default function PaymentCheckout() {
  const { user }                   = useAuth();
  const router                     = useRouter();
  const searchParams               = useSearchParams();
  const plan                       = (searchParams?.get('plan') || 'premium') as PaymentPlan;
  const [settings, setSettings]    = useState<AdminPaymentSettings | null>(null);
  const [payment, setPayment]      = useState<PendingPayment | null>(null);
  const [loading, setLoading]      = useState(false);
  const [method, setMethod]        = useState<'bank_transfer' | 'paystack' | 'flutterwave'>('paystack');
  const [claimed, setClaimed]      = useState(false);
  const [error, setError]          = useState('');
  const [note, setNote]            = useState('');

  const isNigeria = (user as any)?.country === 'Nigeria';

  useEffect(() => {
    PaymentService.getAdminSettings().then(s => {
      setSettings(s);
      // Default method based on country
      if (!s.paystackEnabled && s.flutterwaveEnabled) setMethod('flutterwave');
      if (isNigeria && s.bankTransferEnabled)         setMethod('bank_transfer');
      if (isNigeria && s.paystackEnabled)             setMethod('paystack');
    });
  }, []);

  const initPayment = async (chosenMethod: 'bank_transfer' | 'paystack' | 'flutterwave') => {
    if (!user || !settings) return;
    setLoading(true); setError('');
    try {
      const p = await PaymentService.createPendingPayment({ user, plan, method: chosenMethod, settings });
      setPayment(p);
      setMethod(chosenMethod);
    } catch { setError('Failed to initiate payment. Try again.'); }
    finally { setLoading(false); }
  };

  const launchFlutterwave = () => {
    if (!payment || !user || !settings) return;
    FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref:     payment.reference,
      amount:     payment.amountUSD,
      currency:   'USD',
      payment_options: 'card,mobilemoney,ussd',
      customer: { email: user.email, name: user.name },
      customizations: { title: 'JoblifyHQ', description: PLAN_NAMES[plan] || plan, logo: '/logo.png' },
      callback: async (data: any) => {
        if (data.status === 'successful') {
          await PaymentService.recordFlutterwaveSuccess({ paymentId: payment.id, flwTransactionId: data.transaction_id, plan, userId: user.uid });
          router.push('/dashboard?upgraded=1');
        }
      },
      onclose: () => {},
    });
  };

  const launchPaystack = () => {
    if (!payment || !user || !settings) return;
    const handler = (window as any).PaystackPop.setup({
      key:    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email:  user.email,
      amount: (payment.amountNGN ?? 0) * 100, // kobo
      currency: 'NGN',
      ref:    payment.reference,
      metadata: { planKey: plan, userId: user.uid, paymentId: payment.id },
      callback: async (response: any) => {
        await PaymentService.recordPaystackSuccess({ paymentId: payment.id, paystackReference: response.reference, plan, userId: user.uid });
        router.push('/dashboard?upgraded=1');
      },
      onClose: () => {},
    });
    handler.openIframe();
  };

  const claimBankTransfer = async () => {
    if (!payment) return;
    setLoading(true);
    await PaymentService.submitManualTransferClaim(payment.id, note);
    setClaimed(true);
    setLoading(false);
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Please log in first.</div>;
  if (!settings) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const amountUSD = (() => {
    const m: Record<PaymentPlan, number> = {
      'premium': settings.premiumMonthlyUSD, 'premium-annual': settings.premiumAnnualUSD,
      'employer-growth': settings.employerGrowthUSD, 'employer-scale': settings.employerScaleUSD,
      'freelancer-pro': settings.freelancerProUSD, 'boost': settings.boostUSD,
      'featured_job': settings.featuredJobUSD, 'featured_gig': settings.featuredGigUSD,
      'scholarship_boost': settings.scholarshipBoostUSD,
    };
    return m[plan] || 0;
  })();
  const amountNGN = Math.round(amountUSD * settings.ngnPerUSD);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Your Upgrade</h1>
          <p className="text-sm text-gray-500">{PLAN_NAMES[plan] || plan}</p>
        </div>

        {error && <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>}

        {/* Order summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h3>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">{PLAN_NAMES[plan]}</span>
            <span className="font-semibold text-gray-900 dark:text-white">${amountUSD}</span>
          </div>
          {isNigeria && (
            <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
              <span className="text-gray-500">In Naira (₦)</span>
              <span className="font-bold text-green-600">₦{amountNGN.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* If no payment initiated yet — choose method */}
        {!payment && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Choose Payment Method</h3>

            {/* Nigeria options */}
            {isNigeria && (
              <div className="space-y-3">
                {settings.paystackEnabled && (
                  <button onClick={() => initPayment('paystack')} disabled={loading}
                    className="w-full flex items-center justify-between border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 rounded-xl p-4 transition group disabled:opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">PS</div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Paystack</p>
                        <p className="text-xs text-gray-500">Card, Bank Transfer, USSD · Pay ₦{amountNGN.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-blue-600 text-xs font-medium">Recommended</span>
                  </button>
                )}
                {settings.bankTransferEnabled && (
                  <button onClick={() => initPayment('bank_transfer')} disabled={loading}
                    className="w-full flex items-center gap-3 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 rounded-xl p-4 transition disabled:opacity-50">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white text-xl">🏦</div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Bank Transfer</p>
                      <p className="text-xs text-gray-500">Manual transfer to our account · Pay ₦{amountNGN.toLocaleString()}</p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Non-Nigeria options */}
            {!isNigeria && (
              <div className="space-y-3">
                {settings.flutterwaveEnabled && (
                  <button onClick={() => initPayment('flutterwave')} disabled={loading}
                    className="w-full flex items-center justify-between border-2 border-gray-200 dark:border-gray-600 hover:border-orange-400 rounded-xl p-4 transition disabled:opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">FLW</div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Flutterwave</p>
                        <p className="text-xs text-gray-500">Card, Mobile Money, Bank · Pay ${amountUSD}</p>
                      </div>
                    </div>
                    <span className="text-orange-500 text-xs font-medium">Best for Africa</span>
                  </button>
                )}
                {settings.paystackEnabled && (
                  <button onClick={() => initPayment('paystack')} disabled={loading}
                    className="w-full flex items-center gap-3 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 rounded-xl p-4 transition disabled:opacity-50">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">PS</div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Paystack</p>
                      <p className="text-xs text-gray-500">Card payment · Pay ${amountUSD}</p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {loading && <p className="text-center text-sm text-gray-400">Initializing payment...</p>}
          </div>
        )}

        {/* Bank transfer instructions */}
        {payment && payment.method === 'bank_transfer' && !claimed && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Bank Transfer Instructions</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm">
              <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Transfer exactly:</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">₦{(payment.amountNGN ?? 0).toLocaleString()}</p>
              <div className="mt-3 space-y-1 text-yellow-800 dark:text-yellow-300">
                <p>🏦 <strong>Bank:</strong> {settings.bankName}</p>
                <p>👤 <strong>Account Name:</strong> {settings.accountName}</p>
                <p>🔢 <strong>Account Number:</strong> <span className="font-mono font-bold tracking-widest">{settings.accountNumber}</span></p>
                <p>📝 <strong>Reference:</strong> <span className="font-mono">{payment.reference}</span></p>
              </div>
              <p className="text-xs mt-3 opacity-75">⚠️ Include the reference in your transfer narration so we can identify your payment.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Any note for us? (optional)</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Transferred via GTBank at 10:35am"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white" />
            </div>
            <button onClick={claimBankTransfer} disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Submitting...' : "I've Made the Transfer"}
            </button>
          </div>
        )}

        {/* Claimed confirmation */}
        {claimed && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
            <p className="text-3xl mb-2">⏳</p>
            <h3 className="font-bold text-green-800 dark:text-green-300 mb-1">Payment Claim Received!</h3>
            <p className="text-sm text-green-700 dark:text-green-400">Your account will be activated within 2–6 hours once we confirm your transfer. We'll email you when it's done.</p>
            <button onClick={() => router.push('/dashboard')} className="mt-4 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700">Go to Dashboard</button>
          </div>
        )}

        {/* Flutterwave pay button */}
        {payment && payment.method === 'flutterwave' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Click below to complete your payment via Flutterwave</p>
            <button onClick={launchFlutterwave}
              className="w-full bg-orange-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-orange-600 transition">
              Pay ${payment.amountUSD} via Flutterwave
            </button>
          </div>
        )}

        {/* Paystack pay button */}
        {payment && payment.method === 'paystack' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Click below to complete your payment via Paystack</p>
            <button onClick={launchPaystack}
              className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition">
              Pay ₦{(payment.amountNGN ?? 0).toLocaleString()} via Paystack
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
