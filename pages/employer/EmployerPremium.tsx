'use client';
// pages/employer/EmployerPremium.tsx
// ─── Employer Premium Plans ───────────────────────────────────────────────────
// Uses PaymentModal (dual flow: bank transfer for NG, Flutterwave for rest).
// Pricing pulled live from AdminPaymentSettings — no hardcoded amounts.
// Zero direct Firebase imports.
//
// FIX: Modal now opens with default fallback settings when Firestore
// admin_config/payment_settings cannot be read (e.g. missing Firestore rule).
// Previously `settings === null` silently blocked the modal from ever opening.

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FiCheck, FiZap, FiStar, FiShield, FiUsers,
  FiEye, FiTrendingUp, FiAward, FiX, FiInfo, FiLoader,
} from 'react-icons/fi';
import PaymentModal from '@/components/payment/PaymentModal';
import { useNigeria } from '@/hooks/useNigeria';
import { PaymentService } from '@/src/services/payment';
import type { AdminPaymentSettings, PaymentPlan } from '@/src/services/payment';
import type { AppUser } from '@/types';

// ── Default fallback settings (used if Firestore read fails) ──────────────────
// These match the hardcoded defaults in AdminPaymentSettings so the modal
// always opens even before the admin has saved custom prices.

const FALLBACK_SETTINGS: AdminPaymentSettings = {
  ngnPerUSD:          1470,
  premiumMonthlyUSD:  4,
  premiumAnnualUSD:   36,
  employerGrowthUSD:  10,
  employerScaleUSD:   25,
  boostUSD:           5,
  flutterwaveEnabled: true,
  bankName:           '',
  accountNumber:      '',
  accountName:        '',
};

// ── Perks ─────────────────────────────────────────────────────────────────────

const PERKS = [
  { icon: FiTrendingUp, title: '3× More Applications',  desc: 'Featured listings appear at the top of search and the homepage.' },
  { icon: FiUsers,      title: 'Applicant Pipeline',     desc: 'Move candidates from Applied → Shortlisted → Hired in one board.' },
  { icon: FiEye,        title: 'Actively Hiring Badge',  desc: "Show job seekers you're hiring now and get more quality applicants." },
  { icon: FiShield,     title: 'Verified Badge',         desc: 'Build trust — verified employers get 40% more applications.' },
  { icon: FiAward,      title: 'Analytics Dashboard',    desc: 'Track views, applications, and conversion for every job listing.' },
  { icon: FiStar,       title: 'Company Branding',       desc: 'Custom company page with logo, culture photos, and all open roles.' },
];

// ── FAQs ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "How do I pay from Nigeria?",
    a: "Nigerian employers can pay via direct bank transfer. Once you transfer and click \"I've Paid\", our team confirms receipt and activates your plan — usually within a few hours on business days.",
  },
  {
    q: "How do I pay from outside Nigeria?",
    a: "Employers outside Nigeria can pay instantly via Flutterwave — cards, USSD, and mobile money are all supported. Your plan activates immediately.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel before your next billing date and access continues until the end of the period. No penalties or hidden fees.",
  },
  {
    q: "What's the difference between Growth and Scale?",
    a: "Growth gives you 15 job listings and 2 featured slots per month. Scale is unlimited listings, unlimited featuring, candidate search access, and API access.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. For Flutterwave payments we never store card details — everything is PCI-compliant. Bank transfers are manual so no card data is involved at all.",
  },
];

// ── Plan feature lists ────────────────────────────────────────────────────────

const FREE_FEATURES = [
  { text: 'Up to 3 active job listings',  included: true  },
  { text: 'Basic applicant management',   included: true  },
  { text: 'Standard listing placement',   included: true  },
  { text: 'Email notifications',          included: true  },
  { text: 'Public company profile',       included: true  },
  { text: 'Featured listings',            included: false },
  { text: 'Candidate search database',    included: false },
  { text: 'Analytics dashboard',          included: false },
  { text: 'Actively Hiring badge',        included: false },
  { text: 'Priority support',             included: false },
];

const GROWTH_FEATURES = [
  { text: '15 active job listings',        included: true  },
  { text: '2 featured listings per month', included: true  },
  { text: 'Full applicant management',     included: true  },
  { text: 'Kanban pipeline board',         included: true  },
  { text: 'Analytics dashboard',           included: true  },
  { text: 'Actively Hiring badge',         included: true  },
  { text: 'Priority email support',        included: true  },
  { text: 'Export applicants (CSV)',        included: true  },
  { text: 'Unlimited listings',            included: false },
  { text: 'Candidate database access',     included: false },
];

const SCALE_FEATURES = [
  { text: 'Unlimited job listings',          included: true },
  { text: 'Unlimited featured listings',     included: true },
  { text: 'Candidate database search',       included: true },
  { text: 'Advanced analytics & reports',    included: true },
  { text: 'Branded company page',            included: true },
  { text: 'Verified Employer badge',         included: true },
  { text: 'Dedicated account manager',       included: true },
  { text: 'API access',                      included: true },
  { text: 'White-label job widget',          included: true },
  { text: 'Priority homepage placement',     included: true },
];

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({
  name,
  description,
  usd,
  ngn,
  rate,
  period,
  badge,
  accent,
  features,
  cta,
  isActive,
  isFree,
  onSelect,
  subtext,
}: {
  name: string;
  description: string;
  usd: number;
  ngn: number;
  rate: number;
  period: string;
  badge?: string;
  accent: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
  isActive: boolean;
  isFree: boolean;
  onSelect: () => void;
  subtext?: string;
}) {
  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-2xl flex flex-col ${
      accent ? 'border-2 border-primary-500 shadow-xl' : 'border border-gray-200 dark:border-gray-700'
    }`}>
      {badge && (
        <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs px-4 py-1 rounded-full font-semibold whitespace-nowrap ${
          accent ? 'bg-primary-600 text-white' : 'bg-purple-600 text-white'
        }`}>
          {badge}
        </span>
      )}

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{name}</h2>
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

        <button
          onClick={onSelect}
          disabled={isFree || isActive}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
            isFree || isActive
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-default'
              : accent
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isActive ? '✓ Active Plan' : cta}
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployerPremium() {
  const { user } = useAuth();
  const router = useRouter();
  const { isNigeria } = useNigeria();

  // settings starts as null (loading); falls back to FALLBACK_SETTINGS on error
  // so the Upgrade button always opens the modal regardless of Firestore rules.
  const [settings, setSettings]     = useState<AdminPaymentSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [modalPlan, setModalPlan]   = useState<PaymentPlan | null>(null);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');
  const [openFaq, setOpenFaq]       = useState<number | null>(null);

  useEffect(() => {
    setSettingsLoading(true);
    PaymentService.getAdminSettings()
      .then((s) => setSettings(s))
      .catch(() => {
        // Firestore read failed (e.g. missing rule or no internet).
        // Use hardcoded fallback so the Upgrade button still works.
        setSettings(FALLBACK_SETTINGS);
      })
      .finally(() => setSettingsLoading(false));
  }, []);

  // Resolved settings: while loading use fallback so prices render immediately.
  const resolvedSettings = settings ?? FALLBACK_SETTINGS;

  const isPremium =
    user?.employerTier === 'employer-growth' || user?.employerTier === 'employer-scale' ||
    (user?.tier as string) === 'employer-growth' || (user?.tier as string) === 'employer-scale';

  const rate      = resolvedSettings.ngnPerUSD;
  const growthUSD = resolvedSettings.employerGrowthUSD;
  const scaleUSD  = resolvedSettings.employerScaleUSD;
  const growthNGN = Math.round(growthUSD * rate);
  const scaleNGN  = Math.round(scaleUSD  * rate);

  const handleSelect = (plan: PaymentPlan) => {
    if (!user) { router.push('/login'); return; }
    setError('');
    setModalPlan(plan);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/20 rounded-full font-semibold mb-5 tracking-wide">
            <FiZap size={12} /> JoblifyHQ Employer
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Hire faster. Hire better.</h1>
          <p className="text-primary-100 text-lg max-w-xl mx-auto leading-relaxed">
            Post jobs, get featured, and manage applicants with tools built for African employers.
          </p>
          {/* Geo notice */}
          <div className="mt-6 inline-flex items-center gap-2 text-xs bg-white/10 px-4 py-2 rounded-full">
            {isNigeria
              ? '🇳🇬 Nigerian employers — bank transfer available at checkout'
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
              <p className="font-semibold text-primary-800 dark:text-primary-200">You&apos;re on a Premium employer plan!</p>
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5 capitalize">
                Active plan: {(user?.employerTier === 'employer-scale' || (user?.tier as string) === 'employer-scale') ? 'Scale' : 'Growth'}
              </p>
            </div>
            <button
              onClick={() => router.push('/employer')}
              className="ml-auto text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* Rate info bar — shown once settings are resolved */}
        {!isPremium && !settingsLoading && (
          <div className="mb-8 flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
            <FiInfo size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              Prices in USD. Naira equivalent shown at reference rate{' '}
              <strong>1 USD = ₦{rate.toLocaleString()}</strong>.{' '}
              {isNigeria
                ? 'Nigerian employers can pay via bank transfer at checkout.'
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
          <PlanCard
            name="Free"
            description="Post jobs and find talent across Africa."
            usd={0}
            ngn={0}
            rate={rate}
            period="forever"
            accent={false}
            features={FREE_FEATURES}
            cta="Current Plan"
            isActive={!isPremium}
            isFree
            onSelect={() => {}}
          />

          <PlanCard
            name="Growth"
            description="For growing teams who want more visibility and pipeline tools."
            usd={growthUSD}
            ngn={growthNGN}
            rate={rate}
            period="per month"
            badge="Most Popular"
            accent
            features={GROWTH_FEATURES}
            cta="Upgrade to Growth"
            isActive={user?.employerTier === 'employer-growth' || (user?.tier as string) === 'employer-growth'}
            isFree={false}
            onSelect={() => handleSelect('employer-growth')}
          />

          <PlanCard
            name="Scale"
            description="Best for companies hiring at scale across multiple countries."
            usd={scaleUSD}
            ngn={scaleNGN}
            rate={rate}
            period="per month"
            badge="Best Value"
            accent={false}
            features={SCALE_FEATURES}
            cta="Upgrade to Scale"
            isActive={user?.employerTier === 'employer-scale' || (user?.tier as string) === 'employer-scale'}
            isFree={false}
            onSelect={() => handleSelect('employer-scale')}
          />
        </div>

        {/* Perks */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Everything employers get
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-10">
            Tools built to fill roles faster across Africa
          </p>
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                >
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{faq.q}</span>
                  <span className="text-gray-400 flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
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

      {/* Payment modal — opens as long as user is logged in and a plan is selected.
          Uses resolvedSettings (never null) so it always renders correctly. */}
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
