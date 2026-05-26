'use client';
// components/payment/PaymentModal.tsx
// ─── Dual Payment Modal ────────────────────────────────────────────────────────
// Shows bank-transfer flow for Nigerian users (or fallback)
// Shows Flutterwave flow for all other African countries.
// Pricing is fetched from AdminPaymentSettings so admin can change without code.
//
// FIXES:
// 1. Errors now show INSIDE the modal (not silently behind it on the page).
// 2. Modal uses FALLBACK_SETTINGS if Firestore read fails — no infinite spinner.
// 3. "I've Paid" success shows a proper confirmation screen before closing.

import { useState, useEffect, useCallback } from 'react';
import {
  FiX, FiCopy, FiCheck, FiAlertCircle,
  FiCreditCard, FiBriefcase, FiInfo, FiCheckCircle,
} from 'react-icons/fi';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { PaymentService } from '@/src/services/payment';
import type {
  AdminPaymentSettings, PaymentPlan, PendingPayment,
} from '@/src/services/payment';
import type { AppUser } from '@/types';
import { FLUTTERWAVE_PUBLIC_KEY } from '@/config/payments';

// ── Fallback settings (used when Firestore read fails) ────────────────────────
const FALLBACK_SETTINGS: AdminPaymentSettings = {
  bankName: 'Access Bank',
  accountName: 'JoblifyHQ Ltd',
  accountNumber: '0000000000',
  premiumMonthlyUSD: 4,
  premiumAnnualUSD: 40,
  employerGrowthUSD: 10,
  employerScaleUSD: 25,
  boostUSD: 3,
  featuredJobUSD: 5,
  scholarshipBoostUSD: 3,
  ngnPerUSD: 1470,
  flutterwaveEnabled: true,
};

// ── Plan metadata ─────────────────────────────────────────────────────────────

export interface PlanMeta {
  id: PaymentPlan;
  label: string;
  descriptionUSD: string;
}

function getPlanLabel(plan: PaymentPlan): string {
  const map: Record<PaymentPlan, string> = {
    premium:           'Premium Monthly',
    'premium-annual':  'Premium Annual',
    'employer-growth': 'Employer Growth',
    'employer-scale':  'Employer Scale',
    boost:             'Profile / Listing Boost',
  };
  return map[plan];
}

function getAmountUSD(plan: PaymentPlan, s: AdminPaymentSettings): number {
  const map: Record<PaymentPlan, number> = {
    premium:           s.premiumMonthlyUSD,
    'premium-annual':  s.premiumAnnualUSD,
    'employer-growth': s.employerGrowthUSD,
    'employer-scale':  s.employerScaleUSD,
    boost:             s.boostUSD,
  };
  return map[plan];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PaymentPlan;
  user: AppUser;
  isNigeria: boolean;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  /** Optional: pass pre-fetched settings from parent to skip internal fetch */
  settings?: AdminPaymentSettings;
}

// ── Internal error banner ─────────────────────────────────────────────────────

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
      <FiAlertCircle size={15} className="flex-shrink-0 mt-0.5" />
      {msg}
    </div>
  );
}

// ── Manual transfer sub-component ─────────────────────────────────────────────

function ManualTransferFlow({
  settings,
  plan,
  user,
  amountNGN,
  amountUSD,
  onSuccess,
  onClose,
}: {
  settings: AdminPaymentSettings;
  plan: PaymentPlan;
  user: AppUser;
  amountNGN: number;
  amountUSD: number;
  onSuccess: (msg: string) => void;
  onClose: () => void;
}) {
  const [copied, setCopied]       = useState<string | null>(null);
  const [note, setNote]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [step, setStep]           = useState<'details' | 'confirm'>('details');
  // FIX: error shown INSIDE the modal so user sees it immediately
  const [localError, setLocalError] = useState('');

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleIHavePaid = async () => {
    setSubmitting(true);
    setLocalError('');
    try {
      const payment: PendingPayment = await PaymentService.createPendingPayment({
        user,
        plan,
        method: 'manual_transfer',
        settings,
      });
      await PaymentService.submitManualTransferClaim(payment.id, note || undefined);
      setPendingId(payment.id);
      setStep('confirm');
      // Also notify parent so it can show success banner after modal closes
      onSuccess('✅ Transfer claim submitted! We will confirm and activate your plan within a few hours.');
    } catch (err: unknown) {
      console.error('[PaymentModal] claim error:', err);
      const raw = err instanceof Error ? err.message : String(err);
      if (raw.includes('permission') || raw.includes('Missing or insufficient')) {
        setLocalError('Permission error saving your payment record. Please contact support.');
      } else if (raw.includes('network') || raw.includes('unavailable')) {
        setLocalError('Network error. Check your connection and try again.');
      } else {
        setLocalError('Could not submit your claim. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmation screen (shown after successful claim) ────────────────────
  if (step === 'confirm') {
    return (
      <div className="py-6 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <FiCheckCircle size={32} className="text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Claim Submitted Successfully!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
          We have received your transfer notification
          {pendingId && (
            <> (ref: <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{pendingId.slice(0, 10)}</span>)</>
          )}.
        </p>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-left space-y-1.5">
          <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">What happens next?</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">1. Our team verifies your bank transfer — usually within a few hours on business days.</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">2. Once confirmed, your plan will be activated automatically.</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">3. You will see your new plan reflected in your dashboard.</p>
        </div>
        <p className="text-xs text-gray-400">You can close this window and check your dashboard for status updates.</p>
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition"
        >
          Done — Go to Dashboard
        </button>
      </div>
    );
  }

  // ── Details screen ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Internal error banner — shows INSIDE modal */}
      {localError && <ErrorBanner msg={localError} />}

      {/* Rate notice */}
      <div className="flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
        <FiInfo size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          Exchange rate used: <strong>1 USD = ₦{settings.ngnPerUSD.toLocaleString()}</strong>.
          You will pay <strong>₦{amountNGN.toLocaleString()}</strong> (≈ ${amountUSD}).
        </span>
      </div>

      {/* Bank details */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Bank Transfer Details
        </p>

        {[
          { label: 'Bank Name',      value: settings.bankName },
          { label: 'Account Name',   value: settings.accountName },
          { label: 'Account Number', value: settings.accountNumber },
          { label: 'Amount (NGN)',    value: `₦${amountNGN.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{value}</p>
            </div>
            <button
              onClick={() => copy(value, label)}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
              title="Copy"
            >
              {copied === label ? <FiCheck size={14} className="text-green-500" /> : <FiCopy size={14} />}
            </button>
          </div>
        ))}
      </div>

      {/* Note field */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Add your name / note (optional — helps us match your transfer faster)
        </label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. John Doe — Employer Growth"
          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* CTA */}
      <button
        onClick={handleIHavePaid}
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
        ) : (
          <>
            <FiCheck size={16} /> I&apos;ve Paid — Notify Admin
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Your plan is activated after admin confirms receipt. Usually within a few hours on business days.
      </p>
    </div>
  );
}

// ── Flutterwave sub-component ─────────────────────────────────────────────────

function FlutterwaveFlow({
  settings,
  plan,
  user,
  amountNGN,
  amountUSD,
  onSuccess,
  onError,
  onClose,
}: {
  settings: AdminPaymentSettings;
  plan: PaymentPlan;
  user: AppUser;
  amountNGN: number;
  amountUSD: number;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onClose: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleFlutterPayment = useFlutterwave({
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    tx_ref:     `JBF_${user.uid}_${plan}_${Date.now()}`,
    amount:     amountNGN,
    currency:   'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email:        user.email || '',
      name:         user.displayName || user.name || 'JoblifyHQ User',
      phone_number: '',
    },
    customizations: {
      title:       'JoblifyHQ',
      description: `${getPlanLabel(plan)} — ₦${amountNGN.toLocaleString()} (≈ $${amountUSD})`,
      logo:        'https://joblifyhq.com/logo.png',
    },
  });

  const initPayment = useCallback(async () => {
    setProcessing(true);
    setLocalError('');

    let payment: PendingPayment;
    try {
      payment = await PaymentService.createPendingPayment({
        user,
        plan,
        method: 'flutterwave',
        settings,
      });
    } catch (err) {
      console.error(err);
      setLocalError('Could not initialise payment. Please try again.');
      setProcessing(false);
      return;
    }

    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();
        if (response.status === 'successful' || response.status === 'completed') {
          try {
            await PaymentService.recordFlutterwaveSuccess({
              paymentId:        payment.id,
              flwTransactionId: response.transaction_id,
              plan,
              userId:           user.uid,
            });
            onSuccess(
              plan === 'boost'
                ? '🚀 Your boost is now live!'
                : '🎉 Payment confirmed! Your plan is now active.'
            );
            onClose();
          } catch (err) {
            console.error(err);
            onError('Payment succeeded but update failed. Contact support with your transaction ID: ' + response.transaction_id);
          }
        } else {
          await PaymentService.cancelPayment(payment.id);
          setLocalError('Payment was not completed. Please try again.');
        }
        setProcessing(false);
      },
      onClose: () => {
        setProcessing(false);
      },
    });
  }, [handleFlutterPayment, plan, settings, user, onSuccess, onError, onClose]); // eslint-disable-line

  return (
    <div className="space-y-4">
      {localError && <ErrorBanner msg={localError} />}

      {/* Rate notice */}
      <div className="flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
        <FiInfo size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          Price shown in USD. At checkout, Flutterwave converts using today&apos;s live rate.
          Reference rate: <strong>1 USD ≈ ₦{settings.ngnPerUSD.toLocaleString()}</strong>.
        </span>
      </div>

      {/* Amount display */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
        <p className="text-xs text-gray-400 mb-1">You are paying</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">${amountUSD}</p>
        <p className="text-sm text-gray-400 mt-1">≈ ₦{amountNGN.toLocaleString()} at today&apos;s rate</p>
        <p className="text-xs text-gray-400 mt-0.5">for {getPlanLabel(plan)}</p>
      </div>

      <button
        onClick={initPayment}
        disabled={processing}
        className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
      >
        {processing ? (
          <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Opening Flutterwave…</>
        ) : (
          <><FiCreditCard size={16} /> Pay with Card / Mobile Money</>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Secured by Flutterwave · Cards, USSD, Mobile Money supported
      </p>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function PaymentModal({
  isOpen,
  onClose,
  plan,
  user,
  isNigeria,
  onSuccess,
  onError,
  settings: settingsProp,
}: PaymentModalProps) {
  // FIX: use prop settings if passed (from parent), otherwise fetch internally.
  // On fetch failure, fall back to FALLBACK_SETTINGS — no infinite spinner.
  const [settings, setSettings]         = useState<AdminPaymentSettings>(settingsProp ?? FALLBACK_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(!settingsProp);
  const [method, setMethod]             = useState<'auto' | 'manual' | 'flutterwave'>('auto');

  useEffect(() => {
    if (!isOpen || settingsProp) return;
    setLoadingSettings(true);
    PaymentService.getAdminSettings()
      .then(s => setSettings(s))
      .catch(() => setSettings(FALLBACK_SETTINGS)) // never null — always usable
      .finally(() => setLoadingSettings(false));
  }, [isOpen, settingsProp]);

  if (!isOpen) return null;

  if (loadingSettings) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading payment options…</p>
        </div>
      </div>
    );
  }

  const amountUSD = getAmountUSD(plan, settings);
  const amountNGN = Math.round(amountUSD * settings.ngnPerUSD);

  const resolvedMethod: 'manual' | 'flutterwave' =
    method === 'manual'      ? 'manual'
    : method === 'flutterwave' ? 'flutterwave'
    : isNigeria               ? 'manual'
    : 'flutterwave';

  const showFlutterwaveToggle = settings.flutterwaveEnabled;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {getPlanLabel(plan)}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              ${amountUSD} · ≈ ₦{amountNGN.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Method switcher */}
        <div className="px-5 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMethod('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition ${
                resolvedMethod === 'manual'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-400 text-green-700 dark:text-green-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'
              }`}
            >
              <FiBriefcase size={12} /> Bank Transfer
              {isNigeria && resolvedMethod === 'manual' && (
                <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white rounded-full text-[10px]">NG</span>
              )}
            </button>

            {showFlutterwaveToggle && (
              <button
                onClick={() => setMethod('flutterwave')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  resolvedMethod === 'flutterwave'
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                }`}
              >
                <FiCreditCard size={12} /> Card / Mobile Money
              </button>
            )}
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 text-center">
            {resolvedMethod === 'manual'
              ? isNigeria
                ? '🇳🇬 Nigerian bank transfer — pay manually, admin confirms.'
                : 'Bank transfer — pay manually, admin confirms within a few hours.'
              : '🌍 Instant payment via Flutterwave — cards, USSD & mobile money.'}
          </p>
        </div>

        {/* Flow body */}
        <div className="p-5">
          {resolvedMethod === 'manual' ? (
            <ManualTransferFlow
              settings={settings}
              plan={plan}
              user={user}
              amountNGN={amountNGN}
              amountUSD={amountUSD}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          ) : (
            <FlutterwaveFlow
              settings={settings}
              plan={plan}
              user={user}
              amountNGN={amountNGN}
              amountUSD={amountUSD}
              onSuccess={onSuccess}
              onError={onError}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
