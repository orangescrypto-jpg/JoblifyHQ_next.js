'use client';
// pages/AdminSettings.tsx
// ─── Admin Payment Settings ───────────────────────────────────────────────────
// Lets admin change pricing and bank details without touching code.
// All changes persist to Firestore via PaymentService.saveAdminSettings().
// Route: /admin/settings

import { useState, useEffect } from 'react';
import {
  FiSave, FiDollarSign, FiCreditCard, FiRefreshCw,
  FiAlertCircle, FiCheckCircle, FiToggleLeft, FiToggleRight,
  FiInfo, FiStar,
} from 'react-icons/fi';
import { PaymentService } from '@/src/services/payment';
import type { AdminPaymentSettings } from '@/src/services/payment';
import { DEFAULT_SETTINGS } from '@/src/services/providers/firebase/payment';

// ── Helper ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
  prefix,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-mono">{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${prefix ? 'pl-8' : 'px-3'} pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const [form, setForm] = useState<AdminPaymentSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    PaymentService.getAdminSettings()
      .then(s => setForm(s))
      .catch(() => setError('Could not load settings from Firestore.'))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof AdminPaymentSettings>(key: K, value: AdminPaymentSettings[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await PaymentService.saveAdminSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to save settings. Check your Firestore permissions.');
    } finally {
      setSaving(false);
    }
  };

  // Live Naira previews
  const rate = Number(form.ngnPerUSD) || 1;
  const toNGN = (usd: number) => `₦${Math.round(usd * rate).toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiDollarSign className="text-primary-600" /> Payment Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Change pricing, bank details, and Flutterwave toggle — no code required.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <FiAlertCircle className="flex-shrink-0 mt-0.5" size={16} />
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2.5 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm">
          <FiCheckCircle size={16} /> Settings saved successfully!
        </div>
      )}

      {/* ── Section: Exchange Rate ─────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FiRefreshCw size={16} className="text-primary-500" /> Exchange Rate
        </h2>

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
          <FiInfo size={13} className="flex-shrink-0 mt-0.5" />
          This rate is displayed to users at checkout and used to calculate Naira amounts for manual transfers. Update it periodically to reflect market rates.
        </div>

        <Field label="NGN per USD (Reference Rate)" hint="e.g. 1470 means 1 USD = ₦1,470">
          <Input
            type="number"
            value={form.ngnPerUSD}
            onChange={v => set('ngnPerUSD', Number(v))}
            prefix="₦"
            placeholder="1470"
          />
        </Field>
      </section>

      {/* ── Section: Job Seeker Pricing ───────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FiDollarSign size={16} className="text-primary-500" /> Job Seeker Plans (USD)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Premium Monthly"
            hint={`Currently ≈ ${toNGN(Number(form.premiumMonthlyUSD))}`}
          >
            <Input
              type="number"
              value={form.premiumMonthlyUSD}
              onChange={v => set('premiumMonthlyUSD', Number(v))}
              prefix="$"
              placeholder="4"
            />
          </Field>

          <Field
            label="Premium Annual"
            hint={`Currently ≈ ${toNGN(Number(form.premiumAnnualUSD))}`}
          >
            <Input
              type="number"
              value={form.premiumAnnualUSD}
              onChange={v => set('premiumAnnualUSD', Number(v))}
              prefix="$"
              placeholder="40"
            />
          </Field>

          <Field
            label="Profile Boost"
            hint={`Currently ≈ ${toNGN(Number(form.boostUSD))}`}
          >
            <Input
              type="number"
              value={form.boostUSD}
              onChange={v => set('boostUSD', Number(v))}
              prefix="$"
              placeholder="3"
            />
          </Field>
        </div>
      </section>

      {/* ── Section: Employer Pricing ─────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FiCreditCard size={16} className="text-purple-500" /> Employer Plans (USD)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Employer Growth (Monthly)"
            hint={`Currently ≈ ${toNGN(Number(form.employerGrowthUSD))}`}
          >
            <Input
              type="number"
              value={form.employerGrowthUSD}
              onChange={v => set('employerGrowthUSD', Number(v))}
              prefix="$"
              placeholder="10"
            />
          </Field>

          <Field
            label="Employer Scale (Monthly)"
            hint={`Currently ≈ ${toNGN(Number(form.employerScaleUSD))}`}
          >
            <Input
              type="number"
              value={form.employerScaleUSD}
              onChange={v => set('employerScaleUSD', Number(v))}
              prefix="$"
              placeholder="25"
            />
          </Field>
        </div>
      </section>

      {/* ── Section: Featured & Boost Pricing ────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FiStar size={16} className="text-yellow-500" /> Featured & Boost Pricing (USD)
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          One-time fees charged to employers or admins to feature a job listing or boost a scholarship.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Featured Job Listing"
            hint={`Currently ≈ ${toNGN(Number(form.featuredJobUSD))} · one-time per listing`}
          >
            <Input
              type="number"
              value={form.featuredJobUSD ?? 5}
              onChange={v => set('featuredJobUSD', Number(v))}
              prefix="$"
              placeholder="5"
            />
          </Field>

          <Field
            label="Scholarship Boost"
            hint={`Currently ≈ ${toNGN(Number(form.scholarshipBoostUSD))} · one-time per listing`}
          >
            <Input
              type="number"
              value={form.scholarshipBoostUSD ?? 3}
              onChange={v => set('scholarshipBoostUSD', Number(v))}
              prefix="$"
              placeholder="3"
            />
          </Field>
        </div>
      </section>

      {/* ── Section: Bank Details (Nigeria) ───────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          🇳🇬 Nigerian Bank Details
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          These details are shown to Nigerian users at checkout for manual bank transfer.
        </p>

        <div className="space-y-4">
          <Field label="Bank Name">
            <Input
              value={form.bankName}
              onChange={v => set('bankName', v)}
              placeholder="e.g. Access Bank"
            />
          </Field>

          <Field label="Account Name">
            <Input
              value={form.accountName}
              onChange={v => set('accountName', v)}
              placeholder="e.g. JoblifyHQ Ltd"
            />
          </Field>

          <Field label="Account Number">
            <Input
              value={form.accountNumber}
              onChange={v => set('accountNumber', v)}
              placeholder="10-digit NUBAN"
            />
          </Field>

          <Field label="Bank Sort Code / Code (optional)">
            <Input
              value={form.bankCode ?? ''}
              onChange={v => set('bankCode', v)}
              placeholder="e.g. 044"
            />
          </Field>
        </div>
      </section>

      {/* ── Section: Flutterwave Toggle ───────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiCreditCard size={16} className="text-orange-500" /> Flutterwave (Non-NG users)
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              When enabled, users outside Nigeria can pay via card / mobile money. When disabled, all users see manual transfer only.
            </p>
          </div>
          <button
            onClick={() => set('flutterwaveEnabled', !form.flutterwaveEnabled)}
            className={`flex-shrink-0 transition ${form.flutterwaveEnabled ? 'text-primary-600' : 'text-gray-400'}`}
          >
            {form.flutterwaveEnabled
              ? <FiToggleRight size={36} />
              : <FiToggleLeft size={36} />}
          </button>
        </div>
        <p className={`mt-2 text-xs font-medium ${form.flutterwaveEnabled ? 'text-green-600' : 'text-gray-400'}`}>
          {form.flutterwaveEnabled ? '✓ Enabled — card / mobile money shown for non-NG users' : 'Disabled — all users see manual transfer'}
        </p>
      </section>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold text-sm transition"
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
            : <><FiSave size={16} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
