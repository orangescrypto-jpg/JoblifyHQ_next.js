'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EscrowService } from '@/src/services/providers/firebase/escrow';
import { PaymentService } from '@/src/services/providers/firebase/payment';
import type { EscrowTransaction } from '@/types';
import type { AdminPaymentSettings } from '@/src/services/providers/firebase/payment';

const STATUS_STEPS: Record<string, number> = {
  pending_funding: 0, funded: 1, in_progress: 2,
  submitted: 3, approved: 4, released: 5,
};

const STEP_LABELS = ['Awaiting Payment', 'Funded', 'In Progress', 'Work Submitted', 'Approved', 'Funds Released'];

export default function EscrowDetail({ escrowId }: { escrowId: string }) {
  const { user }      = useAuth();
  const [escrow, setEscrow]     = useState<EscrowTransaction | null>(null);
  const [settings, setSettings] = useState<AdminPaymentSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDispute, setShowDispute]     = useState(false);
  const [msg, setMsg]           = useState('');

  useEffect(() => {
    Promise.all([
      EscrowService.getEscrowById(escrowId),
      PaymentService.getAdminSettings(),
    ]).then(([e, s]) => { setEscrow(e); setSettings(s); }).finally(() => setLoading(false));
  }, [escrowId]);

  const isClient     = user?.uid === escrow?.clientId;
  const isFreelancer = user?.uid === escrow?.freelancerId;
  const isAdmin      = user?.role === 'admin';

  const act = async (fn: () => Promise<void>, successMsg: string) => {
    setActing(true);
    try { await fn(); setMsg(successMsg); const e = await EscrowService.getEscrowById(escrowId); setEscrow(e); }
    catch { setMsg('Action failed. Try again.'); }
    finally { setActing(false); }
  };

  const fundByBankTransfer = () => act(() => EscrowService.markFunded(escrowId, `BT_${Date.now()}`), 'Payment marked — awaiting admin confirmation.');
  const submitWork         = () => act(() => EscrowService.submitWork(escrowId), 'Work submitted for client review.');
  const approveWork        = () => act(() => EscrowService.approveWork(escrowId), 'Work approved! Awaiting fund release.');
  const releaseFunds       = () => act(() => EscrowService.releaseFunds(escrowId, user!.uid), 'Funds released to freelancer!');
  const refund             = () => act(() => EscrowService.refund(escrowId, user!.uid), 'Refund issued to client.');
  const raiseDispute       = () => act(async () => {
    await EscrowService.raiseDispute({
      escrowId, gigId: escrow!.gigId, gigTitle: escrow!.gigTitle,
      clientId: escrow!.clientId, clientName: escrow!.clientName,
      freelancerId: escrow!.freelancerId, freelancerName: escrow!.freelancerName,
      raisedBy: isClient ? 'client' : 'freelancer',
      reason: disputeReason,
    });
  }, 'Dispute raised. A moderator will review shortly.');

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!escrow) return <div className="p-8 text-center text-gray-500">Escrow not found.</div>;

  const step = STATUS_STEPS[escrow.status] ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Escrow #{escrow.id.slice(0,8)}</h1>
          <p className="text-sm text-gray-500">{escrow.gigTitle}</p>
        </div>

        {msg && <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg px-4 py-3 text-sm">{msg}</div>}

        {/* Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            {STEP_LABELS.map((lbl, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-400'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <p className="text-xs text-center text-gray-500 hidden md:block leading-tight">{lbl}</p>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
            <div className="h-1.5 bg-blue-600 rounded-full transition-all" style={{ width: `${(step / 5) * 100}%` }} />
          </div>
          <p className="text-center text-sm font-medium text-blue-600 mt-2 capitalize">{escrow.status.replace(/_/g,' ')}</p>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Escrow Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium text-gray-900 dark:text-white">{escrow.clientName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Freelancer</span><span className="font-medium text-gray-900 dark:text-white">{escrow.freelancerName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Amount</span><span className="font-bold text-gray-900 dark:text-white">${escrow.amount} {escrow.currency}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Platform Fee ({escrow.platformFeePercent}%)</span><span className="text-gray-700 dark:text-gray-300">-${escrow.platformFee}</span></div>
            <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
              <span className="text-gray-500">Freelancer Gets</span><span className="font-bold text-green-600">${escrow.freelancerAmount}</span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Payment Method</span><span className="capitalize text-gray-700 dark:text-gray-300">{escrow.paymentMethod.replace('_',' ')}</span></div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Actions</h3>

          {/* Client: fund if pending */}
          {isClient && escrow.status === 'pending_funding' && settings && (
            <div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                <strong>🏦 Payment Instructions (Nigeria):</strong>
                <p className="mt-1">Transfer <strong>₦{(escrow.amount * settings.ngnPerUSD).toLocaleString()}</strong> to:</p>
                <p className="mt-1 font-mono text-xs bg-yellow-100 dark:bg-yellow-900/40 rounded p-2">
                  Bank: {settings.bankName}<br/>
                  Account: {settings.accountName}<br/>
                  Number: {settings.accountNumber}
                </p>
                <p className="text-xs mt-2 opacity-75">Include reference: <strong className="font-mono">{escrow.id.slice(0,8)}</strong></p>
              </div>
              <button onClick={fundByBankTransfer} disabled={acting}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {acting ? 'Processing...' : 'I Have Made the Transfer'}
              </button>
            </div>
          )}

          {/* Freelancer: submit work */}
          {isFreelancer && escrow.status === 'funded' && (
            <button onClick={submitWork} disabled={acting}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {acting ? 'Submitting...' : 'Submit Work for Review'}
            </button>
          )}

          {/* Client: approve work */}
          {isClient && escrow.status === 'submitted' && (
            <div className="space-y-2">
              <button onClick={approveWork} disabled={acting}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {acting ? 'Approving...' : '✓ Approve Work & Release Funds'}
              </button>
              <button onClick={() => setShowDispute(true)} className="w-full border border-red-300 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50">
                Raise a Dispute
              </button>
            </div>
          )}

          {/* Admin: release / refund */}
          {isAdmin && escrow.status === 'approved' && (
            <div className="space-y-2">
              <button onClick={releaseFunds} disabled={acting}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                Release Funds to Freelancer
              </button>
              <button onClick={refund} disabled={acting}
                className="w-full bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                Refund to Client
              </button>
            </div>
          )}

          {/* Dispute form */}
          {showDispute && (
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2">Raise a Dispute</h4>
              <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
                placeholder="Explain the issue in detail. What went wrong? What do you expect?"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white resize-none mb-2" rows={4} />
              <div className="flex gap-2">
                <button onClick={raiseDispute} disabled={acting || !disputeReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {acting ? 'Submitting...' : 'Submit Dispute'}
                </button>
                <button onClick={() => setShowDispute(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          {['released','refunded','cancelled'].includes(escrow.status) && (
            <div className="text-center py-4">
              <p className="text-2xl mb-1">{escrow.status === 'released' ? '✅' : '↩️'}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {escrow.status === 'released' ? 'Funds successfully released to freelancer' :
                 escrow.status === 'refunded' ? 'Client has been refunded' : 'Cancelled'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
