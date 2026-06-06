'use client';
// pages/FreelancerDashboard.tsx
// Tabs: overview | proposals | earnings | withdrawals | badges

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GigsService } from '@/src/services/providers/firebase/gigs';
import { EscrowService } from '@/src/services/providers/firebase/escrow';
import { FreelancerService } from '@/src/services/providers/firebase/freelancer';
import { PaymentService } from '@/src/services/payment';
import type { Proposal, EscrowTransaction, SkillBadge, WithdrawalRequest, FreelancerPayoutDetails } from '@/types';
import type { AdminPaymentSettings } from '@/src/services/providers/firebase/payment';
import {
  FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo,
} from 'react-icons/fi';

// ── Status helpers ─────────────────────────────────────────────────────────────

const W_STATUS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function formatDate(ts: { seconds: number } | undefined): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FreelancerDashboard() {
  const { user }    = useAuth();
  const router      = useRouter();
  const isNigeria   = (user?.country || '').toLowerCase() === 'nigeria';

  type Tab = 'overview' | 'proposals' | 'earnings' | 'withdrawals' | 'badges';
  const [tab, setTab]             = useState<Tab>('overview');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [escrows, setEscrows]     = useState<EscrowTransaction[]>([]);
  const [badges, setBadges]       = useState<SkillBadge[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      GigsService.getFreelancerProposals(user.uid),
      EscrowService.getFreelancerEscrows(user.uid),
      FreelancerService.getUserBadges(user.uid),
    ]).then(([p, e, b]) => {
      setProposals(p); setEscrows(e); setBadges(b);
    }).finally(() => setLoading(false));
  }, [user]);

  const totalEarned = escrows.filter(e => e.status === 'released').reduce((s, e) => s + e.freelancerAmount, 0);
  const inEscrow    = escrows.filter(e => ['funded', 'in_progress', 'submitted'].includes(e.status)).reduce((s, e) => s + e.freelancerAmount, 0);
  const activeCount = proposals.filter(p => p.status === 'accepted').length;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview',     label: 'Overview' },
    { key: 'proposals',    label: 'Proposals' },
    { key: 'earnings',     label: 'Earnings' },
    { key: 'withdrawals',  label: '💸 Withdrawals' },
    { key: 'badges',       label: 'Skill Badges' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Freelancer Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back, {user?.name?.split(' ')[0]}</p>
          </div>
          <button onClick={() => router.push('/gigs')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Browse Gigs
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Earned',    value: `$${totalEarned.toFixed(0)}`, color: 'text-green-600' },
            { label: 'In Escrow',       value: `$${inEscrow.toFixed(0)}`,    color: 'text-yellow-600' },
            { label: 'Active Gigs',     value: activeCount,                  color: 'text-blue-600' },
            { label: 'Verified Skills', value: badges.filter(b => b.status === 'verified').length, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-1 flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                tab === t.key
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Recent Proposals</h3>
                  {proposals.slice(0, 4).length === 0
                    ? <p className="text-sm text-gray-500">No proposals yet. <button onClick={() => router.push('/gigs')} className="text-blue-600 hover:underline">Browse gigs</button></p>
                    : proposals.slice(0, 4).map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{p.gigId.slice(0, 12)}…</p>
                          <p className="text-xs text-gray-500">${p.bidAmount} · {p.deliveryDays}d</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                      </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Skill Badges</h3>
                  {badges.length === 0
                    ? <div>
                        <p className="text-sm text-gray-500 mb-3">No skill badges yet. Get verified to stand out.</p>
                        <button onClick={() => setTab('badges')} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Request Badge</button>
                      </div>
                    : <div className="flex flex-wrap gap-2">
                        {badges.map(b => (
                          <span key={b.id} className={`text-xs px-3 py-1 rounded-full font-medium ${
                            b.status === 'verified' ? 'bg-green-100 text-green-700' :
                            b.status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'}`}>
                            {b.status === 'verified' ? '✓' : '⏳'} {b.skill}
                          </span>
                        ))}
                      </div>
                  }
                </div>

                {/* Payout reminder if no details */}
                <div className="md:col-span-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-5">
                  <h3 className="font-semibold mb-1">Set up your payout details</h3>
                  <p className="text-sm text-blue-100 mb-3">
                    {isNigeria
                      ? 'Add your Nigerian bank account so admin can release your earnings directly to you.'
                      : 'Add your PayPal or crypto wallet so admin can pay you when you request a withdrawal.'}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => router.push('/settings')} className="bg-white text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50">
                      Add Payout Details
                    </button>
                    <button onClick={() => setTab('withdrawals')} className="border border-white text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10">
                      Request Withdrawal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'proposals' && (
              <div className="space-y-3">
                {proposals.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-4xl mb-3">📬</p>
                    <p className="text-gray-500">No proposals yet.</p>
                    <button onClick={() => router.push('/gigs')} className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700">Browse Gigs</button>
                  </div>
                ) : proposals.map(p => (
                  <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Gig: {p.gigId.slice(0, 16)}…</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{p.coverLetter}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        <span>Bid: <strong className="text-gray-900 dark:text-white">${p.bidAmount}</strong></span>
                        <span>Delivery: <strong>{p.deliveryDays} days</strong></span>
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                      p.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      p.status === 'withdrawn' ? 'bg-gray-100 text-gray-600' :
                      'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'earnings' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-green-600 font-medium mb-1">Total Released</p>
                    <p className="text-xl font-bold text-green-700">${totalEarned.toFixed(2)}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-yellow-600 font-medium mb-1">In Escrow</p>
                    <p className="text-xl font-bold text-yellow-700">${inEscrow.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-blue-600 font-medium mb-1">Total Gigs</p>
                    <p className="text-xl font-bold text-blue-700">{escrows.length}</p>
                  </div>
                </div>
                {escrows.length === 0
                  ? <p className="text-center text-gray-400 py-8">No earnings yet.</p>
                  : escrows.map(e => (
                    <div key={e.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{e.gigTitle}</p>
                        <p className="text-xs text-gray-500">Client: {e.clientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">${e.freelancerAmount}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          e.status === 'released' ? 'bg-green-100 text-green-700' :
                          e.status === 'disputed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'}`}>{e.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {tab === 'withdrawals' && user && (
              <WithdrawalsTab user={user} isNigeria={isNigeria} totalEarned={totalEarned} />
            )}

            {tab === 'badges' && (
              <BadgesTab userId={user?.uid || ''} badges={badges} setBadges={setBadges} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Withdrawals Tab ───────────────────────────────────────────────────────────

function WithdrawalsTab({
  user, isNigeria, totalEarned,
}: {
  user: any; isNigeria: boolean; totalEarned: number;
}) {
  const router = useRouter();
  const [history, setHistory]       = useState<WithdrawalRequest[]>([]);
  const [payout, setPayout]         = useState<FreelancerPayoutDetails | null>(null);
  const [settings, setSettings]     = useState<AdminPaymentSettings | null>(null);
  const [loading, setLoading]       = useState(true);
  const [amount, setAmount]         = useState('');
  const [method, setMethod]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [hist, pd, s] = await Promise.all([
      PaymentService.getFreelancerWithdrawals(user.uid),
      PaymentService.getPayoutDetails(user.uid),
      PaymentService.getAdminSettings(),
    ]);
    setHistory(hist); setPayout(pd); setSettings(s);
    setLoading(false);
  }, [user.uid]);

  useEffect(() => { load(); }, [load]);

  const hasPayout = payout && (
    (isNigeria && payout.bankName && payout.accountNumber) ||
    (!isNigeria && (payout.paypalEmail || payout.cryptoAddress))
  );

  // Build available methods from saved payout details
  type MethodOption = { id: string; label: string };
  const methodOptions: MethodOption[] = [];
  if (payout) {
    if (isNigeria && payout.bankName)     methodOptions.push({ id: 'bank_transfer', label: `🏦 Bank Transfer — ${payout.bankName}` });
    if (!isNigeria && payout.paypalEmail) methodOptions.push({ id: 'paypal',        label: `🅿️ PayPal — ${payout.paypalEmail}` });
    if (!isNigeria && payout.cryptoAddress) {
      const net = payout.cryptoNetwork === 'bnb' ? 'BNB Chain' : 'Ethereum';
      methodOptions.push({ id: 'crypto_usdt', label: `🔷 USDT (${net}) — ${payout.cryptoAddress.slice(0, 10)}…` });
      methodOptions.push({ id: 'crypto_usdc', label: `🔵 USDC (${net}) — ${payout.cryptoAddress.slice(0, 10)}…` });
    }
  }

  const submit = async () => {
    setError(''); setSuccess('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0)  { setError('Enter a valid amount.'); return; }
    if (amt > totalEarned) { setError(`You only have $${totalEarned.toFixed(2)} in released earnings.`); return; }
    if (!method)           { setError('Select a payout method.'); return; }
    if (!payout || !settings) return;

    setSubmitting(true);
    try {
      await PaymentService.requestWithdrawal({
        freelancer:    user,
        amountUSD:     amt,
        method:        method as any,
        payoutDetails: payout,
        settings,
      });
      setSuccess('Withdrawal request submitted! Admin will process it and notify you.');
      setAmount(''); setMethod('');
      await load();
    } catch (err) {
      console.error(err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* No payout details set up yet */}
      {!hasPayout && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5 flex items-start gap-3">
          <FiAlertCircle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">Payout details required</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
              You need to add your {isNigeria ? 'Nigerian bank account' : 'PayPal email or crypto wallet'} before requesting a withdrawal.
            </p>
            <button
              onClick={() => router.push('/settings')}
              className="mt-3 text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Go to Settings → Payout Details
            </button>
          </div>
        </div>
      )}

      {/* Request form */}
      {hasPayout && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Request Withdrawal</h3>

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
            <FiInfo size={13} className="mt-0.5 shrink-0" />
            Available balance: <strong className="ml-1">${totalEarned.toFixed(2)}</strong>
            {isNigeria && settings && (
              <> · ≈ <strong>₦{(totalEarned * settings.ngnPerUSD).toLocaleString()}</strong></>
            )}
          </div>

          {error   && <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400"><FiAlertCircle size={14} className="mt-0.5 shrink-0" />{error}</div>}
          {success && <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400"><FiCheckCircle size={14} className="mt-0.5 shrink-0" />{success}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number" min="1" step="0.01"
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {amount && settings && isNigeria && (
              <p className="mt-1 text-xs text-gray-400">
                ≈ ₦{(parseFloat(amount || '0') * settings.ngnPerUSD).toLocaleString()} at today&apos;s rate
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Payout Method
            </label>
            <div className="space-y-2">
              {methodOptions.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${
                    method === m.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Withdrawals are processed manually by admin — usually within 1–2 business days.</p>
            <p>• You will receive a notification when your payment is sent.</p>
            <p>• Minimum withdrawal: $5 USD.</p>
          </div>

          <button
            onClick={submit} disabled={submitting || !method || !amount}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition"
          >
            {submitting
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</span>
              : 'Submit Withdrawal Request'}
          </button>
        </div>
      )}

      {/* History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Withdrawal History</h3>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FiClock size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No withdrawal requests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${r.amountUSD.toFixed(2)}
                    {r.amountNGN && <span className="text-xs text-gray-400 ml-1">· ≈₦{r.amountNGN.toLocaleString()}</span>}
                  </p>
                  <p className="text-xs text-gray-400">{r.method.replace(/_/g, ' ')} · {formatDate(r.requestedAt as { seconds: number })}</p>
                  {r.adminNote && <p className="text-xs text-gray-500 italic mt-0.5">"{r.adminNote}"</p>}
                  {r.rejectionReason && <p className="text-xs text-red-500 mt-0.5">Reason: {r.rejectionReason}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'paid'     && <FiCheckCircle size={14} className="text-green-500" />}
                  {r.status === 'rejected' && <FiXCircle     size={14} className="text-red-500" />}
                  {r.status === 'pending'  && <FiClock       size={14} className="text-yellow-500" />}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${W_STATUS[r.status] || ''}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Badges Tab (unchanged) ────────────────────────────────────────────────────

function BadgesTab({ userId, badges, setBadges }: { userId: string; badges: SkillBadge[]; setBadges: (b: SkillBadge[]) => void }) {
  const [skill, setSkill]           = useState('');
  const [category, setCategory]     = useState('');
  const [evidence, setEvidence]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]               = useState('');

  const submit = async () => {
    if (!skill || !category) { setMsg('Please fill in skill and category.'); return; }
    setSubmitting(true);
    try {
      await FreelancerService.requestBadge({ userId, skill, category, evidence: evidence || undefined });
      setMsg('Badge request submitted! A moderator will review it shortly.');
      setSkill(''); setCategory(''); setEvidence('');
      const updated = await FreelancerService.getUserBadges(userId);
      setBadges(updated);
    } catch { setMsg('Failed to submit. Try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Request Skill Badge</h3>
        {msg && <div className="mb-3 text-sm text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded">{msg}</div>}
        <div className="space-y-3">
          <input value={skill} onChange={e => setSkill(e.target.value)} placeholder="Skill name (e.g. React.js)"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white" />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white">
            <option value="">Category</option>
            {['Engineering', 'Design', 'Marketing', 'Finance', 'Writing', 'Data', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="Link to portfolio/certificate (optional)"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white" />
          <button onClick={submit} disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Request Badge'}
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">My Badges</h3>
        {badges.length === 0
          ? <p className="text-sm text-gray-500">No badges yet.</p>
          : <div className="space-y-2">
              {badges.map(b => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{b.skill}</p>
                    <p className="text-xs text-gray-500">{b.category}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    b.status === 'verified' ? 'bg-green-100 text-green-700' :
                    b.status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'}`}>
                    {b.status === 'verified' ? '✓ Verified' : b.status}
                  </span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
