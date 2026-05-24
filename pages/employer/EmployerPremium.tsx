'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FLUTTERWAVE_PUBLIC_KEY, getPaymentSettings, isBankDetailsComplete } from '@/config/payments';
import type { PaymentSettings } from '@/config/payments';
import {
  FiCheck, FiZap, FiStar, FiShield, FiUsers,
  FiEye, FiTrendingUp, FiAward, FiX, FiCopy, FiAlertCircle,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

declare global { interface Window { FlutterwaveCheckout: (options: Record<string, unknown>) => void; } }

// ─── Static plan meta ─────────────────────────────────────────────────────────

const PLAN_META = [
  {
    id: 'free',
    name: 'Free',
    period: 'forever',
    description: 'Post jobs and find talent across Africa.',
    features: [
      { text: 'Up to 3 active job listings', included: true },
      { text: 'Basic applicant management', included: true },
      { text: 'Standard listing placement', included: true },
      { text: 'Email notifications', included: true },
      { text: 'Public company profile', included: true },
      { text: 'Featured listings', included: false },
      { text: 'Candidate search database', included: false },
      { text: 'Analytics dashboard', included: false },
      { text: 'Actively Hiring badge', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Current Plan',
    disabled: true,
    accent: false,
  },
  {
    id: 'premium',
    name: 'Growth',
    period: 'per month',
    description: 'For growing teams who want more visibility.',
    badge: 'Most Popular',
    features: [
      { text: '15 active job listings', included: true },
      { text: '2 featured listings per month', included: true },
      { text: 'Full applicant management', included: true },
      { text: 'Kanban pipeline board', included: true },
      { text: 'Analytics dashboard', included: true },
      { text: 'Actively Hiring badge', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Export applicants (CSV)', included: true },
      { text: 'Unlimited listings', included: false },
      { text: 'Candidate database access', included: false },
    ],
    cta: 'Upgrade to Growth',
    disabled: false,
    accent: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    period: 'per month',
    description: 'Best for companies hiring at scale.',
    badge: 'Best Value',
    features: [
      { text: 'Unlimited job listings', included: true },
      { text: 'Unlimited featured listings', included: true },
      { text: 'Candidate database search', included: true },
      { text: 'Advanced analytics & reports', included: true },
      { text: 'Branded company page', included: true },
      { text: 'Verified Employer badge', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'API access', included: true },
      { text: 'White-label job widget', included: true },
      { text: 'Priority homepage placement', included: true },
    ],
    cta: 'Upgrade to Pro',
    disabled: false,
    accent: false,
  },
];

const PERKS = [
  { icon: FiTrendingUp, title: '3× More Applications', desc: 'Featured listings appear at the top of search and homepage.' },
  { icon: FiUsers,      title: 'Applicant Pipeline',   desc: 'Move candidates from Applied → Shortlisted → Hired in one board.' },
  { icon: FiEye,        title: 'Actively Hiring Badge', desc: "Show job seekers you're hiring now and get more quality applies." },
  { icon: FiShield,     title: 'Verified Badge',        desc: 'Verified employers get 40% more applications.' },
  { icon: FiAward,      title: 'Analytics Dashboard',   desc: 'Track views, applies, and conversion for every job.' },
  { icon: FiStar,       title: 'Company Branding',      desc: 'Custom company page with logo, culture, and all open roles.' },
];

// ─── Manual transfer modal ────────────────────────────────────────────────────

interface ManualPayModalProps {
  planId: string;
  amountNGN: number;
  settings: PaymentSettings;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function ManualPayModal({ planId, amountNGN, settings, onConfirm, onClose }: ManualPayModalProps) {
  const [copied, setCopied]     = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone]         = useState(false);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const handleIPaid = async () => {
    setConfirming(true);
    await onConfirm();
    setDone(true);
    setConfirming(false);
  };

  const planLabel = planId === 'pro' ? 'Pro Plan' : 'Growth Plan';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white text-base">Bank Transfer — {planLabel}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <FiX size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 text-center">
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium uppercase tracking-wide mb-1">Amount to Transfer</p>
            <p className="text-3xl font-bold text-primary-700 dark:text-primary-300">₦{amountNGN.toLocaleString()}</p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Bank Name',      value: settings.bankName,      key: 'bank' },
              { label: 'Account Name',   value: settings.accountName,   key: 'name' },
              { label: 'Account Number', value: settings.accountNumber, key: 'acct' },
            ].map(row => (
              <div key={row.key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{row.label}</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">{row.value}</p>
                </div>
                <button onClick={() => copy(row.value, row.key)} className="p-2 text-gray-400 hover:text-primary-600 transition" title="Copy">
                  {copied === row.key ? <FiCheck size={16} className="text-green-500" /> : <FiCopy size={16} />}
                </button>
              </div>
            ))}
          </div>

          {settings.bankNote && (
            <div className="flex gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <FiAlertCircle className="flex-shrink-0 mt-0.5" size={15} />
              <p className="leading-relaxed">{settings.bankNote}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Transfer the exact amount above, then tap <strong className="text-gray-700 dark:text-gray-300">"I've Paid"</strong>.
            Your account will be activated within <strong className="text-gray-700 dark:text-gray-300">24 hours</strong> after we confirm receipt.
          </p>

          {done ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center font-medium">
              ✅ Noted! We'll activate your account once payment is confirmed.
            </div>
          ) : (
            <button
              onClick={handleIPaid}
              disabled={confirming}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {confirming
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                : "I've Paid — Notify Admin"
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmployerPremium() {
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();

  const [loading, setLoading]         = useState(false);
  const [loadingPlan, setLoadingPlan] = useState('');
  const [success, setSuccess]         = useState('');
  const [error, setError]             = useState('');
  const [openFaq, setOpenFaq]         = useState<number | null>(null);
  const [settings, setSettings]       = useState<PaymentSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [manualPlan, setManualPlan]   = useState<string | null>(null);

  useEffect(() => {
    getPaymentSettings().then(s => { setSettings(s); setSettingsLoading(false); });
  }, []);

  const isNigeria = () => Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Lagos';
  const bankReady = settings ? isBankDetailsComplete(settings) : false;
  const isPremium = user?.employerTier === 'premium' || user?.employerTier === 'pro';

  const growthNGN = settings?.employerGrowthNGN ?? 16000;
  const proNGN    = settings?.employerProNGN    ?? 48000;
  const growthUSD = settings?.employerGrowthUSD ?? 10;
  const proUSD    = settings?.employerProUSD    ?? 30;

  const planPrice = (id: string) => {
    if (id === 'free')    return '$0';
    if (id === 'premium') return isNigeria() ? `₦${growthNGN.toLocaleString()}` : `$${growthUSD}`;
    if (id === 'pro')     return isNigeria() ? `₦${proNGN.toLocaleString()}`    : `$${proUSD}`;
    return '';
  };

  const planLocalHint = (id: string) => {
    if (id === 'free') return undefined;
    if (id === 'premium') return isNigeria()
      ? `≈ $${growthUSD} • KES ${Math.round(growthUSD * 130)}`
      : `≈ ₦${growthNGN.toLocaleString()} • KES ${Math.round(growthUSD * 130)}`;
    if (id === 'pro') return isNigeria()
      ? `≈ $${proUSD} • KES ${Math.round(proUSD * 130)}`
      : `≈ ₦${proNGN.toLocaleString()} • KES ${Math.round(proUSD * 130)}`;
  };

  const handleFlutterwaveUpgrade = (planId: string) => {
    if (!user) { router.push('/login'); return; }

    setLoading(true);
    setLoadingPlan(planId);
    setError('');
    setSuccess('');

    const amount = planId === 'premium' ? growthNGN : proNGN;

    window.FlutterwaveCheckout({
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: `emp_${user.uid}_${planId}_${Date.now()}`,
      amount: Number(amount),
      currency: 'NGN',
      payment_options: 'card,mobilemoney,ussd,banktransfer',
      customer: {
        email: user?.email || '',
        name: user?.displayName || user?.name || 'Employer',
      },
      customizations: {
        title: 'JoblifyHQ Employer',
        description: planId === 'premium' ? `Growth Plan - ₦${growthNGN.toLocaleString()}` : `Pro Plan - ₦${proNGN.toLocaleString()}`,
        logo: 'https://joblifyhq.com/logo.png',
      },
      callback: async (response: { status: string; transaction_id: string }) => {
        if (response.status === 'successful' || response.status === 'completed') {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              employerTier: planId,
              employerBilling: 'monthly',
              subscriptionExpiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
              flwTransactionId: response.transaction_id,
              updatedAt: serverTimestamp(),
            });
            if (typeof updateUserProfile === 'function') {
              await updateUserProfile({ employerTier: planId });
            }
            setSuccess(planId === 'pro' ? "You're now on Pro! Unlimited hiring unlocked. 🎉" : "You're now on Growth! Your jobs will get featured. 🚀");
            setTimeout(() => router.push('/employer'), 2000);
          } catch (err) {
            console.error(err);
            setError('Payment succeeded but profile update failed. Contact support.');
          }
        } else {
          setError('Payment was not completed. Please try again.');
        }
        setLoading(false);
        setLoadingPlan('');
      },
      onclose: () => { setLoading(false); setLoadingPlan(''); },
    });
  };

  const handleManualConfirm = async (planId: string) => {
    if (!user) return;
    const ref = `manual_emp_${user.uid}_${planId}_${Date.now()}`;
    await updateDoc(doc(db, 'users', user.uid), {
      employerTier: planId,
      employerPaymentStatus: 'pending_verification',
      employerBilling: 'monthly',
      subscriptionExpiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      manualPayRef: ref,
      updatedAt: serverTimestamp(),
    });
    if (typeof updateUserProfile === 'function') {
      await updateUserProfile({ employerTier: planId });
    }
  };

  const handleUpgradeClick = (planId: string) => {
    if (!user) { router.push('/login'); return; }
    if (planId === 'free') return;
    if (isPremium && planId === user?.employerTier) return;

    if (isNigeria() && bankReady) {
      setManualPlan(planId);
    } else {
      handleFlutterwaveUpgrade(planId);
    }
  };

  const FAQS = [
    {
      q: 'How do I pay?',
      a: isNigeria()
        ? 'Nigerian employers pay via bank transfer. Activation within 24 hours of confirmation. Outside Nigeria, payment goes through Flutterwave — cards, mobile money, bank transfer supported.'
        : 'Secure payment via Flutterwave — cards, bank transfer, USSD, mobile money.',
    },
    { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime, access remains until end of billing period.' },
    { q: "What's the difference between Growth and Pro?", a: 'Growth gives you 15 jobs and 2 features/month. Pro is unlimited everything plus candidate search and API.' },
    { q: 'Is my payment safe?', a: 'For bank transfer, you pay directly to our verified account. For card, Flutterwave is PCI-compliant — we never store card details.' },
  ];

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/20 rounded-full font-semibold mb-5 tracking-wide">
            <FiZap size={12} /> JoblifyHQ Employer
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Hire faster. Hire better.</h1>
          <p className="text-primary-100 text-lg max-w-xl mx-auto leading-relaxed">
            Post jobs, get featured, and manage applicants with tools built for African employers.
          </p>
          {isNigeria() && (
            <span className="inline-block mt-4 text-xs bg-white/20 rounded-full px-3 py-1">
              🇳🇬 Nigerian employers — pay by bank transfer
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {success && <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center">{success}</div>}
        {error   && <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">{error}</div>}

        {isPremium && (
          <div className="mb-10 p-5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
              <FiStar size={20} />
            </div>
            <div>
              <p className="font-semibold text-primary-800 dark:text-primary-200">You're on a Premium employer plan!</p>
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5 capitalize">
                Active plan: {user?.employerTier === 'pro' ? 'Pro' : 'Growth'}
              </p>
            </div>
            <button onClick={() => router.push('/employer')} className="ml-auto text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLAN_META.map((plan) => {
            const isActivePlan = isPremium && plan.id === user?.employerTier;
            const isDisabled   = plan.disabled || loading || isActivePlan;

            const btnClass = `w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
              plan.disabled || isActivePlan
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-default'
                : plan.accent
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`;

            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl flex flex-col ${plan.accent ? 'border-2 border-primary-500 shadow-xl' : 'border border-gray-200 dark:border-gray-700'}`}
              >
                {plan.badge && (
                  <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs px-4 py-1 rounded-full font-semibold whitespace-nowrap ${plan.accent ? 'bg-primary-600 text-white' : 'bg-purple-600 text-white'}`}>
                    {plan.badge}
                  </span>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{plan.description}</p>
                    <div className="flex items-baseline gap-1 mt-3">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">{planPrice(plan.id)}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">/{plan.period}</span>
                    </div>
                    {planLocalHint(plan.id) && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{planLocalHint(plan.id)}</p>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.text} className={`flex items-start gap-2.5 text-sm ${f.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                        {f.included
                          ? <FiCheck className="text-green-500 flex-shrink-0 mt-0.5" size={15} />
                          : <FiX className="text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" size={15} />
                        }
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgradeClick(plan.id)}
                    disabled={isDisabled}
                    className={btnClass}
                  >
                    {loadingPlan === plan.id ? (
                      <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
                    ) : isActivePlan ? '✓ Active Plan'
                      : isNigeria() && bankReady && !plan.disabled ? `🏦 ${plan.cta}`
                      : plan.cta
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Perks */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">Everything employers get</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-10">Tools built to fill roles faster across Africa</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PERKS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{faq.q}</span>
                  <span className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual pay modal */}
      {manualPlan && settings && (
        <ManualPayModal
          planId={manualPlan}
          amountNGN={manualPlan === 'premium' ? growthNGN : proNGN}
          settings={settings}
          onConfirm={async () => { await handleManualConfirm(manualPlan); }}
          onClose={() => setManualPlan(null)}
        />
      )}
    </div>
  );
}
