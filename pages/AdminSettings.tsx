'use client';
// pages/AdminPlatformSettings.tsx
// ─── Admin Platform Settings ──────────────────────────────────────────────────
// Tabs: Feature Flags | General | Pricing | Payment Methods | Withdrawals | Moderators

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/context/AuthContext';
import { PlatformService } from '@/src/services/providers/firebase/platform';
import { PaymentService } from '@/src/services/providers/firebase/payment';
import { usePlatform } from '@/context/PlatformContext';
import type { PlatformSettings, PlatformFeatureFlags, ModeratorPermission } from '@/types';
import type { AdminPaymentSettings } from '@/src/services/providers/firebase/payment';
import type { WithdrawalRequest } from '@/types';
import { FiCheckCircle, FiXCircle, FiRefreshCw, FiClock } from 'react-icons/fi';

// ── Feature flag labels ───────────────────────────────────────────────────────

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

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function formatDate(ts: { seconds: number } | undefined): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminPlatformSettings() {
  const { user }               = useAuth();
  const { refresh }            = usePlatform();
  const [tab, setTab]          = useState<'features' | 'general' | 'pricing' | 'payments' | 'withdrawals' | 'moderators'>('features');
  const [platform, setPlatform] = useState<PlatformSettings | null>(null);
  const [payment, setPayment]  = useState<AdminPaymentSettings | null>(null);
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
      setTimeout(() => setSaved(''), 2500);
    } finally { setSaving(false); }
  };

  const savePayment = async () => {
    if (!payment) return;
    setSaving(true);
    try {
      await PaymentService.saveAdminSettings(payment);
      setSaved('Payment settings saved!');
      setTimeout(() => setSaved(''), 2500);
    } finally { setSaving(false); }
  };

  const toggleFeature = (key: keyof PlatformFeatureFlags, val: boolean) => {
    if (!platform) return;
    setPlatform(p => p ? { ...p, features: { ...p.features, [key]: val } } : p);
  };

  const setPay      = (k: keyof AdminPaymentSettings, v: unknown) => setPayment(p => p ? { ...p, [k]: v } : p);
  const setPlatSet  = (k: keyof PlatformSettings, v: unknown)     => setPlatform(p => p ? { ...p, [k]: v } : p);

  const inp = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const lbl = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

  if (!user || user.role !== 'admin') return <div className="p-8 text-center text-gray-500">Unauthorized</div>;
  if (!platform || !payment)          return <div className="p-8 text-center text-gray-400">Loading…</div>;

  const tabs = [
    { key: 'features',     label: '🔌 Feature Flags' },
    { key: 'general',      label: '⚙️ General' },
    { key: 'pricing',      label: '💰 Pricing' },
    { key: 'payments',     label: '🏦 Payment Methods' },
    { key: 'withdrawals',  label: '💸 Withdrawals' },
    { key: 'moderators',   label: '👮 Moderators' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
          <p className="text-sm text-gray-500">Control all features, pricing, payment methods, and withdrawals.</p>
        </div>

        {saved && (
          <div className="mb-4 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg px-4 py-3 text-sm font-medium">
            {saved}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-1 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                tab === t.key
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Feature Flags ── */}
        {tab === 'features' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Feature Flags</h2>
            <div className="space-y-3">
              {(Object.keys(FEATURE_LABELS) as (keyof PlatformFeatureFlags)[]).map(key => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{FEATURE_LABELS[key]}</p>
                    <p className="text-xs text-gray-500">{key}</p>
                  </div>
                  <Toggle on={platform.features[key]} onToggle={() => toggleFeature(key, !platform.features[key])} />
                </div>
              ))}
            </div>
            <button onClick={savePlatform} disabled={saving} className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Feature Flags'}
            </button>
          </div>
        )}

        {/* ── General ── */}
        {tab === 'general' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">General Settings</h2>
            <div>
              <label className={lbl}>Site Name</label>
              <input className={inp} value={platform.siteName} onChange={e => setPlatSet('siteName', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Site Tagline</label>
              <input className={inp} value={platform.siteTagline} onChange={e => setPlatSet('siteTagline', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Escrow Fee (%)</label>
                <input type="number" className={inp} value={platform.escrowFeePercent} onChange={e => setPlatSet('escrowFeePercent', parseFloat(e.target.value))} min={0} max={20} step={0.5} />
              </div>
              <div>
                <label className={lbl}>Featured Job Duration (days)</label>
                <input type="number" className={inp} value={platform.featuredJobDays} onChange={e => setPlatSet('featuredJobDays', parseInt(e.target.value))} min={1} max={90} />
              </div>
            </div>
            {([
              { key: 'maintenanceMode',       label: '🔧 Maintenance Mode',       desc: 'Temporarily disable site access' },
              { key: 'allowNewRegistrations', label: '👤 Allow Registrations',    desc: 'Let new users sign up' },
              { key: 'requireJobApproval',    label: '📋 Require Job Approval',   desc: 'Jobs must be reviewed before going live' },
              { key: 'requireGigApproval',    label: '🎯 Require Gig Approval',   desc: 'Gigs must be reviewed before going live' },
            ] as { key: keyof PlatformSettings; label: string; desc: string }[]).map(({ key, label: lbl2, desc }) => (
              <div key={key as string} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{lbl2}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <Toggle on={platform[key] as boolean} onToggle={() => setPlatSet(key, !(platform[key] as boolean))} />
              </div>
            ))}
            <button onClick={savePlatform} disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save General Settings'}
            </button>
          </div>
        )}

        {/* ── Pricing ── */}
        {tab === 'pricing' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">Subscription & Feature Pricing (USD)</h2>
            <div className="grid grid-cols-2 gap-4">
              {([
                { key: 'premiumMonthlyUSD',   label: 'Job Seeker Premium (monthly)' },
                { key: 'premiumAnnualUSD',    label: 'Job Seeker Premium (annual)' },
                { key: 'employerGrowthUSD',   label: 'Employer Growth (monthly)' },
                { key: 'employerScaleUSD',    label: 'Employer Scale (monthly)' },
                { key: 'freelancerProUSD',    label: 'Freelancer Pro (monthly)' },
                { key: 'boostUSD',            label: 'Profile Boost' },
                { key: 'featuredJobUSD',      label: 'Featured Job Listing' },
                { key: 'featuredGigUSD',      label: 'Featured Gig Listing' },
                { key: 'scholarshipBoostUSD', label: 'Scholarship Boost' },
                { key: 'escrowFeePercent',    label: 'Escrow Fee (%)' },
                { key: 'ngnPerUSD',           label: 'NGN per USD (FX rate)' },
                { key: 'usdtPerUSD',          label: 'USDT/USDC per USD (≈1)' },
              ] as { key: keyof AdminPaymentSettings; label: string }[]).map(({ key, label: lbl2 }) => (
                <div key={key as string}>
                  <label className={lbl}>{lbl2}</label>
                  <input
                    type="number" className={inp}
                    value={payment[key] as number}
                    onChange={e => setPay(key, parseFloat(e.target.value))}
                    min={0} step={0.5}
                  />
                </div>
              ))}
            </div>
            <button onClick={savePayment} disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Pricing'}
            </button>
          </div>
        )}

        {/* ── Payment Methods ── */}
        {tab === 'payments' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <h2 className="font-semibold text-gray-900 dark:text-white">Payment Methods</h2>
            <p className="text-xs text-gray-500">Toggle each method on/off. Changes take effect immediately after saving.</p>

            {/* Nigerian bank transfer */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">🇳🇬 Nigerian Bank Transfer</h3>
                  <p className="text-xs text-gray-500">Nigerian users paying in Naira</p>
                </div>
                <Toggle on={payment.bankTransferEnabled} onToggle={() => setPay('bankTransferEnabled', !payment.bankTransferEnabled)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lbl}>Bank Name</label>      <input className={inp} value={payment.bankName}      onChange={e => setPay('bankName', e.target.value)} /></div>
                <div><label className={lbl}>Account Name</label>   <input className={inp} value={payment.accountName}   onChange={e => setPay('accountName', e.target.value)} /></div>
                <div><label className={lbl}>Account Number</label> <input className={inp} value={payment.accountNumber} onChange={e => setPay('accountNumber', e.target.value)} /></div>
              </div>
            </div>

            {/* Flutterwave */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">💳 Flutterwave</h3>
                  <p className="text-xs text-gray-500">Card / mobile money — outside Nigeria</p>
                </div>
                <Toggle on={payment.flutterwaveEnabled} onToggle={() => setPay('flutterwaveEnabled', !payment.flutterwaveEnabled)} />
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 rounded p-2">
                Configure via <code className="font-mono">NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY</code> env variable.
              </p>
            </div>

            {/* PayPal */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">🅿️ PayPal</h3>
                  <p className="text-xs text-gray-500">Outside Nigeria — USD payments</p>
                </div>
                <Toggle on={payment.paypalEnabled} onToggle={() => setPay('paypalEnabled', !payment.paypalEnabled)} />
              </div>
              <div>
                <label className={lbl}>PayPal Email (users will send money here)</label>
                <input className={inp} type="email" value={payment.paypalEmail} placeholder="payments@yourcompany.com" onChange={e => setPay('paypalEmail', e.target.value)} />
              </div>
            </div>

            {/* Crypto — Ethereum */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">🔷 Crypto — Ethereum Network (USDT / USDC)</h3>
                  <p className="text-xs text-gray-500">ERC-20 USDT and USDC — all countries</p>
                </div>
                <Toggle on={payment.cryptoEthEnabled} onToggle={() => setPay('cryptoEthEnabled', !payment.cryptoEthEnabled)} />
              </div>
              <div>
                <label className={lbl}>ETH Wallet Address (ERC-20)</label>
                <input className={inp} value={payment.cryptoWalletEth} placeholder="0x..." onChange={e => setPay('cryptoWalletEth', e.target.value)} />
              </div>
            </div>

            {/* Crypto — BNB Chain */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">🟡 Crypto — BNB Chain (USDT / USDC)</h3>
                  <p className="text-xs text-gray-500">BEP-20 USDT and USDC — all countries</p>
                </div>
                <Toggle on={payment.cryptoBnbEnabled} onToggle={() => setPay('cryptoBnbEnabled', !payment.cryptoBnbEnabled)} />
              </div>
              <div>
                <label className={lbl}>BNB Wallet Address (BEP-20)</label>
                <input className={inp} value={payment.cryptoWalletBnb} placeholder="0x..." onChange={e => setPay('cryptoWalletBnb', e.target.value)} />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-xs text-blue-700 dark:text-blue-300">
              <strong>Routing logic:</strong> Nigeria → Bank transfer + Crypto. Outside Nigeria → Flutterwave + PayPal + Crypto.
              All manual/crypto/PayPal payments require admin confirmation before the user&apos;s plan is activated.
            </div>

            <button onClick={savePayment} disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Payment Settings'}
            </button>
          </div>
        )}

        {/* ── Withdrawals ── */}
        {tab === 'withdrawals' && (
          <WithdrawalsPanel adminUid={user.uid} />
        )}

        {/* ── Moderators ── */}
        {tab === 'moderators' && (
          <ModeratorManager adminUid={user.uid} />
        )}
      </div>
    </div>
  );
}

// ── Withdrawals Panel ─────────────────────────────────────────────────────────

function WithdrawalsPanel({ adminUid }: { adminUid: string }) {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'pending' | 'all'>('pending');
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteMap, setNoteMap]   = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const data = await PaymentService.getWithdrawalRequests(filter === 'pending' ? 'pending' : undefined);
    setRequests(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const process = async (id: string, status: 'paid' | 'rejected') => {
    const label = status === 'paid' ? 'Mark as PAID' : 'REJECT';
    if (!window.confirm(`${label} this withdrawal request?`)) return;
    setActionId(id);
    try {
      await PaymentService.processWithdrawal({
        withdrawalId:    id,
        adminUid,
        status,
        adminNote:       noteMap[id] || undefined,
        rejectionReason: status === 'rejected' ? (noteMap[id] || 'Rejected by admin') : undefined,
      });
      await load();
    } finally { setActionId(null); }
  };

  const METHOD_ICON: Record<string, string> = {
    bank_transfer: '🏦',
    paypal:        '🅿️',
    crypto_usdt:   '🔷',
    crypto_usdc:   '🔵',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(['pending', 'all'] as const).map(f => (
            <button
              key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'pending' ? '⏳ Pending' : '📋 All'}
            </button>
          ))}
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiClock size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No {filter === 'pending' ? 'pending ' : ''}withdrawal requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.freelancerName}</p>
                  <p className="text-xs text-gray-400">{r.freelancerEmail} · {r.freelancerCountry}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900 dark:text-white">${r.amountUSD.toFixed(2)}</p>
                  {r.amountNGN && <p className="text-xs text-gray-400">≈ ₦{r.amountNGN.toLocaleString()}</p>}
                </div>
              </div>

              {/* Payout details */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px] mb-2">
                  {METHOD_ICON[r.method.replace(/_usdt|_usdc/, '')] || '💰'} Payout Method: {r.method.replace(/_/g, ' ')}
                </p>
                {r.bankName       && <p>Bank: <strong>{r.bankName}</strong></p>}
                {r.accountName    && <p>Account Name: <strong>{r.accountName}</strong></p>}
                {r.accountNumber  && <p>Account No: <strong>{r.accountNumber}</strong></p>}
                {r.paypalEmail    && <p>PayPal: <strong>{r.paypalEmail}</strong></p>}
                {r.cryptoAddress  && <p>Wallet: <strong className="font-mono break-all">{r.cryptoAddress}</strong></p>}
                {r.cryptoNetwork  && <p>Network: <strong>{r.cryptoNetwork === 'bnb' ? 'BNB Chain' : 'Ethereum'}</strong></p>}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Requested: {formatDate(r.requestedAt as { seconds: number })}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[r.status] || ''}`}>{r.status}</span>
              </div>

              {r.status === 'pending' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={noteMap[r.id] || ''}
                    onChange={e => setNoteMap(m => ({ ...m, [r.id]: e.target.value }))}
                    placeholder="Add a note or rejection reason (optional)"
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs bg-white dark:bg-gray-800 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => process(r.id, 'paid')}
                      disabled={actionId === r.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      {actionId === r.id
                        ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <FiCheckCircle size={13} />}
                      Mark as Paid
                    </button>
                    <button
                      onClick={() => process(r.id, 'rejected')}
                      disabled={actionId === r.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 text-xs font-semibold transition disabled:opacity-50 border border-red-200 dark:border-red-800"
                    >
                      <FiXCircle size={13} /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Moderator Manager (unchanged) ─────────────────────────────────────────────

const ALL_PERMISSIONS: ModeratorPermission[] = [
  'review_jobs', 'review_gigs', 'review_employers', 'manage_reports',
  'manage_disputes', 'review_kyc', 'manage_blog', 'manage_scholarships', 'ban_users',
];

const PERM_LABELS: Record<ModeratorPermission, string> = {
  review_jobs:         'Review Jobs',
  review_gigs:         'Review Gigs',
  review_employers:    'Review Employers',
  manage_reports:      'Manage Reports',
  manage_disputes:     'Manage Disputes',
  review_kyc:          'Review KYC',
  manage_blog:         'Manage Blog',
  manage_scholarships: 'Manage Scholarships',
  ban_users:           'Ban Users',
};

function ModeratorManager({ adminUid }: { adminUid: string }) {
  const [users, setUsers]   = useState<any[]>([]);
  const [mods, setMods]     = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState('');

  useEffect(() => { loadMods(); }, []);

  const loadMods = async () => {
    const q    = query(collection(db, 'users'), where('role', '==', 'moderator'));
    const snap = await getDocs(q);
    setMods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const searchUsers = async () => {
    if (!search.trim()) return;
    const q    = query(collection(db, 'users'), where('email', '==', search.trim().toLowerCase()));
    const snap = await getDocs(q);
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const promote = async (userId: string) => {
    setSaving(userId);
    await updateDoc(doc(db, 'users', userId), { role: 'moderator', moderatorPermissions: [], updatedAt: new Date() });
    await loadMods(); setUsers([]); setSearch(''); setSaving('');
  };

  const updatePerms = async (modId: string, perms: ModeratorPermission[]) => {
    setSaving(modId);
    await updateDoc(doc(db, 'users', modId), { moderatorPermissions: perms });
    await loadMods(); setSaving('');
  };

  const demote = async (modId: string) => {
    await updateDoc(doc(db, 'users', modId), { role: 'user', moderatorPermissions: [] });
    await loadMods();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Promote User to Moderator</h3>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email…"
            className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white" />
          <button onClick={searchUsers} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Search</button>
        </div>
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
              <p className="text-xs text-gray-500">{u.email} · {u.role}</p>
            </div>
            <button onClick={() => promote(u.id)} disabled={saving === u.id || u.role === 'moderator'}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
              {u.role === 'moderator' ? 'Already Mod' : 'Make Moderator'}
            </button>
          </div>
        ))}
      </div>

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
                const has = (mod.moderatorPermissions || []).includes(perm);
                return (
                  <label key={perm} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={has} onChange={e => {
                      const cur = mod.moderatorPermissions || [];
                      updatePerms(mod.id, e.target.checked ? [...cur, perm] : cur.filter((p: string) => p !== perm));
                    }} className="rounded" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{PERM_LABELS[perm]}</span>
                  </label>
                );
              })}
            </div>
            {saving === mod.id && <p className="text-xs text-blue-600 mt-2">Saving…</p>}
          </div>
        ))}
        {mods.length === 0 && <p className="text-sm text-gray-500">No moderators yet.</p>}
      </div>
    </div>
  );
}
