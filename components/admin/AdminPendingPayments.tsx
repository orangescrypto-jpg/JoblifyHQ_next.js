'use client';
// components/admin/AdminPendingPayments.tsx
// ─── Admin Pending Payments Panel ────────────────────────────────────────────
// Shows all pending manual transfers. Admin can confirm or reject.
// Import and drop this into the Admin.tsx page as a new tab.

import { useState, useEffect, useCallback } from 'react';
import {
  FiCheckCircle, FiXCircle, FiRefreshCw, FiClock,
  FiUser, FiDollarSign,
} from 'react-icons/fi';
import {
  collection, query, where, getDocs, orderBy,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { PaymentService } from '@/src/services/payment';
import { useAuth } from '@/context/AuthContext';
import type { PendingPayment } from '@/src/services/payment';

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const METHOD_LABEL: Record<string, string> = {
  manual_transfer: '🏦 Bank Transfer',
  flutterwave:     '💳 Flutterwave',
};

function formatDate(ts: { seconds: number } | undefined): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdminPendingPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const col = collection(db, 'payments');
      const q = filter === 'pending'
        ? query(col, where('status', '==', 'pending'), orderBy('createdAt', 'desc'))
        : query(col, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingPayment)));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const confirm = async (p: PendingPayment) => {
    if (!user) return;
    if (!window.confirm(`Confirm payment from ${p.userEmail} for ${p.plan}?`)) return;
    setActionId(p.id);
    try {
      await PaymentService.confirmManualPayment({
        paymentId: p.id,
        adminUid:  user.uid,
        plan:      p.plan,
        userId:    p.userId,
      });
      await fetchPayments();
    } catch (err) {
      console.error(err);
      alert('Error confirming payment. Check console.');
    } finally {
      setActionId(null);
    }
  };

  const reject = async (p: PendingPayment) => {
    if (!window.confirm(`Reject / cancel payment from ${p.userEmail}?`)) return;
    setActionId(p.id);
    try {
      await PaymentService.cancelPayment(p.id);
      await fetchPayments();
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {(['pending', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'pending' ? '⏳ Pending' : '📋 All'}
            </button>
          ))}
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-7 h-7 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiClock size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No {filter === 'pending' ? 'pending ' : ''}payments found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FiUser size={14} className="text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-xs">{p.userName}</p>
                        <p className="text-gray-400 text-xs">{p.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {p.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <FiDollarSign size={12} />
                      <span className="font-semibold">${p.amountUSD}</span>
                      <span className="text-gray-400 text-xs">/ ₦{(p.amountNGN || 0).toLocaleString()}</span>
                    </div>
                    {p.note && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">"{p.note}"</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {METHOD_LABEL[p.method] || p.method}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {formatDate(p.createdAt as unknown as { seconds: number })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'pending' && p.method === 'manual_transfer' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirm(p)}
                          disabled={actionId === p.id}
                          title="Confirm payment"
                          className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 transition disabled:opacity-50"
                        >
                          {actionId === p.id
                            ? <span className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin block" />
                            : <FiCheckCircle size={15} />}
                        </button>
                        <button
                          onClick={() => reject(p)}
                          disabled={actionId === p.id}
                          title="Reject / cancel"
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 transition disabled:opacity-50"
                        >
                          <FiXCircle size={15} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {p.status === 'confirmed' ? '✓ Done' : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
