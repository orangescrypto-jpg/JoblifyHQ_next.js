'use client';
// pages/Premium.tsx
// ─── Premium Plans Page (Job Seekers) ────────────────────────────────────────
// Uses PaymentService via PaymentModal — zero direct Firebase imports.
// Pricing is driven from AdminPaymentSettings (editable in /admin/settings).
//
// FIXES (same as EmployerPremium):
// 1. FALLBACK_SETTINGS used when Firestore read fails — no null settings.
// 2. resolvedSettings passed into PaymentModal so modal never spins forever.
// 3. settingsLoading state so UI renders immediately with fallback prices.

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FiCheck, FiZap, FiStar, FiShield, FiBell,
  FiEye, FiFileText, FiTrendingUp, FiX,
} from 'react-icons/fi';
import PaymentModal from '@/components/payment/PaymentModal';
import { useNigeria } from '@/hooks/useNigeria';
import { PaymentService } from '@/src/services/payment';
import type { AdminPaymentSettings } from '@/src/services/payment';
import type { AppUser } from '@/types';
import type { PaymentPlan } from '@/src/services/payment';

// ── Default fallback settings ─────────────────────────────────────────────────
const FALLBACK_SETTINGS: AdminPaymentSettings = {
  ngnPerUSD:            1470,
  premiumMonthlyUSD:    4,
  premiumAnnualUSD:     40,
  employerGrowthUSD:    10,
  employerScaleUSD:     25,
  boostUSD:             5,
  featuredJobUSD:       5,
  scholarshipBoostUSD:  3,
  flutterwaveEnabled:   true,
  bankName:             '',
  accountNumber:        '',
  accountName:          '',
};

// ── FAQs ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How do I pay from Nigeria?',
    a: 'For Nigerian users we support direct bank transfer. You pay into our account and once confirmed, your plan is activated — usually within a few hours on business days.',
  },
  {
    q: 'How do I pay from outside Nigeria?',
    a: 'Users outside Nigeria can pay instantly via Flutterwave — cards, USSD, and mobile money are all supported. Your plan activates immediately after payment.',
  },
  {
    q: 'Why do I see a Naira amount alongside the dollar price?',
    a: 'We show the Naira equivalent at our reference rate so Nigerian users know exactly what to transfer. For Flutterwave users, the live exchange rate at checkout may differ slightly.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel before your next billing date and your Premium access continues until the end of the period. No penalties.',
  },
  {
    q: 'What is profile boost?',
    a: 'Your profile appears higher in employer search results and application lists on JoblifyHQ, increasing your chances of being noticed without extra effort.',
  },
  {
    q: 'Is my payment information safe?',
    a: 'Yes. For Flutterwave payments we never store card details — everything goes through PCI-compliant Flutterwave. Bank transfers are manual so no card data is involved.',
  },
];

// ── Perks ─────────────────────────────────────────────────────────────────────

const PERKS = [
  { icon: FiTrendingUp, title: 'Profile Boost', desc: 'Your profile and applications rank higher when employers search for candidates on JoblifyHQ.' },
  { icon: FiBell,       title: 'Unlimited Job Alerts', desc: 'Get notified the moment a job matching your skills and location is posted.' },
  { icon: FiEye,        title: 'Profile Views', desc: 'See which employers and recruiters have visited your profile so you know who is interested.' },
  { icon: FiShield,     title: 'Application Tracking', desc: 'Real-time status updates on every application — know exactly where you stand.' },
  { icon: FiFileText,   title: 'Expert CV Review', desc: 'Annual plan includes one human expert CV review to help you craft a standout resume.' },
  { icon: FiStar,       title: 'Featured Badge', desc: 'A Premium badge appears on all your applications, signalling seriousness to employers.' },
];

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  usd,
  ngn,
  rate,
  isPremium,
  activePlan,
  loading,
  onSelect,
  badge,
  accent,
  features,
  cta,
  disabled,
  period,
  subtext,
  description,
}: {
  plan: PaymentPlan | 'free';
  usd: number;
  ngn: number;
  rate: number;
  isPremium: boolean;
  activePlan: string | undefined;
  loading: boolean;
  onSelect: (p: PaymentPlan) => void;
  badge?: string;
  accent: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
  disabled: boolean;
  period: string;
  subtext?: string;
  description: string;
}) {
  const isActive = isPremium && plan === activePlan;
  const isFree = plan === 'free';

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-2xl flex flex-col ${
      accent
        ? 'border-2 border-primary-500 shadow-xl'
        : 'border border-gray-200 dark:border-gray-700'
    }`}>
      {badge && (
        <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs px-4 py-1 rounded-full font-semibold whitespace-nowrap ${
          accent ? 'bg-primary-600 text-white' : 'bg-purple-600 text-white'
        }`}>
          {badge}
        </span>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Pricing */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
            {plan === 'premium-annual' ? 'Annual' : plan === 'free' ? 'Free' : 'Premium'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{description}</p>

          <div className="flex items-baseline gap-1 mt-3">
            {isFree
              ? <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
              : <span className="text-4xl font-bold text-gray-900 dark:text-white">${usd}</span>
            }
            <span className="text-sm text-gray-500 dark:text-gray-400">/{period}</span>
          </div>

          {!isFree && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              ≈ ₦{ngn.toLocaleString()}{' '}
              <span className="text-gray-300 dark:text-gray-600">(1 USD = ₦{rate.toLocaleString()})</span>
            </p>
          )}
          {subtext && (
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5 font-medium">{subtext}</p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-6 flex-1">
          {features.map((f) => (
            <li key={f.text} className={`flex items-start gap-2.5 text-sm ${
              f.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
            }`}>
              {f.included
                ? <FiCheck className="text-green-500 flex-shrink-0 mt-0.5" size={15} />
                : <FiX className="text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" size={15} />
              }
              {f.text}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isFree || disabled ? (
          <button disabled className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-default">
            {isActive ? '✓ Active Plan' : cta}
          </button>
        ) : (
          <button
            onClick={() => onSelect(plan as PaymentPlan)}
            disabled={loading || isActive}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
              isActive
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-default'
                : accent
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
              : isActive ? '✓ Active Plan' : cta
            }
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Premium() {
  const { user } = useAuth();
  const router = useRouter();
  const { isNigeria } = useNigeria();

  const [settings, setSettings]         = useState<AdminPaymentSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [modalPlan, setModalPlan]       = useState<PaymentPlan | null>(null);
  const [success, setSuccess]           = useState('');
  const [error, setError]               = useState('');
  const [openFaq, setOpenFaq]           = useState<number | null>(null);

  useEffect(() => {
    setSettingsLoading(true);
    PaymentService.getAdminSettings()
      .then(s => setSettings(s))
      .catch(() => setSettings(FALLBACK_SETTINGS))
      .finally(() => setSettingsLoading(false));
  }, []);

  // Always non-null — fallback used if Firestore read fails
  const resolvedSettings = settings ?? FALLBACK_SETTINGS;

  const isPremium = user?.tier === 'premium' || user?.tier === 'premium-annual';
  const rate      = resolvedSettings.ngnPerUSD;

  const plans = [
    {
      plan: 'free' as const,
      usd: 0,
      ngn: 0,
      accent: false,
      period: 'forever',
      description: 'Get started exploring jobs and scholarships across Africa.',
      badge: undefined,
      cta: 'Current Free Plan',
      disabled: true,
      features: [
        { text: 'Browse all jobs & scholarships',       included: true  },
        { text: 'Save up to 5 jobs',                    included: true  },
        { text: 'Apply to jobs',                        included: true  },
        { text: '1 job alert',                          included: true  },
        { text: 'Basic profile',                        included: true  },
        { text: 'Profile boost in employer search',     included: false },
        { text: 'See who viewed your profile',          included: false },
        { text: 'Unlimited job alerts',                 included: false },
        { text: 'Application status tracking',          included: false },
        { text: 'Featured applicant badge',             included: false },
      ],
    },
    {
      plan: 'premium' as PaymentPlan,
      usd: resolvedSettings.premiumMonthlyUSD,
      ngn: Math.round(resolvedSettings.premiumMonthlyUSD * rate),
      accent: true,
      period: 'per month',
      description: 'For active job seekers who want to stand out and move faster.',
      badge: 'Most Popular',
      cta: 'Upgrade to Premium',
      disabled: false,
      features: [
        { text: 'Everything in Free',                   included: true  },
        { text: 'Unlimited saved jobs & scholarships',  included: true  },
        { text: 'Profile boost in employer search',     included: true  },
        { text: 'See who viewed your profile',          included: true  },
        { text: 'Unlimited job alerts',                 included: true  },
        { text: 'Application status tracking',          included: true  },
        { text: 'Priority support',                     included: true  },
        { text: 'Early access to new features',         included: true  },
        { text: 'Featured applicant badge',             included: false },
        { text: 'Expert CV review (1×/year)',           included: false },
      ],
    },
    {
      plan: 'premium-annual' as PaymentPlan,
      usd: resolvedSettings.premiumAnnualUSD,
      ngn: Math.round(resolvedSettings.premiumAnnualUSD * rate),
      accent: false,
      period: 'per year',
      subtext: `equivalent to $${(resolvedSettings.premiumAnnualUSD / 12).toFixed(2)}/mo`,
      description: `Best value for serious career builders. Save $${(resolvedSettings.premiumMonthlyUSD * 12) - resolvedSettings.premiumAnnualUSD} vs monthly.`,
      badge: 'Best Value',
      cta: 'Get Annual Plan',
      disabled: false,
      features: [
        { text: 'Everything in Premium',                    included: true },
        { text: 'Featured applicant badge on applications', included: true },
        { text: 'Expert CV review (1×/year)',               included: true },
        { text: 'Dedicated career tips newsletter',         included: true },
        { text: 'Locked-in price guarantee',                included: true },
        { text: 'Unlimited saved jobs & scholarships',      included: true },
        { text: 'Profile boost in employer search',         included: true },
        { text: 'See who viewed your profile',              included: true },
        { text: 'Unlimited job alerts',                     included: true },
        { text: 'Application status tracking',              included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/20 rounded-full font-semibold mb-5 tracking-wide">
            <FiZap size={12} /> JoblifyHQ Premium
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Land your dream job faster</h1>
          <p className="text-primary-100 text-lg max-w-xl mx-auto leading-relaxed">
            Unlock tools that get you noticed by employers, keep you ahead of deadlines, and move your African career forward.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs bg-white/10 px-4 py-2 rounded-full">
            {isNigeria
              ? '🇳🇬 Nigerian users — bank transfer available at checkout'
              : '🌍 Pay instantly via card or mobile money at checkout'}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Alerts */}
        {success && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Active plan banner */}
        {isPremium && (
          <div className="mb-10 p-5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
              <FiStar size={20} />
            </div>
            <div>
              <p className="font-semibold text-primary-800 dark:text-primary-200">You&apos;re already a Premium member!</p>
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5 capitalize">
                Active plan: {user?.tier === 'premium-annual' ? 'Annual Premium' : 'Monthly Premium'}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="ml-auto text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* Rate info bar */}
        {!isPremium && !settingsLoading && (
          <div className="mb-8 flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
            <span>
              Prices in USD. Naira equivalent shown at reference rate{' '}
              <strong>1 USD = ₦{rate.toLocaleString()}</strong>.{' '}
              {isNigeria
                ? 'Nigerian users can pay via bank transfer at checkout.'
                : 'Pay instantly via card or mobile money through Flutterwave.'}
            </span>
          </div>
        )}

        {/* Loading skeleton for rate bar */}
        {!isPremium && settingsLoading && (
          <div className="mb-8 h-10 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl animate-pulse" />
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {plans.map((p) => (
            <PlanCard
              key={p.plan}
              {...p}
              rate={rate}
              isPremium={isPremium}
              activePlan={user?.tier}
              loading={false}
              onSelect={(plan) => {
                if (!user) { router.push('/login'); return; }
                setError('');
                setModalPlan(plan);
              }}
            />
          ))}
        </div>

        {/* Perks */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Everything you unlock</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PERKS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 flex gap-4">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 flex-shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Common questions</h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <div key={q} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{q}</span>
                  <span className="text-gray-400 flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment modal — passes resolvedSettings so it never spins or fails silently */}
      {modalPlan && user && (
        <PaymentModal
          isOpen={!!modalPlan}
          onClose={() => setModalPlan(null)}
          plan={modalPlan}
          user={user as AppUser}
          isNigeria={isNigeria}
          settings={resolvedSettings}
          onSuccess={(msg) => { setSuccess(msg); setModalPlan(null); }}
          onError={(msg) => setError(msg)}
        />
      )}
    </div>
  );
}
