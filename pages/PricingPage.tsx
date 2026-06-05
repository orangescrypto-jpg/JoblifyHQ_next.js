'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PaymentService } from '@/src/services/providers/firebase/payment';
import type { AdminPaymentSettings } from '@/src/services/providers/firebase/payment';

export default function PricingPage() {
  const { user }               = useAuth();
  const router                 = useRouter();
  const [settings, setSettings] = useState<AdminPaymentSettings | null>(null);
  const [billing, setBilling]  = useState<'monthly' | 'annual'>('monthly');
  const [tab, setTab]          = useState<'jobseeker' | 'employer' | 'freelancer'>('jobseeker');

  useEffect(() => { PaymentService.getAdminSettings().then(setSettings); }, []);

  if (!settings) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const fmt = (n: number) => `$${n}`;
  const fmtNGN = (n: number) => `₦${(n * settings.ngnPerUSD).toLocaleString()}`;

  const isNigeria = (user as any)?.country === 'Nigeria' || !user;

  const plans = {
    jobseeker: [
      {
        name: 'Free',
        price: 0,
        color: 'from-gray-500 to-gray-600',
        features: [
          'Browse all jobs', 'Apply to 5 jobs/month', 'Basic profile',
          'Save up to 10 jobs', 'Email alerts',
        ],
        cta: 'Get Started Free',
        planKey: null,
      },
      {
        name: 'Premium',
        price: billing === 'monthly' ? settings.premiumMonthlyUSD : settings.premiumAnnualUSD,
        annualNote: billing === 'annual' ? '(billed annually)' : '',
        color: 'from-blue-600 to-blue-700',
        recommended: true,
        features: [
          'Unlimited applications',
          'Priority in employer search',
          'AI job matching',
          'Resume builder',
          'Direct message employers',
          'Application analytics',
          'Salary insights',
          'Early access to new jobs',
        ],
        cta: 'Go Premium',
        planKey: billing === 'monthly' ? 'premium' : 'premium-annual',
      },
    ],
    employer: [
      {
        name: 'Free',
        price: 0,
        color: 'from-gray-500 to-gray-600',
        features: [
          '2 active job listings', 'Basic company profile',
          'View applicants', 'Standard search ranking',
        ],
        cta: 'Post Jobs Free',
        planKey: null,
      },
      {
        name: 'Growth',
        price: settings.employerGrowthUSD,
        color: 'from-purple-600 to-purple-700',
        features: [
          '10 active job listings',
          '1 featured listing/month',
          'Employer verification badge',
          'Priority in search',
          'Application management',
          'Candidate filtering',
          'Analytics dashboard',
        ],
        cta: 'Start Hiring',
        planKey: 'employer-growth',
      },
      {
        name: 'Scale',
        price: settings.employerScaleUSD,
        color: 'from-indigo-600 to-indigo-700',
        recommended: true,
        features: [
          'Unlimited job listings',
          '3 featured listings/month',
          'Company showcase page',
          'AI candidate matching',
          'Bulk messaging',
          'ATS integration',
          'Dedicated support',
          'Team accounts (3 seats)',
        ],
        cta: 'Scale Your Hiring',
        planKey: 'employer-scale',
      },
    ],
    freelancer: [
      {
        name: 'Free',
        price: 0,
        color: 'from-gray-500 to-gray-600',
        features: [
          'Browse all gigs', 'Submit 3 proposals/month',
          'Basic profile', '10% platform fee on escrow',
        ],
        cta: 'Start Freelancing',
        planKey: null,
      },
      {
        name: 'Pro',
        price: settings.freelancerProUSD,
        color: 'from-green-600 to-green-700',
        recommended: true,
        features: [
          'Unlimited proposals',
          'Priority profile visibility',
          'Skill badge requests (unlimited)',
          'Portfolio showcase',
          'Reduced escrow fee (3%)',
          'Featured proposal badge',
          'Direct client messages',
          'Earnings analytics',
        ],
        cta: 'Go Freelancer Pro',
        planKey: 'freelancer-pro',
      },
    ],
  };

  const boostItems = [
    { label: 'Profile Boost', desc: '7 days top placement', price: settings.boostUSD },
    { label: 'Featured Job Listing', desc: `${settings.featuredJobDays} days featured`, price: settings.featuredJobUSD },
    { label: 'Featured Gig', desc: `${settings.featuredJobDays} days featured`, price: settings.featuredGigUSD },
    { label: 'Scholarship Boost', desc: '7 days top placement', price: settings.scholarshipBoostUSD },
  ];

  const goToPay = (planKey: string) => {
    if (!user) { router.push('/login'); return; }
    router.push(`/premium?plan=${planKey}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 to-purple-700 text-white py-16 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Simple, Transparent Pricing</h1>
        <p className="text-blue-200 max-w-xl mx-auto">Built for Africa. Pay in Naira (Nigeria) or USD. No hidden fees.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Tab: role */}
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 flex gap-1">
            {(['jobseeker','employer','freelancer'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                {t === 'jobseeker' ? 'Job Seeker' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Billing toggle (job seeker only) */}
        {tab === 'jobseeker' && (
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex items-center gap-2">
              <button onClick={() => setBilling('monthly')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${billing === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                Monthly
              </button>
              <button onClick={() => setBilling('annual')}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-md text-sm font-medium transition ${billing === 'annual' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                Annual <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className={`grid gap-6 mb-12 ${plans[tab].length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
          {plans[tab].map((plan: any) => (
            <div key={plan.name}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 overflow-hidden ${plan.recommended ? 'border-blue-500 shadow-xl shadow-blue-100 dark:shadow-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              {plan.recommended && (
                <div className="bg-blue-600 text-white text-xs font-bold text-center py-1.5 tracking-wide">MOST POPULAR</div>
              )}
              <div className={`bg-gradient-to-br ${plan.color} p-6 text-white`}>
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-bold">{plan.price === 0 ? 'Free' : fmt(plan.price)}</span>
                  {plan.price > 0 && <span className="text-sm opacity-75 mb-1">/mo</span>}
                </div>
                {plan.price > 0 && isNigeria && (
                  <p className="text-xs opacity-75 mt-1">{fmtNGN(plan.price)}/month</p>
                )}
                {plan.annualNote && <p className="text-xs opacity-75 mt-0.5">{plan.annualNote}</p>}
              </div>
              <div className="p-6">
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-green-500 font-bold mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => plan.planKey ? goToPay(plan.planKey) : router.push('/register')}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${plan.recommended ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Boost / one-time items */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-1">One-Time Boosts</h2>
          <p className="text-sm text-gray-500 mb-5">No subscription needed. Pay once, get visibility.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {boostItems.map(item => (
              <div key={item.label} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 text-center hover:border-blue-300 transition">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{item.label}</p>
                <p className="text-xs text-gray-500 mb-3">{item.desc}</p>
                <p className="text-xl font-bold text-blue-600">{fmt(item.price)}</p>
                {isNigeria && <p className="text-xs text-gray-500">{fmtNGN(item.price)}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Escrow fee */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6 mb-8">
          <h2 className="font-bold text-gray-900 dark:text-white mb-1">🔒 Escrow Fee</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            For freelance gigs, JoblifyHQ charges <strong>{settings.escrowFeePercent}%</strong> of the gig value as an escrow/platform fee.
            Freelancer Pro users pay only <strong>3%</strong>.
          </p>
          <p className="text-xs text-gray-500">
            Example: $200 gig → {settings.escrowFeePercent}% fee = ${(200 * settings.escrowFeePercent / 100).toFixed(0)} → Freelancer receives ${200 - (200 * settings.escrowFeePercent / 100)}.
          </p>
        </div>

        {/* Payment methods */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { flag: '🇳🇬', label: 'Nigeria', methods: 'Bank Transfer + Paystack', desc: 'Pay in Naira via direct bank transfer or Paystack (card, bank debit, USSD)' },
              { flag: '🌍', label: 'Rest of Africa', methods: 'Flutterwave', desc: 'Card, mobile money, bank transfers across Ghana, Kenya, South Africa and 30+ countries' },
              { flag: '💳', label: 'International', methods: 'Paystack / Flutterwave', desc: 'USD card payments accepted via Paystack or Flutterwave from anywhere' },
            ].map(m => (
              <div key={m.label} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-2xl mb-2">{m.flag}</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">{m.label}</p>
                <p className="text-xs font-medium text-blue-600 mb-1">{m.methods}</p>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
