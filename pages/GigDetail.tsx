'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GigsService } from '@/src/services/providers/firebase/gigs';
import { EscrowService } from '@/src/services/providers/firebase/escrow';
import { PaymentService } from '@/src/services/providers/firebase/payment';
import type { Gig, Proposal } from '@/types';
import type { AdminPaymentSettings } from '@/src/services/providers/firebase/payment';

export default function GigDetail({ gigId }: { gigId: string }) {
  const { user }            = useAuth();
  const router              = useRouter();
  const [gig, setGig]       = useState<Gig | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [settings, setSettings]   = useState<AdminPaymentSettings | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showPropose, setShowPropose] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]   = useState('');
  const [msg, setMsg]       = useState('');

  const [form, setForm] = useState({ coverLetter: '', bidAmount: '', deliveryDays: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const isClient     = user?.uid === gig?.clientId;
  const isFreelancer = user?.role === 'freelancer';
  const isAdmin      = user?.role === 'admin';

  useEffect(() => {
    Promise.all([
      GigsService.getGigById(gigId),
      PaymentService.getAdminSettings(),
    ]).then(([g, s]) => {
      setGig(g); setSettings(s);
      if (g && (user?.uid === g.clientId || user?.role === 'admin')) {
        GigsService.getProposalsForGig(gigId).then(setProposals);
      }
    }).finally(() => setLoading(false));
  }, [gigId, user]);

  const submitProposal = async () => {
    if (!user || !gig) return;
    if (!form.coverLetter || !form.bidAmount || !form.deliveryDays) {
      setError('Please fill in all fields.'); return;
    }
    setSubmitting(true); setError('');
    try {
      await GigsService.submitProposal({
        gigId, freelancerId: user.uid,
        freelancerName: user.name || user.displayName || 'Freelancer',
        freelancerPhoto: user.photoURL || undefined,
        freelancerTier: (user as any).freelancerTier || 'free',
        coverLetter: form.coverLetter,
        bidAmount: parseFloat(form.bidAmount),
        currency: gig.currency,
        deliveryDays: parseInt(form.deliveryDays),
      });
      setMsg('Proposal submitted! The client will review and get back to you.');
      setShowPropose(false);
      setForm({ coverLetter: '', bidAmount: '', deliveryDays: '' });
    } catch (e: any) {
      setError(e.message || 'Failed to submit proposal.');
    } finally { setSubmitting(false); }
  };

  const acceptProposal = async (proposal: Proposal) => {
    if (!user || !gig || !settings) return;
    setSubmitting(true);
    try {
      await GigsService.acceptProposal(proposal.id, gigId, proposal.freelancerId);
      const escrowId = await EscrowService.createEscrow({
        gigId, gigTitle: gig.title,
        clientId: gig.clientId, clientName: gig.clientName,
        freelancerId: proposal.freelancerId, freelancerName: proposal.freelancerName,
        proposalId: proposal.id,
        amount: proposal.bidAmount, currency: proposal.currency,
        platformFeePercent: settings.escrowFeePercent,
        paymentMethod: 'bank_transfer',
      });
      setMsg('Proposal accepted! Escrow has been created.');
      router.push(`/escrow/${escrowId}`);
    } catch { setError('Failed to accept proposal.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!gig) return <div className="min-h-screen flex items-center justify-center text-gray-500">Gig not found.</div>;

  const budgetStr = gig.currency === 'NGN'
    ? `₦${gig.budgetMin.toLocaleString()} – ₦${gig.budgetMax.toLocaleString()}`
    : `$${gig.budgetMin} – $${gig.budgetMax}`;

  const statusColors: Record<string, string> = {
    open:        'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed:   'bg-purple-100 text-purple-700',
    cancelled:   'bg-gray-100 text-gray-500',
    disputed:    'bg-red-100 text-red-700',
    pending_review: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 flex items-center gap-1">
          ← Back to Gigs
        </button>

        {(msg || error) && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${msg ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {msg || error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{gig.title}</h1>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[gig.status] || 'bg-gray-100 text-gray-600'}`}>
                  {gig.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-5">
                <span>📍 {gig.country}</span>
                {gig.isRemote && <span>🌍 Remote</span>}
                <span>⏱ {gig.duration}</span>
                <span>📁 {gig.category}</span>
                {gig.deadline && <span>📅 Deadline: {gig.deadline}</span>}
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none mb-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{gig.description}</p>
              </div>

              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {gig.skills.map(s => (
                    <span key={s} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                <strong>🔒 Escrow Protected:</strong> Payment is held securely until you approve the work. No risk for client or freelancer.
              </div>
            </div>

            {/* Proposals — visible to client and admin */}
            {(isClient || isAdmin) && proposals.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Proposals ({proposals.length})</h2>
                <div className="space-y-4">
                  {proposals.map(p => (
                    <div key={p.id} className={`border rounded-xl p-4 ${p.status === 'accepted' ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {p.freelancerPhoto
                            ? <img src={p.freelancerPhoto} alt="" className="w-8 h-8 rounded-full object-cover" />
                            : <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{p.freelancerName[0]}</div>
                          }
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{p.freelancerName}</p>
                            {p.freelancerTier === 'freelancer-pro' && <span className="text-xs text-blue-600 font-medium">⭐ Pro</span>}
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          p.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{p.coverLetter}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-sm">
                          <span className="font-bold text-green-600">{p.currency === 'NGN' ? '₦' : '$'}{p.bidAmount.toLocaleString()}</span>
                          <span className="text-gray-500">⏱ {p.deliveryDays} days</span>
                        </div>
                        {isClient && gig.status === 'open' && p.status === 'pending' && (
                          <button onClick={() => acceptProposal(p)} disabled={submitting}
                            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                            Accept & Create Escrow
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Budget */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs text-gray-500 uppercase mb-1">Budget</p>
              <p className="text-2xl font-bold text-green-600">{budgetStr}</p>
              <p className="text-xs text-gray-500 mt-1">{gig.currency}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between mb-1"><span>Proposals</span><span className="font-medium text-gray-900 dark:text-white">{gig.proposalCount || 0}</span></div>
                <div className="flex justify-between"><span>Duration</span><span className="font-medium text-gray-900 dark:text-white">{gig.duration}</span></div>
              </div>
            </div>

            {/* Client info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs text-gray-500 uppercase mb-3">Posted By</p>
              <div className="flex items-center gap-3">
                {gig.clientPhoto
                  ? <img src={gig.clientPhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{gig.clientName[0]}</div>
                }
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{gig.clientName}</p>
                  {gig.clientVerified && <span className="text-xs text-blue-600 font-medium">✓ Verified Employer</span>}
                </div>
              </div>
            </div>

            {/* Submit proposal CTA */}
            {isFreelancer && gig.status === 'open' && !isClient && (
              <div>
                {!showPropose ? (
                  <button onClick={() => setShowPropose(true)}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition">
                    Submit a Proposal
                  </button>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Your Proposal</h3>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cover Letter *</label>
                      <textarea value={form.coverLetter} onChange={e => set('coverLetter', e.target.value)}
                        rows={5} placeholder="Explain why you're the best fit. Mention relevant experience and how you'll approach this gig..."
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Bid ({gig.currency})</label>
                        <input type="number" value={form.bidAmount} onChange={e => set('bidAmount', e.target.value)}
                          placeholder={`${gig.budgetMin}–${gig.budgetMax}`}
                          className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Delivery (days)</label>
                        <input type="number" value={form.deliveryDays} onChange={e => set('deliveryDays', e.target.value)}
                          placeholder="e.g. 7"
                          className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white" />
                      </div>
                    </div>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <button onClick={submitProposal} disabled={submitting}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                      {submitting ? 'Submitting...' : 'Submit Proposal'}
                    </button>
                    <button onClick={() => setShowPropose(false)} className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
                  </div>
                )}
              </div>
            )}

            {/* Non-freelancer prompt */}
            {!user && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-center">
                <p className="text-blue-800 dark:text-blue-300 mb-3">Sign up as a freelancer to submit proposals</p>
                <button onClick={() => router.push('/register')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Sign Up Free</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
