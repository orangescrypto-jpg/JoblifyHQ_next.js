'use client';
// components/payment/PaymentModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Payment routing:
//   Nigeria       → Manual bank transfer  OR  Crypto (USDT/USDC on ETH/BNB)
//   Outside NG    → Flutterwave  OR  PayPal  OR  Crypto (USDT/USDC on ETH/BNB)
//
// ALL non-Flutterwave payments stay "pending" until admin confirms.
// Flutterwave auto-confirms via callback.
//
// NGN amounts shown to Nigerian users.
// Crypto amounts shown as USDT/USDC equivalent to ALL users.
// Outside Nigeria sees USD amounts for Flutterwave/PayPal.

import { useState, useEffect, useCallback } from 'react';
import {
  FiX, FiCopy, FiCheck, FiAlertCircle, FiInfo,
  FiCheckCircle, FiCreditCard, FiChevronRight,
} from 'react-icons/fi';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { PaymentService } from '@/src/services/payment';
import type {
  AdminPaymentSettings, PaymentPlan, PaymentMethod, PendingPayment,
} from '@/src/services/payment';
import type { AppUser } from '@/types';
import { FLUTTERWAVE_PUBLIC_KEY } from '@/config/payments';

// ── Fallback settings ─────────────────────────────────────────────────────────

const FALLBACK: AdminPaymentSettings = {
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

function getPlanLabel(plan: PaymentPlan): string {
  const map: Record<PaymentPlan, string> = {
    premium:            'Premium Monthly',
    'premium-annual':   'Premium Annual',
    'employer-growth':  'Employer Growth',
    'employer-scale':   'Employer Scale',
    'freelancer-pro':   'Freelancer Pro',
    boost:              'Profile Boost',
    featured_job:       'Featured Job',
    featured_gig:       'Featured Gig',
    scholarship_boost:  'Scholarship Boost',
  };
  return map[plan];
}

function getAmountUSD(plan: PaymentPlan, s: AdminPaymentSettings): number {
  const map: Record<PaymentPlan, number> = {
    premium:            s.premiumMonthlyUSD,
    'premium-annual':   s.premiumAnnualUSD,
    'employer-growth':  s.employerGrowthUSD,
    'employer-scale':   s.employerScaleUSD,
    'freelancer-pro':   s.freelancerProUSD,
    boost:              s.boostUSD,
    featured_job:       s.featuredJobUSD,
    featured_gig:       s.featuredGigUSD,
    scholarship_boost:  s.scholarshipBoostUSD,
  };
  return map[plan];
}

// ── Shared UI pieces ──────────────────────────────────────────────────────────

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
      <FiAlertCircle size={15} className="flex-shrink-0 mt-0.5" />
      {msg}
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono break-all">{value}</p>
      </div>
      <button onClick={copy} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition shrink-0">
        {copied ? <FiCheck size={14} className="text-green-500" /> : <FiCopy size={14} />}
      </button>
    </div>
  );
}

function SuccessScreen({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="py-8 text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <FiCheckCircle size={32} className="text-green-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Submitted!</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{message}</p>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-left space-y-1.5">
        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">What happens next?</p>
        <p className="text-xs text-yellow-700 dark:text-yellow-400">1. Admin reviews and confirms your payment.</p>
        <p className="text-xs text-yellow-700 dark:text-yellow-400">2. You will be notified once your plan or feature is activated.</p>
        <p className="text-xs text-yellow-700 dark:text-yellow-400">3. Check your dashboard for the status update.</p>
      </div>
      <button onClick={onClose} className="mt-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition">
        Done
      </button>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  plan:      PaymentPlan;
  user:      AppUser;
  onSuccess: (msg: string) => void;
  onError:   (msg: string) => void;
  settings?: AdminPaymentSettings;
}

// ── Method option card ────────────────────────────────────────────────────────

function MethodCard({
  icon, title, subtitle, selected, onClick, disabled,
}: {
  icon: string; title: string; subtitle: string;
  selected: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition text-left ${
        selected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${selected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>{title}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      {selected && <FiCheck size={16} className="text-primary-600 shrink-0" />}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PaymentModal({ isOpen, onClose, plan, user, onSuccess, onError, settings: settingsProp }: Props) {
  const isNigeria = (user.country || '').toLowerCase() === 'nigeria';

  const [settings, setSettings]             = useState<AdminPaymentSettings>(settingsProp ?? FALLBACK);
  const [loadingSettings, setLoadingSettings] = useState(!settingsProp);
  const [method, setMethod]                 = useState<PaymentMethod | null>(null);
  const [step, setStep]                     = useState<'choose' | 'pay' | 'done'>('choose');
  const [successMsg, setSuccessMsg]         = useState('');
  const [error, setError]                   = useState('');
  const [note, setNote]                     = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

  useEffect(() => {
    if (!isOpen || settingsProp) return;
    setLoadingSettings(true);
    PaymentService.getAdminSettings()
      .then(s => setSettings(s))
      .catch(() => setSettings(FALLBACK))
      .finally(() => setLoadingSettings(false));
  }, [isOpen, settingsProp]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setMethod(null); setStep('choose');
      setError(''); setNote(''); setPendingPayment(null); setSuccessMsg('');
    }
  }, [isOpen]);

  const amountUSD   = getAmountUSD(plan, settings);
  const amountNGN   = Math.round(amountUSD * settings.ngnPerUSD);
  const amountCrypto = +(amountUSD * settings.usdtPerUSD).toFixed(2);

  // ── Flutterwave hook (only used for non-Nigeria) ──────────────────────────
  const handleFlutterwave = useFlutterwave({
    public_key:      FLUTTERWAVE_PUBLIC_KEY,
    tx_ref:          `JBF_${user.uid}_${plan}_${Date.now()}`,
    amount:          amountUSD,
    currency:        'USD',
    payment_options: 'card,mobilemoney',
    customer: {
      email:        user.email || '',
      name:         user.displayName || user.name || 'JoblifyHQ User',
      phone_number: '',
    },
    customizations: {
      title:       'JoblifyHQ',
      description: `${getPlanLabel(plan)} — $${amountUSD}`,
      logo:        'https://joblifyhq.com/logo.png',
    },
  });

  // ── Create pending record and mark claimed ────────────────────────────────
  const submitClaim = useCallback(async (selectedMethod: PaymentMethod) => {
    setSubmitting(true);
    setError('');
    try {
      const payment = await PaymentService.createPendingPayment({ user, plan, method: selectedMethod, settings });
      await PaymentService.submitPaymentClaim(payment.id, note || undefined);
      setPendingPayment(payment);
      const msg = 'Your payment has been submitted and is awaiting admin confirmation. You will be notified once activated.';
      setSuccessMsg(msg);
      setStep('done');
      onSuccess(msg);
    } catch (err) {
      console.error(err);
      setError('Could not submit your payment claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [user, plan, settings, note, onSuccess]);

  // ── Flutterwave payment init ───────────────────────────────────────────────
  const initFlutterwave = useCallback(async () => {
    setSubmitting(true);
    setError('');
    let payment: PendingPayment;
    try {
      payment = await PaymentService.createPendingPayment({ user, plan, method: 'flutterwave', settings });
    } catch {
      setError('Could not initialise payment. Try again.');
      setSubmitting(false);
      return;
    }
    handleFlutterwave({
      callback: async (response) => {
        closePaymentModal();
        if (response.status === 'successful' || response.status === 'completed') {
          try {
            await PaymentService.recordFlutterwaveSuccess({
              paymentId: payment.id,
              flwTransactionId: response.transaction_id,
              plan,
              userId: user.uid,
            });
            const msg = '🎉 Payment confirmed! Your plan is now active.';
            setSuccessMsg(msg);
            setStep('done');
            onSuccess(msg);
          } catch {
            onError('Payment succeeded but activation failed. Contact support with your transaction ID: ' + response.transaction_id);
          }
        } else {
          await PaymentService.cancelPayment(payment.id);
          setError('Payment was not completed. Please try again.');
        }
        setSubmitting(false);
      },
      onClose: () => setSubmitting(false),
    });
  }, [handleFlutterwave, plan, settings, user, onSuccess, onError]); // eslint-disable-line

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

  // ── Available methods based on country ────────────────────────────────────
  type MethodDef = { id: PaymentMethod; icon: string; title: string; subtitle: string; enabled: boolean };

  const nigeriaMethods: MethodDef[] = [
    {
      id:       'manual_transfer',
      icon:     '🏦',
      title:    'Bank Transfer (NGN)',
      subtitle: `Pay ₦${amountNGN.toLocaleString()} to our Nigerian account`,
      enabled:  settings.bankTransferEnabled,
    },
    {
      id:       'crypto_usdt_eth',
      icon:     '🔷',
      title:    'USDT — Ethereum Network',
      subtitle: `Pay ${amountCrypto} USDT to our ETH wallet`,
      enabled:  settings.cryptoEthEnabled && !!settings.cryptoWalletEth,
    },
    {
      id:       'crypto_usdc_eth',
      icon:     '🔵',
      title:    'USDC — Ethereum Network',
      subtitle: `Pay ${amountCrypto} USDC to our ETH wallet`,
      enabled:  settings.cryptoEthEnabled && !!settings.cryptoWalletEth,
    },
    {
      id:       'crypto_usdt_bnb',
      icon:     '🟡',
      title:    'USDT — BNB Chain',
      subtitle: `Pay ${amountCrypto} USDT to our BNB wallet`,
      enabled:  settings.cryptoBnbEnabled && !!settings.cryptoWalletBnb,
    },
    {
      id:       'crypto_usdc_bnb',
      icon:     '🟠',
      title:    'USDC — BNB Chain',
      subtitle: `Pay ${amountCrypto} USDC to our BNB wallet`,
      enabled:  settings.cryptoBnbEnabled && !!settings.cryptoWalletBnb,
    },
  ];

  const internationalMethods: MethodDef[] = [
    {
      id:       'flutterwave',
      icon:     '💳',
      title:    'Flutterwave — Card / Mobile Money',
      subtitle: `Pay $${amountUSD} — instant confirmation`,
      enabled:  settings.flutterwaveEnabled,
    },
    {
      id:       'paypal',
      icon:     '🅿️',
      title:    'PayPal',
      subtitle: `Send $${amountUSD} to our PayPal`,
      enabled:  settings.paypalEnabled && !!settings.paypalEmail,
    },
    {
      id:       'crypto_usdt_eth',
      icon:     '🔷',
      title:    'USDT — Ethereum Network',
      subtitle: `Pay ${amountCrypto} USDT to our ETH wallet`,
      enabled:  settings.cryptoEthEnabled && !!settings.cryptoWalletEth,
    },
    {
      id:       'crypto_usdc_eth',
      icon:     '🔵',
      title:    'USDC — Ethereum Network',
      subtitle: `Pay ${amountCrypto} USDC to our ETH wallet`,
      enabled:  settings.cryptoEthEnabled && !!settings.cryptoWalletEth,
    },
    {
      id:       'crypto_usdt_bnb',
      icon:     '🟡',
      title:    'USDT — BNB Chain',
      subtitle: `Pay ${amountCrypto} USDT to our BNB wallet`,
      enabled:  settings.cryptoBnbEnabled && !!settings.cryptoWalletBnb,
    },
    {
      id:       'crypto_usdc_bnb',
      icon:     '🟠',
      title:    'USDC — BNB Chain',
      subtitle: `Pay ${amountCrypto} USDC to our BNB wallet`,
      enabled:  settings.cryptoBnbEnabled && !!settings.cryptoWalletBnb,
    },
  ];

  const methodList = isNigeria ? nigeriaMethods : internationalMethods;
  const isCrypto   = method?.startsWith('crypto_') ?? false;
  const cryptoWallet = method?.includes('bnb') ? settings.cryptoWalletBnb : settings.cryptoWalletEth;
  const cryptoCoin   = method?.includes('usdc') ? 'USDC' : 'USDT';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{getPlanLabel(plan)}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isNigeria ? `₦${amountNGN.toLocaleString()}` : `$${amountUSD}`}
              {' '}·{' '}
              <span className={isNigeria ? 'text-green-600' : 'text-primary-600'}>
                {isNigeria ? '🇳🇬 Nigeria' : '🌍 International'}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Done screen */}
          {step === 'done' && <SuccessScreen message={successMsg} onClose={onClose} />}

          {/* Step 1 — Choose method */}
          {step === 'choose' && (
            <>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Select Payment Method
              </p>

              {error && <ErrorBanner msg={error} />}

              <div className="space-y-2">
                {methodList.filter(m => m.enabled).map(m => (
                  <MethodCard
                    key={m.id}
                    icon={m.icon}
                    title={m.title}
                    subtitle={m.subtitle}
                    selected={method === m.id}
                    onClick={() => { setMethod(m.id); setError(''); }}
                  />
                ))}
                {methodList.every(m => !m.enabled) && (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No payment methods are currently enabled. Please contact support.
                  </p>
                )}
              </div>

              {method && (
                <button
                  onClick={() => method === 'flutterwave' ? initFlutterwave() : setStep('pay')}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
                    : <>Continue <FiChevronRight size={16} /></>}
                </button>
              )}
            </>
          )}

          {/* Step 2 — Pay details */}
          {step === 'pay' && method && (
            <>
              <button onClick={() => setStep('choose')} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mb-1">
                ← Back
              </button>

              {error && <ErrorBanner msg={error} />}

              {/* Nigerian bank transfer */}
              {method === 'manual_transfer' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                    <FiInfo size={13} className="mt-0.5 shrink-0" />
                    Transfer exactly <strong className="mx-1">₦{amountNGN.toLocaleString()}</strong> to the account below, then click &quot;I&apos;ve Paid&quot;.
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <CopyRow label="Bank Name"      value={settings.bankName} />
                    <CopyRow label="Account Name"   value={settings.accountName} />
                    <CopyRow label="Account Number" value={settings.accountNumber} />
                    <CopyRow label="Amount (NGN)"   value={`₦${amountNGN.toLocaleString()}`} />
                  </div>
                  <input
                    type="text" value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Your name / transfer note (optional)"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => submitClaim('manual_transfer')} disabled={submitting}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                      : <><FiCheck size={16} /> I&apos;ve Paid — Notify Admin</>}
                  </button>
                  <p className="text-center text-xs text-gray-400">Your plan activates after admin confirms the transfer.</p>
                </div>
              )}

              {/* PayPal */}
              {method === 'paypal' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                    <FiInfo size={13} className="mt-0.5 shrink-0" />
                    Send exactly <strong className="mx-1">${amountUSD} USD</strong> via PayPal to the address below, then click &quot;I&apos;ve Paid&quot;.
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <CopyRow label="PayPal Email" value={settings.paypalEmail} />
                    <CopyRow label="Amount"       value={`$${amountUSD} USD`} />
                  </div>
                  <input
                    type="text" value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Your PayPal transaction ID (optional)"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => submitClaim('paypal')} disabled={submitting}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                      : <><FiCheck size={16} /> I&apos;ve Paid — Notify Admin</>}
                  </button>
                  <p className="text-center text-xs text-gray-400">Your plan activates after admin confirms receipt.</p>
                </div>
              )}

              {/* Crypto (USDT / USDC on ETH or BNB) */}
              {isCrypto && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-xs text-yellow-700 dark:text-yellow-300">
                    <FiInfo size={13} className="mt-0.5 shrink-0" />
                    <span>
                      Send exactly <strong className="mx-0.5">{amountCrypto} {cryptoCoin}</strong>
                      {' '}on the <strong className="mx-0.5">{method.includes('bnb') ? 'BNB Chain' : 'Ethereum'}</strong> network.
                      {isNigeria && <> That is approximately <strong className="mx-0.5">₦{amountNGN.toLocaleString()}</strong> at today&apos;s rate.</>}
                      {' '}<span className="text-yellow-600 font-semibold">Wrong network = lost funds.</span>
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <CopyRow label="Wallet Address" value={cryptoWallet} />
                    <CopyRow label="Network"        value={method.includes('bnb') ? 'BNB Chain (BSC)' : 'Ethereum (ERC-20)'} />
                    <CopyRow label="Token"          value={cryptoCoin} />
                    <CopyRow label="Amount"         value={`${amountCrypto} ${cryptoCoin}`} />
                  </div>
                  <input
                    type="text" value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Your TX hash / transaction ID (optional but helpful)"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => submitClaim(method)} disabled={submitting}
                    className="w-full py-3 rounded-xl bg-yellow-600 hover:bg-yellow-700 disabled:opacity-60 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                      : <><FiCheck size={16} /> I&apos;ve Sent — Notify Admin</>}
                  </button>
                  <p className="text-center text-xs text-gray-400">Your plan activates after admin confirms the transaction on-chain.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
