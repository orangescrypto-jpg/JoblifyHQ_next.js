'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FLUTTERWAVE_PUBLIC_KEY } from '@/config/payments';
import {
  FiCheck, FiZap, FiStar, FiShield, FiBell,
  FiEye, FiFileText, FiTrendingUp, FiX,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started exploring jobs and scholarships across Africa.',
    features: [
      { text: 'Browse all jobs & scholarships', included: true },
      { text: 'Save up to 5 jobs', included: true },
      { text: 'Apply to jobs', included: true },
      { text: '1 job alert', included: true },
      { text: 'Basic profile', included: true },
      { text: 'Profile boost in employer search', included: false },
      { text: 'See who viewed your profile', included: false },
      { text: 'Unlimited job alerts', included: false },
      { text: 'Application status tracking', included: false },
      { text: 'Featured applicant badge', included: false },
    ],
    cta: 'Current Free Plan',
    disabled: true,
    accent: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$4',
    period: 'per month',
    description: 'For active job seekers who want to stand out and move faster.',
    badge: 'Most Popular',
    localHint: '≈ ₦6,400 • KES 520 • GHS 62',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited saved jobs & scholarships', included: true },
      { text: 'Profile boost in employer search', included: true },
      { text: 'See who viewed your profile', included: true },
      { text: 'Unlimited job alerts', included: true },
      { text: 'Application status tracking', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Featured applicant badge', included: false },
      { text: 'Expert CV review (1×/year)', included: false },
    ],
    cta: 'Upgrade to Premium',
    disabled: false,
    accent: true,
  },
  {
    id: 'premium-annual',
    name: 'Annual',
    price: '$40',
    period: 'per year',
    subtext: 'equivalent to $3.33/mo',
    description: 'Best value for serious career builders. Save $8 vs monthly.',
    badge: 'Save $8',
    localHint: '≈ ₦64,000 • KES 5,200 • GHS 620',
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Featured applicant badge on applications', included: true },
      { text: 'Expert CV review (1×/year)', included: true },
      { text: 'Dedicated career tips newsletter', included: true },
      { text: 'Locked-in price guarantee', included: true },
      { text: 'Unlimited saved jobs & scholarships', included: true },
      { text: 'Profile boost in employer search', included: true },
      { text: 'See who viewed your profile', included: true },
      { text: 'Unlimited job alerts', included: true },
      { text: 'Application status tracking', included: true },
    ],
    cta: 'Get Annual Plan',
    disabled: false,
    accent: false,
  },
];

const PERKS = [
  { icon: FiTrendingUp, title: 'Profile Boost', desc: 'Your profile and applications rank higher when employers search for candidates on JoblifyHQ.' },
  { icon: FiBell, title: 'Unlimited Job Alerts', desc: 'Get notified the moment a job matching your skills and location is posted.' },
  { icon: FiEye, title: 'Profile Views', desc: 'See which employers and recruiters have visited your profile so you know who is interested.' },
  { icon: FiShield, title: 'Application Tracking', desc: 'Real-time status updates on every application — know exactly where you stand.' },
  { icon: FiFileText, title: 'Expert CV Review', desc: 'Annual plan includes one human expert CV review to help you craft a standout resume.' },
  { icon: FiStar, title: 'Featured Badge', desc: 'A Premium badge appears on all your applications, signalling seriousness to employers.' },
];

const FAQS = [
  { q: 'How do I pay?', a: 'Payment is processed securely via Flutterwave — cards, USSD, bank transfer, and mobile money all supported. Prices are in USD, Flutterwave auto-converts to your local currency.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel before your next billing date and your Premium access continues until the end of the period. No penalties.' },
  { q: 'What currency are prices in?', a: 'All prices are in US Dollars ($). Flutterwave will convert to NGN, KES, GHS, ZAR, etc. at checkout.' },
  { q: 'What is profile boost?', a: 'Your profile appears higher in employer search results and application lists on JoblifyHQ, increasing your chances of being noticed without extra effort.' },
  { q: 'What does the expert CV review include?', a: 'A career professional reviews your CV and gives written feedback on structure, keywords, ATS-compatibility, and presentation. Available once per year on the Annual plan.' },
  { q: 'Is my payment information safe?', a: 'Yes. We never store card details. All transactions go through PCI-compliant Flutterwave. Your personal data is secured on Firebase and never sold.' },
];

export default function Premium() {
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isPremium = user?.tier === 'premium' || user?.tier === 'premium-annual';

  const handleFlutterPayment = useFlutterwave({
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email: user?.email || '',
      name: user?.displayName || user?.name || 'Joblify User',
      phone_number: user?.phoneNumber || '',
    },
    customizations: {
      title: 'JoblifyHQ Premium',
      logo: 'https://joblifyhq.com/logo.png',
    },
  });

  const handleUpgrade = async (planId) => {
    if (!user) { router.push('/login'); return; }
    if (planId === 'free') return;
    if (isPremium && planId === user?.tier) return;

    setLoading(true);
    setLoadingPlan(planId);
    setError('');
    setSuccess('');

    const amount = planId === 'premium' ? 6400 : 64000;
    const days = planId === 'premium' ? 30 : 365;

    handleFlutterPayment({
      tx_ref: `joblify_${user.uid}_${Date.now()}`,
      amount: Number(amount),
      currency: 'NGN',
      description: planId === 'premium' ? 'Monthly Premium - ₦6,400' : 'Annual Premium - ₦64,000',
      callback: async (response) => {
        closePaymentModal();
        if (response.status === 'successful' || response.status === 'completed') {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              tier: planId,
              premiumSince: serverTimestamp(),
              premiumExpiresAt: Timestamp.fromDate(
                new Date(Date.now() + days * 24 * 60 * 60 * 1000)
              ),
              premiumPlan: planId,
              flwTransactionId: response.transaction_id,
              updatedAt: serverTimestamp(),
            });
            if (typeof updateUserProfile === 'function') {
              await updateUserProfile({ tier: planId });
            }
            setSuccess(
              planId === 'premium-annual'
                ? "You're now on the Annual Premium plan! Welcome to the top tier. 🎉"
                : "You're now a Premium member! Your profile boost is live. 🚀"
            );
            setTimeout(() => router.push('/dashboard'), 2000);
          } catch (err) {
            console.error(err);
            setError('Payment succeeded but update failed. Contact support.');
          }
        } else {
          setError('Payment was not completed. Please try again.');
        }
        setLoading(false);
        setLoadingPlan('');
      },
      onClose: () => {
        setLoading(false);
        setLoadingPlan('');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/20 rounded-full font-semibold mb-5 tracking-wide">
            <FiZap size={12} /> JoblifyHQ Premium
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Land your dream job faster</h1>
          <p className="text-primary-100 text-lg max-w-xl mx-auto leading-relaxed">
            Unlock tools that get you noticed by employers, keep you ahead of deadlines, and move your African career forward.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {success && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center">{success}</div>
        )}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">{error}</div>
        )}

        {isPremium && (
          <div className="mb-10 p-5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
              <FiStar size={20} />
            </div>
            <div>
              <p className="font-semibold text-primary-800 dark:text-primary-200">You're already a Premium member!</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan) => (
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
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/{plan.period}</span>
                  </div>
                  {plan.subtext && (
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">{plan.subtext}</p>
                  )}
                  {plan.localHint && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{plan.localHint}</p>
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
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={plan.disabled || loading || (isPremium && plan.id === user?.tier)}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                    plan.disabled || (isPremium && plan.id === user?.tier)
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default'
                      : plan.accent
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : isPremium && plan.id === user?.tier ? (
                    '✓ Active Plan'
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

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
    </div>
  );
}
