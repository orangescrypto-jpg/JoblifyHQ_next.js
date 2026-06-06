'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, orderBy, limit, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { EscrowService } from '@/src/services/providers/firebase/escrow';
import { PaymentService } from '@/src/services/providers/firebase/payment';
import type { EscrowTransaction } from '@/types';
import type { PendingPayment } from '@/src/services/providers/firebase/payment';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router   = useRouter();
  const [tab, setTab] = useState<'overview' | 'payments' | 'escrow' | 'users' | 'jobs'>('overview');
  const [stats, setStats]           = useState({ users: 0, jobs: 0, gigs: 0, escrowTotal: 0, revenue: 0, pendingPayments: 0 });
  const [payments, setPayments]     = useState<PendingPayment[]>([]);
  const [escrows, setEscrows]       = useState<EscrowTransaction[]>([]);
  const [users, setUsers]           = useState<any[]>([]);
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [acting, setActing]         = useState('');
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersSnap, jobsSnap, gigsSnap, paymentsSnap, escrowData] = await Promise.all([
        getDocs(query(collection(db, 'users'), limit(200))),
        getDocs(query(collection(db, 'jobs'), limit(200))),
        getDocs(query(collection(db, 'gigs'), limit(200))),
        getDocs(query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(100))),
        EscrowService.getAllEscrows(),
      ]);

      const allPayments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PendingPayment[];
      const pendingPay  = allPayments.filter(p => p.status === 'pending');
      const totalRevenue = escrowData.filter(e => e.status === 'released').reduce((s, e) => s + e.platformFee, 0);
      const totalEscrow  = escrowData.filter(e => ['funded','in_progress','submitted','approved'].includes(e.status)).reduce((s, e) => s + e.amount, 0);

      setStats({
        users:           usersSnap.size,
        jobs:            jobsSnap.size,
        gigs:            gigsSnap.size,
        escrowTotal:     totalEscrow,
        revenue:         totalRevenue,
        pendingPayments: pendingPay.length,
      });
      setPayments(allPayments);
      setEscrows(escrowData);
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPendingJobs(jobsSnap.docs.filter(d => d.data().status === 'pending_review').map(d => ({ id: d.id, ...d.data() })));
    } finally { setLoading(false); }
  };

  const confirmPayment = async (payment: PendingPayment) => {
    setActing(payment.id);
    try {
      await PaymentService.confirmManualPayment({
        paymentId: payment.id,
        adminUid:  user!.uid,
        plan:      payment.plan,
        userId:    payment.userId,
      });
      setPayments(ps => ps.map(p => p.id === payment.id ? { ...p, status: 'confirmed' } : p));
    } finally { setActing(''); }
  };

  const rejectPayment = async (payment: PendingPayment) => {
    setActing(payment.id);
    try {
      await PaymentService.cancelPayment(payment.id);
      setPayments(ps => ps.map(p => p.id === payment.id ? { ...p, status: 'cancelled' } : p));
    } finally { setActing(''); }
  };

  const releaseEscrow = async (escrow: EscrowTransaction) => {
    setActing(escrow.id);
    try {
      await EscrowService.releaseFunds(escrow.id, user!.uid);
      setEscrows(es => es.map(e => e.id === escrow.id ? { ...e, status: 'released' } : e));
    } finally { setActing(''); }
  };

  const approveJob = async (jobId: string) => {
    setActing(jobId);
    try {
      await updateDoc(doc(db, 'jobs', jobId), { status: 'active', reviewedBy: user!.uid, reviewedAt: serverTimestamp() });
      setPendingJobs(js => js.filter(j => j.id !== jobId));
    } finally { setActing(''); }
  };

  const rejectJob = async (jobId: string) => {
    setActing(jobId);
    try {
      await updateDoc(doc(db, 'jobs', jobId), { status: 'draft', rejectionReason: rejectNote, reviewedBy: user!.uid, reviewedAt: serverTimestamp() });
      setPendingJobs(js => js.filter(j => j.id !== jobId));
      setRejectNote('');
    } finally { setActing(''); }
  };

  const banUser = async (userId: string) => {
    if (!confirm('Ban this user?')) return;
    await updateDoc(doc(db, 'users', userId), { banned: true, updatedAt: serverTimestamp() });
    setUsers(us => us.map(u => u.id === userId ? { ...u, banned: true } : u));
  };

  if (!user || user.role !== 'admin') return null;

  const pendingPayments = payments.filter(p => p.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage JoblifyHQ platform</p>
          </div>
          <button onClick={() => router.push('/admin/platform')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            ⚙️ Platform Settings
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-1 flex-wrap">
          {[
            { key: 'overview',  label: '🏠 Overview' },
            { key: 'payments',  label: `💳 Payments ${pendingPayments.length > 0 ? `(${pendingPayments.length})` : ''}` },
            { key: 'escrow',    label: '🔒 Escrow' },
            { key: 'users',     label: '👥 Users' },
            { key: 'jobs',      label: `📋 Jobs ${pendingJobs.length > 0 ? `(${pendingJobs.length})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${tab === t.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading data...</div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Total Users',    value: stats.users,            color: 'text-blue-600' },
                    { label: 'Jobs Posted',    value: stats.jobs,             color: 'text-purple-600' },
                    { label: 'Gigs Posted',    value: stats.gigs,             color: 'text-indigo-600' },
                    { label: 'Escrow Held',    value: `$${stats.escrowTotal}`, color: 'text-yellow-600' },
                    { label: 'Platform Revenue', value: `$${stats.revenue}`,  color: 'text-green-600' },
                    { label: 'Pending Payments', value: stats.pendingPayments, color: 'text-red-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                      <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      {[
                        { label: '⚙️ Platform Settings', route: '/admin/platform' },
                        { label: '💳 Review Payments', action: () => setTab('payments') },
                        { label: '🔒 Escrow Management', action: () => setTab('escrow') },
                        { label: '👥 Manage Users', action: () => setTab('users') },
                      ].map((a, i) => (
                        <button key={i} onClick={a.action || (() => router.push(a.route!))}
                          className="w-full text-left text-sm text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 py-1 hover:underline">
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Pending Actions</h3>
                    <div className="space-y-2 text-sm">
                      {pendingPayments.length > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Payment confirmations</span><span className="font-bold text-red-600">{pendingPayments.length}</span></div>}
                      {pendingJobs.length > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Jobs awaiting review</span><span className="font-bold text-yellow-600">{pendingJobs.length}</span></div>}
                      {escrows.filter(e => e.status === 'approved').length > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Escrows to release</span><span className="font-bold text-blue-600">{escrows.filter(e => e.status === 'approved').length}</span></div>}
                      {pendingPayments.length === 0 && pendingJobs.length === 0 && <p className="text-gray-500">All clear ✓</p>}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl p-5">
                    <h3 className="font-semibold mb-2">Revenue Summary</h3>
                    <p className="text-3xl font-bold">${stats.revenue}</p>
                    <p className="text-blue-200 text-sm mt-1">Total platform fees earned</p>
                    <p className="text-sm mt-3 text-blue-100">Escrow held: <strong>${stats.escrowTotal}</strong></p>
                  </div>
                </div>
              </div>
            )}

            {/* Payments */}
            {tab === 'payments' && (
              <div className="space-y-4">
                {/* Pending first */}
                {pendingPayments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">⏳ Pending Confirmation ({pendingPayments.length})</h3>
                    <div className="space-y-3">
                      {pendingPayments.map(p => (
                        <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{p.userName}</p>
                              <p className="text-sm text-gray-500">{p.userEmail}</p>
                              <p className="text-xs text-gray-400 mt-1">Plan: <strong className="text-gray-700 dark:text-gray-300">{p.plan}</strong> · Method: {p.method.replace('_',' ')}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-gray-900 dark:text-white">₦{(p.amountNGN ?? 0).toLocaleString()}</p>
                              <p className="text-xs text-gray-500">${p.amountUSD}</p>
                            </div>
                          </div>
                          <p className="text-xs font-mono text-gray-500 mb-3 bg-gray-50 dark:bg-gray-700 rounded px-2 py-1">Ref: {p.reference}</p>
                          {(p as any).note && <p className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded p-2 mb-3">Note: {(p as any).note}</p>}
                          <div className="flex gap-2">
                            <button onClick={() => confirmPayment(p)} disabled={acting === p.id}
                              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                              {acting === p.id ? 'Processing...' : '✓ Confirm & Activate'}
                            </button>
                            <button onClick={() => rejectPayment(p)} disabled={acting === p.id}
                              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All payments */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">All Payments</h3>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">User</th>
                          <th className="px-4 py-3 text-left">Plan</th>
                          <th className="px-4 py-3 text-left">Amount</th>
                          <th className="px-4 py-3 text-left">Method</th>
                          <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {payments.slice(0, 50).map(p => (
                          <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 dark:text-white">{p.userName}</p>
                              <p className="text-xs text-gray-500">{p.userEmail}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.plan}</td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">${p.amountUSD}</td>
                            <td className="px-4 py-3 text-gray-500 capitalize">{p.method.replace('_',' ')}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                p.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                p.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'}`}>{p.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Escrow */}
            {tab === 'escrow' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Pending Funding', value: escrows.filter(e => e.status === 'pending_funding').length, color: 'text-gray-600' },
                    { label: 'Active (Funded)', value: escrows.filter(e => ['funded','in_progress','submitted'].includes(e.status)).length, color: 'text-blue-600' },
                    { label: 'Awaiting Release', value: escrows.filter(e => e.status === 'approved').length, color: 'text-yellow-600' },
                    { label: 'Disputed', value: escrows.filter(e => e.status === 'disputed').length, color: 'text-red-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {escrows.filter(e => e.status === 'approved').length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-yellow-700 mb-2 uppercase">⚡ Ready to Release</h3>
                    {escrows.filter(e => e.status === 'approved').map(e => (
                      <div key={e.id} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 rounded-xl p-4 mb-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{e.gigTitle}</p>
                          <p className="text-xs text-gray-500">Freelancer: {e.freelancerName} · Amount: ${e.freelancerAmount}</p>
                        </div>
                        <button onClick={() => releaseEscrow(e)} disabled={acting === e.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 shrink-0">
                          {acting === e.id ? 'Releasing...' : '💸 Release Funds'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Gig</th>
                        <th className="px-4 py-3 text-left">Client</th>
                        <th className="px-4 py-3 text-left">Freelancer</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Fee</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {escrows.slice(0, 50).map(e => (
                        <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => router.push(`/escrow/${e.id}`)}>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-xs truncate">{e.gigTitle}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{e.clientName}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{e.freelancerName}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">${e.amount}</td>
                          <td className="px-4 py-3 text-green-600 font-medium">${e.platformFee}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                              e.status === 'released'  ? 'bg-green-100 text-green-700' :
                              e.status === 'disputed'  ? 'bg-red-100 text-red-700' :
                              e.status === 'approved'  ? 'bg-yellow-100 text-yellow-700' :
                              e.status === 'funded' || e.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'}`}>{e.status.replace(/_/g,' ')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users */}
            {tab === 'users' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Plan</th>
                      <th className="px-4 py-3 text-left">Country</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {users.slice(0, 100).map(u => (
                      <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${u.banned ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                            u.role === 'admin'     ? 'bg-red-100 text-red-700' :
                            u.role === 'moderator' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'employer'  ? 'bg-blue-100 text-blue-700' :
                            u.role === 'freelancer'? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{u.tier || 'free'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.country || '—'}</td>
                        <td className="px-4 py-3">
                          {!u.banned && u.role !== 'admin' && (
                            <button onClick={() => banUser(u.id)} className="text-xs text-red-600 hover:text-red-800 hover:underline">Ban</button>
                          )}
                          {u.banned && <span className="text-xs text-red-500">Banned</span>}
                          {u.role === 'admin' && <span className="text-xs text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Jobs pending review */}
            {tab === 'jobs' && (
              <div className="space-y-4">
                {pendingJobs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-2">✅</p>
                    <p>No jobs pending review</p>
                  </div>
                ) : pendingJobs.map(job => (
                  <div key={job.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                        <p className="text-sm text-gray-500">{job.company} · {job.location}</p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending Review</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">{job.description}</p>
                    <div className="mb-3">
                      <input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Rejection reason (if rejecting)..."
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveJob(job.id)} disabled={acting === job.id}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                        ✓ Approve
                      </button>
                      <button onClick={() => rejectJob(job.id)} disabled={acting === job.id || !rejectNote}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
