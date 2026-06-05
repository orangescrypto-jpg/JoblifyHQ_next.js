'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GigsService } from '@/src/services/providers/firebase/gigs';
import { EscrowService } from '@/src/services/providers/firebase/escrow';
import { FreelancerService } from '@/src/services/providers/firebase/freelancer';
import type { Proposal, EscrowTransaction, SkillBadge } from '@/types';

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab]               = useState<'overview' | 'proposals' | 'earnings' | 'badges'>('overview');
  const [proposals, setProposals]   = useState<Proposal[]>([]);
  const [escrows, setEscrows]       = useState<EscrowTransaction[]>([]);
  const [badges, setBadges]         = useState<SkillBadge[]>([]);
  const [loading, setLoading]       = useState(true);

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
  const pending     = escrows.filter(e => ['funded','in_progress','submitted'].includes(e.status)).reduce((s, e) => s + e.freelancerAmount, 0);
  const activeCount = proposals.filter(p => p.status === 'accepted').length;

  const tabs = ['overview', 'proposals', 'earnings', 'badges'] as const;

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
            { label: 'Total Earned', value: `$${totalEarned.toFixed(0)}`, color: 'text-green-600' },
            { label: 'Pending Payout', value: `$${pending.toFixed(0)}`, color: 'text-yellow-600' },
            { label: 'Active Gigs', value: activeCount, color: 'text-blue-600' },
            { label: 'Verified Skills', value: badges.filter(b => b.status === 'verified').length, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Recent Proposals</h3>
                  {proposals.slice(0,4).length === 0
                    ? <p className="text-sm text-gray-500">No proposals yet. <button onClick={() => router.push('/gigs')} className="text-blue-600 hover:underline">Browse gigs</button></p>
                    : proposals.slice(0,4).map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{p.gigId.slice(0,12)}...</p>
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
                          <span key={b.id} className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${
                            b.status === 'verified' ? 'bg-green-100 text-green-700' :
                            b.status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'}`}>
                            {b.status === 'verified' ? '✓' : '⏳'} {b.skill}
                          </span>
                        ))}
                      </div>
                  }
                </div>
                <div className="md:col-span-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-5">
                  <h3 className="font-semibold mb-1">Complete your profile</h3>
                  <p className="text-sm text-blue-100 mb-3">Freelancers with portfolios and verified badges get 3× more proposals accepted.</p>
                  <div className="flex gap-3">
                    <button onClick={() => router.push('/freelancer/portfolio')} className="bg-white text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50">Add Portfolio</button>
                    <button onClick={() => router.push('/resume-builder')} className="border border-white text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10">Build Resume</button>
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
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Gig: {p.gigId.slice(0,16)}...</p>
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
                    <p className="text-xl font-bold text-yellow-700">${pending.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-blue-600 font-medium mb-1">Total Gigs</p>
                    <p className="text-xl font-bold text-blue-700">{escrows.length}</p>
                  </div>
                </div>
                {escrows.map(e => (
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
                        'bg-yellow-100 text-yellow-700'}`}>{e.status.replace('_',' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
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

function BadgesTab({ userId, badges, setBadges }: { userId: string; badges: SkillBadge[]; setBadges: (b: SkillBadge[]) => void }) {
  const [skill, setSkill]       = useState('');
  const [category, setCategory] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]           = useState('');

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
            {['Engineering','Design','Marketing','Finance','Writing','Data','Other'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="Link to portfolio/certificate (optional)"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white" />
          <button onClick={submit} disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Request Badge'}
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
