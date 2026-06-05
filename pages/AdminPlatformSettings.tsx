'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PlatformService } from '@/src/services/providers/firebase/platform';
import { PaymentService } from '@/src/services/providers/firebase/payment';
import { usePlatform } from '@/context/PlatformContext';
import type { PlatformSettings, PlatformFeatureFlags } from '@/types';
import type { AdminPaymentSettings } from '@/src/services/providers/firebase/payment';

const FEATURE_LABELS: Record<keyof PlatformFeatureFlags, string> = {
  freelanceEnabled:     'Freelance Marketplace',
  escrowEnabled:        'Escrow Payment System',
  scholarshipsEnabled:  'Scholarships',
  blogEnabled:          'Blog / Articles',
  salaryPortalEnabled:  'Salary Intelligence',
  skillBadgesEnabled:   'Skill Verification Badges',
  resumeBuilderEnabled: 'Resume Builder',
  aiMatchingEnabled:    'AI Job Matching',
  servicesEnabled:      'Local Services',
  kycEnabled:           'Employer KYC Verification',
  referralsEnabled:     'Referral System',
};

export default function AdminPlatformSettings() {
  const { user }               = useAuth();
  const { refresh }            = usePlatform();
  const [tab, setTab]          = useState<'features' | 'general' | 'pricing' | 'payments' | 'moderators'>('features');
  const [platform, setPlatform] = useState<PlatformSettings | null>(null);
  const [payment, setPayment]  = useState<AdminPaymentSettings | null>(null);
  const [mods, setMods]        = useState<any[]>([]);
  const [saving, setSaving]    = useState(false);
  const [saved, setSaved]      = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    Promise.all([
      PlatformService.getSettings(),
      PaymentService.getAdminSettings(),
    ]).then(([p, pay]) => { setPlatform(p); setPayment(pay); });
  }, [user]);

  const savePlatform = async () => {
    if (!platform || !user) return;
    setSaving(true);
    try {
      await PlatformService.saveSettings(platform, user.uid);
      await refresh();
      setSaved('Platform settings saved!');
      setTimeout(() => setSaved(''), 2000);
    } finally { setSaving(false); }
  };

  const savePayment = async () => {
    if (!payment) return;
    setSaving(true);
    try {
      await PaymentService.saveAdminSettings(payment);
      setSaved('Payment settings saved!');
      setTimeout(() => setSaved(''), 2000);
    } finally { setSaving(false); }
  };

  const toggleFeature = (key: keyof PlatformFeatureFlags, val: boolean) => {
    if (!platform) return;
    setPlatform(p => p ? { ...p, features: { ...p.features, [key]: val } } : p);
  };

  const setPay = (k: keyof AdminPaymentSettings, v: any) => setPayment(p => p ? { ...p, [k]: v } : p);
  const setPlatSet = (k: keyof PlatformSettings, v: any) => setPlatform(p => p ? { ...p, [k]: v } : p);

  const inp = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const label = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  if (!user || user.role !== 'admin') return <div className="p-8 text-center text-gray-500">Unauthorized</div>;
  if (!platform || !payment) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
          <p className="text-sm text-gray-500">Control all features, pricing, and payment methods from here.</p>
        </div>

        {saved && <div className="mb-4 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg px-4 py-3 text-sm font-medium">{saved}</div>}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-1 flex-wrap">
          {[
            { key: 'features',   label: '🔌 Feature Flags' },
            { key: 'general',    label: '⚙️ General' },
            { key: 'pricing',    label: '💰 Pricing' },
            { key: 'payments',   label: '🏦 Payment Methods' },
            { key: 'moderators', label: '👮 Moderators' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${tab === t.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Feature Flags */}
        {tab === 'features' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Feature Flags — Toggle to enable/disable platform features</h2>
            <div className="space-y-3">
              {(Object.keys(FEATURE_LABELS) as (keyof PlatformFeatureFlags)[]).map(key => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{FEATURE_LABELS[key]}</p>
                    <p className="text-xs text-gray-500">{key}</p>
                  </div>
                  <button
                    onClick={() => toggleFeature(key, !platform.features[key])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${platform.features[key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${platform.features[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={savePlatform} disabled={saving} className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Feature Flags'}
            </button>
          </div>
        )}

        {/* General Settings */}
        {tab === 'general' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">General Platform Settings</h2>
            <div>
              <label className={label}>Site Name</label>
              <input className={inp} value={platform.siteName} onChange={e => setPlatSet('siteName', e.target.value)} />
            </div>
            <div>
              <label className={label}>Site Tagline</label>
              <input className={inp} value={platform.siteTagline} onChange={e => setPlatSet('siteTagline', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Escrow Fee (%)</label>
                <input type="number" className={inp} value={platform.escrowFeePercent} onChange={e => setPlatSet('escrowFeePercent', parseFloat(e.target.value))} min={0} max={20} step={0.5} />
              </div>
              <div>
                <label className={label}>Featured Job Duration (days)</label>
                <input type="number" className={inp} value={platform.featuredJobDays} onChange={e => setPlatSet('featuredJobDays', parseInt(e.target.value))} min={1} max={90} />
              </div>
            </div>
            <div className="space-y-3">
              {([
                { key: 'maintenanceMode',       label: '🔧 Maintenance Mode', desc: 'Temporarily disable site access' },
                { key: 'allowNewRegistrations', label: '👤 Allow Registrations', desc: 'Let new users sign up' },
                { key: 'requireJobApproval',    label: '📋 Require Job Approval', desc: 'Jobs must be reviewed before going live' },
                { key: 'requireGigApproval',    label: '🎯 Require Gig Approval', desc: 'Gigs must be reviewed before going live' },
              ] as { key: keyof PlatformSettings; label: string; desc: string }[]).map(({ key, label: lbl, desc }) => (
                <div key={key as string} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{lbl}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <button onClick={() => setPlatSet(key, !(platform[key] as boolean))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${platform[key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${platform[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={savePlatform} disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save General Settings'}
            </button>
          </div>
        )}

        {/* Pricing */}
        {tab === 'pricing' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">Subscription & Feature Pricing (USD)</h2>
            <div className="grid grid-cols-2 gap-4">
              {([
                { key: 'premiumMonthlyUSD',  label: 'Job Seeker Premium (monthly)' },
                { key: 'premiumAnnualUSD',   label: 'Job Seeker Premium (annual)' },
                { key: 'employerGrowthUSD',  label: 'Employer Growth (monthly)' },
                { key: 'employerScaleUSD',   label: 'Employer Scale (monthly)' },
                { key: 'freelancerProUSD',   label: 'Freelancer Pro (monthly)' },
                { key: 'boostUSD',           label: 'Profile Boost' },
                { key: 'featuredJobUSD',     label: 'Featured Job Listing' },
                { key: 'featuredGigUSD',     label: 'Featured Gig Listing' },
                { key: 'scholarshipBoostUSD',label: 'Scholarship Boost' },
                { key: 'escrowFeePercent',   label: 'Escrow Fee (%)' },
                { key: 'ngnPerUSD',          label: 'NGN per USD (FX rate)' },
              ] as { key: keyof AdminPaymentSettings; label: string }[]).map(({ key, label: lbl }) => (
                <div key={key as string}>
                  <label className={label}>{lbl}</label>
                  <input type="number" className={inp} value={payment[key] as number} onChange={e => setPay(key, parseFloat(e.target.value))} min={0} step={0.5} />
                </div>
              ))}
            </div>
            <button onClick={savePayment} disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Pricing'}
            </button>
          </div>
        )}

        {/* Payment Methods */}
        {tab === 'payments' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <h2 className="font-semibold text-gray-900 dark:text-white">Payment Methods</h2>

            {/* Bank Transfer — Nigeria */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">🇳🇬 Bank Transfer (Nigeria)</h3>
                  <p className="text-xs text-gray-500">For Nigerian users paying in Naira</p>
                </div>
                <button onClick={() => setPay('bankTransferEnabled', !payment.bankTransferEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${payment.bankTransferEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${payment.bankTransferEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={label}>Bank Name</label><input className={inp} value={payment.bankName} onChange={e => setPay('bankName', e.target.value)} /></div>
                <div><label className={label}>Account Name</label><input className={inp} value={payment.accountName} onChange={e => setPay('accountName', e.target.value)} /></div>
                <div><label className={label}>Account Number</label><input className={inp} value={payment.accountNumber} onChange={e => setPay('accountNumber', e.target.value)} /></div>
              </div>
            </div>

            {/* Paystack */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Paystack</h3>
                  <p className="text-xs text-gray-500">Best for Nigerian cards and bank payments</p>
                </div>
                <button onClick={() => setPay('paystackEnabled', !payment.paystackEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${payment.paystackEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${payment.paystackEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700 rounded p-2">Configure via <code className="font-mono">NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY</code> env variable</p>
            </div>

            {/* Flutterwave */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Flutterwave</h3>
                  <p className="text-xs text-gray-500">Best for all African countries outside Nigeria</p>
                </div>
                <button onClick={() => setPay('flutterwaveEnabled', !payment.flutterwaveEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${payment.flutterwaveEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${payment.flutterwaveEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700 rounded p-2">Configure via <code className="font-mono">NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY</code> env variable</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-xs text-blue-700 dark:text-blue-300">
              <strong>Payment Logic:</strong> Nigerian users → Bank Transfer + Paystack. Other African countries → Flutterwave or Paystack. Escrow payments always go through a gateway for security.
            </div>

            <button onClick={savePayment} disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Payment Settings'}
            </button>
          </div>
        )}

        {/* Moderators */}
        {tab === 'moderators' && (
          <ModeratorManager adminUid={user.uid} />
        )}
      </div>
    </div>
  );
}

import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { ModeratorPermission } from '@/types';

const ALL_PERMISSIONS: ModeratorPermission[] = [
  'review_jobs','review_gigs','review_employers','manage_reports',
  'manage_disputes','review_kyc','manage_blog','manage_scholarships','ban_users',
];

function ModeratorManager({ adminUid }: { adminUid: string }) {
  const [users, setUsers]       = useState<any[]>([]);
  const [mods, setMods]         = useState<any[]>([]);
  const [search, setSearch]     = useState('');
  const [saving, setSaving]     = useState('');

  useEffect(() => { loadMods(); }, []);

  const loadMods = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'moderator'));
    const snap = await getDocs(q);
    setMods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const searchUsers = async () => {
    if (!search.trim()) return;
    const q = query(collection(db, 'users'), where('email', '==', search.trim().toLowerCase()));
    const snap = await getDocs(q);
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const promoteToModerator = async (userId: string) => {
    setSaving(userId);
    await updateDoc(doc(db, 'users', userId), { role: 'moderator', moderatorPermissions: [], updatedAt: new Date() });
    await loadMods(); setUsers([]); setSearch('');
    setSaving('');
  };

  const updatePermissions = async (modId: string, perms: ModeratorPermission[]) => {
    setSaving(modId);
    await updateDoc(doc(db, 'users', modId), { moderatorPermissions: perms });
    await loadMods();
    setSaving('');
  };

  const demote = async (modId: string) => {
    await updateDoc(doc(db, 'users', modId), { role: 'user', moderatorPermissions: [] });
    await loadMods();
  };

  return (
    <div className="space-y-6">
      {/* Search to promote */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Promote User to Moderator</h3>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email..."
            className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white" />
          <button onClick={searchUsers} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Search</button>
        </div>
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
              <p className="text-xs text-gray-500">{u.email} · {u.role}</p>
            </div>
            <button onClick={() => promoteToModerator(u.id)} disabled={saving === u.id || u.role === 'moderator'}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
              {u.role === 'moderator' ? 'Already Mod' : 'Make Moderator'}
            </button>
          </div>
        ))}
      </div>

      {/* Current moderators */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Current Moderators ({mods.length})</h3>
        {mods.map(mod => (
          <div key={mod.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{mod.name}</p>
                <p className="text-xs text-gray-500">{mod.email}</p>
              </div>
              <button onClick={() => demote(mod.id)} className="text-xs text-red-600 hover:underline">Demote</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ALL_PERMISSIONS.map(perm => {
                const hasPerm = (mod.moderatorPermissions || []).includes(perm);
                return (
                  <label key={perm} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={hasPerm} onChange={e => {
                      const current = mod.moderatorPermissions || [];
                      const updated = e.target.checked ? [...current, perm] : current.filter((p: string) => p !== perm);
                      updatePermissions(mod.id, updated);
                    }} className="rounded" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{PERM_LABELS[perm]}</span>
                  </label>
                );
              })}
            </div>
            {saving === mod.id && <p className="text-xs text-blue-600 mt-2">Saving...</p>}
          </div>
        ))}
        {mods.length === 0 && <p className="text-sm text-gray-500">No moderators yet.</p>}
      </div>
    </div>
  );
}

const PERM_LABELS: Record<ModeratorPermission, string> = {
  review_jobs:      'Review Jobs',
  review_gigs:      'Review Gigs',
  review_employers: 'Review Employers',
  manage_reports:   'Manage Reports',
  manage_disputes:  'Manage Disputes',
  review_kyc:       'Review KYC',
  manage_blog:      'Manage Blog',
  manage_scholarships: 'Manage Scholarships',
  ban_users:        'Ban Users',
};
