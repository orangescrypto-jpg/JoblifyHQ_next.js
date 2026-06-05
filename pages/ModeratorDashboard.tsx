'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FreelancerService } from '@/src/services/providers/firebase/freelancer';
import { EscrowService } from '@/src/services/providers/firebase/escrow';
import { GigsService } from '@/src/services/providers/firebase/gigs';
import { JobsService } from '@/src/services/jobs';
import type { Dispute, SkillBadge, Report, EmployerKyc, ModeratorPermission } from '@/types';

const PERM_LABELS: Record<ModeratorPermission, string> = {
  review_jobs:      '📋 Review Jobs',
  review_gigs:      '🎯 Review Gigs',
  review_employers: '🏢 Review Employers',
  manage_reports:   '🚨 Manage Reports',
  manage_disputes:  '⚖️ Manage Disputes',
  review_kyc:       '✅ Review KYC',
  manage_blog:      '📝 Manage Blog',
  manage_scholarships: '🎓 Manage Scholarships',
  ban_users:        '🚫 Ban Users',
};

export default function ModeratorDashboard() {
  const { user } = useAuth();
  const router   = useRouter();
  const [tab, setTab]         = useState<'overview' | 'disputes' | 'reports' | 'kyc' | 'badges' | 'jobs' | 'gigs'>('overview');
  const [disputes, setDisputes]   = useState<Dispute[]>([]);
  const [reports, setReports]     = useState<Report[]>([]);
  const [kycs, setKycs]           = useState<EmployerKyc[]>([]);
  const [badges, setBadges]       = useState<SkillBadge[]>([]);
  const [pendingJobs, setPendingJobs]   = useState<any[]>([]);
  const [pendingGigs, setPendingGigs]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actionNote, setActionNote]     = useState('');
  const [selectedId, setSelectedId]     = useState('');

  const perms: ModeratorPermission[] = user?.moderatorPermissions || [];
  const hasPerm = (p: ModeratorPermission) => perms.includes(p);

  useEffect(() => {
    if (!user || user.role !== 'moderator') { router.push('/'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const tasks: Promise<any>[] = [];
      if (hasPerm('manage_disputes'))  tasks.push(EscrowService.getDisputes().then(setDisputes));
      if (hasPerm('manage_reports'))   tasks.push(FreelancerService.getReports('open').then(setReports));
      if (hasPerm('review_kyc'))       tasks.push(FreelancerService.getAllKycApplications('pending').then(setKycs));
      if (hasPerm('review_jobs') || hasPerm('review_gigs')) {
        tasks.push(FreelancerService.getAllPendingBadges().then(setBadges));
      }
      await Promise.all(tasks);
    } finally { setLoading(false); }
  };

  const logAction = (action: string, targetId: string, targetType: any) =>
    FreelancerService.logModeratorAction({ moderatorId: user!.uid, moderatorName: user!.name, action, targetId, targetType, note: actionNote });

  const resolveDispute = async (dispute: Dispute, resolution: 'resolved_client' | 'resolved_freelancer') => {
    await EscrowService.resolveDispute(dispute.id, dispute.escrowId, resolution, user!.uid, actionNote);
    await logAction(`Resolved dispute: ${resolution}`, dispute.id, 'dispute');
    setDisputes(d => d.filter(x => x.id !== dispute.id));
    setActionNote('');
  };

  const approveKyc = async (kyc: EmployerKyc) => {
    await FreelancerService.reviewKyc(kyc.id, kyc.employerId, 'approved', user!.uid);
    await logAction('Approved employer KYC', kyc.id, 'employer');
    setKycs(k => k.filter(x => x.id !== kyc.id));
  };

  const rejectKyc = async (kyc: EmployerKyc) => {
    await FreelancerService.reviewKyc(kyc.id, kyc.employerId, 'rejected', user!.uid, actionNote);
    await logAction('Rejected employer KYC', kyc.id, 'employer');
    setKycs(k => k.filter(x => x.id !== kyc.id));
  };

  const approveBadge = async (badge: SkillBadge) => {
    await FreelancerService.reviewBadge(badge.id, 'verified', user!.uid);
    await logAction(`Verified badge: ${badge.skill}`, badge.id, 'user');
    setBadges(b => b.filter(x => x.id !== badge.id));
  };

  const rejectBadge = async (badge: SkillBadge) => {
    await FreelancerService.reviewBadge(badge.id, 'rejected', user!.uid, actionNote);
    await logAction(`Rejected badge: ${badge.skill}`, badge.id, 'user');
    setBadges(b => b.filter(x => x.id !== badge.id));
  };

  const closeReport = async (report: Report) => {
    await FreelancerService.updateReport(report.id, { status: 'resolved', resolution: actionNote });
    await logAction('Resolved report', report.id, 'report');
    setReports(r => r.filter(x => x.id !== report.id));
    setActionNote('');
  };

  const availableTabs = [
    { key: 'overview', label: '🏠 Overview', always: true },
    { key: 'disputes', label: '⚖️ Disputes', perm: 'manage_disputes' as ModeratorPermission },
    { key: 'reports',  label: '🚨 Reports',  perm: 'manage_reports'  as ModeratorPermission },
    { key: 'kyc',      label: '✅ KYC',      perm: 'review_kyc'      as ModeratorPermission },
    { key: 'badges',   label: '🏅 Badges',   perm: 'review_employers'as ModeratorPermission },
    { key: 'jobs',     label: '📋 Jobs',     perm: 'review_jobs'     as ModeratorPermission },
  ].filter(t => t.always || hasPerm(t.perm!));

  if (!user || user.role !== 'moderator') return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moderator Panel</h1>
          <p className="text-sm text-gray-500">Welcome, {user.name}. Your permissions: {perms.map(p => PERM_LABELS[p]).join(', ') || 'None assigned'}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-1 flex-wrap">
          {availableTabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${tab === t.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Open Disputes', value: disputes.filter(d => d.status === 'open').length, color: 'text-red-600' },
                  { label: 'Open Reports',  value: reports.length,  color: 'text-orange-600' },
                  { label: 'Pending KYC',   value: kycs.length,     color: 'text-yellow-600' },
                  { label: 'Pending Badges',value: badges.length,   color: 'text-blue-600' },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
                <div className="col-span-2 md:col-span-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 text-sm text-blue-800 dark:text-blue-300">
                  <strong>Your Responsibilities:</strong>
                  <ul className="mt-2 space-y-1">
                    {perms.map(p => <li key={p}>• {PERM_LABELS[p]}</li>)}
                    {perms.length === 0 && <li>No permissions assigned. Contact admin.</li>}
                  </ul>
                </div>
              </div>
            )}

            {tab === 'disputes' && hasPerm('manage_disputes') && (
              <div className="space-y-4">
                {disputes.length === 0 ? <EmptyState icon="⚖️" label="No open disputes" /> : disputes.map(d => (
                  <div key={d.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{d.gigTitle}</h3>
                        <p className="text-sm text-gray-500">Raised by <strong>{d.raisedBy}</strong>: {d.clientName} vs {d.freelancerName}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${d.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 bg-gray-50 dark:bg-gray-700 rounded p-3">{d.reason}</p>
                    <textarea value={selectedId === d.id ? actionNote : ''} onChange={e => { setSelectedId(d.id); setActionNote(e.target.value); }}
                      placeholder="Resolution note (required)..."
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white mb-3 resize-none" rows={2} />
                    <div className="flex gap-2">
                      <button onClick={() => resolveDispute(d, 'resolved_client')} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Release to Client (Refund)</button>
                      <button onClick={() => resolveDispute(d, 'resolved_freelancer')} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700">Release to Freelancer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'reports' && hasPerm('manage_reports') && (
              <div className="space-y-4">
                {reports.length === 0 ? <EmptyState icon="✅" label="No open reports" /> : reports.map(r => (
                  <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium mr-2">{r.type.replace('_',' ')}</span>
                        <span className="text-xs text-gray-500">{r.targetType}</span>
                      </div>
                      <span className="text-xs text-gray-400">by {r.reportedByName}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{r.description}</p>
                    <textarea value={selectedId === r.id ? actionNote : ''} onChange={e => { setSelectedId(r.id); setActionNote(e.target.value); }}
                      placeholder="Resolution note..."
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white mb-2 resize-none" rows={2} />
                    <button onClick={() => closeReport(r)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Mark Resolved</button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'kyc' && hasPerm('review_kyc') && (
              <div className="space-y-4">
                {kycs.length === 0 ? <EmptyState icon="✅" label="No pending KYC applications" /> : kycs.map(k => (
                  <div key={k.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{k.companyName}</h3>
                        <p className="text-sm text-gray-500">{k.country} · {k.employerName}</p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      {k.cacNumber && <div><span className="text-gray-500">CAC:</span> <span className="font-mono">{k.cacNumber}</span></div>}
                      {k.websiteUrl && <div><span className="text-gray-500">Website:</span> <a href={k.websiteUrl} target="_blank" className="text-blue-600 hover:underline">{k.websiteUrl}</a></div>}
                      {k.documentUrl && <div className="col-span-2"><a href={k.documentUrl} target="_blank" className="text-blue-600 hover:underline text-sm">View Document →</a></div>}
                    </div>
                    <textarea value={selectedId === k.id ? actionNote : ''} onChange={e => { setSelectedId(k.id); setActionNote(e.target.value); }}
                      placeholder="Rejection reason (if rejecting)..."
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white mb-2 resize-none" rows={2} />
                    <div className="flex gap-2">
                      <button onClick={() => approveKyc(k)} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700">✓ Approve & Verify</button>
                      <button onClick={() => rejectKyc(k)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">✕ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'badges' && (
              <div className="space-y-3">
                {badges.length === 0 ? <EmptyState icon="🏅" label="No pending badge requests" /> : badges.map(b => (
                  <div key={b.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{b.skill}</p>
                      <p className="text-sm text-gray-500">{b.category} · User: {b.userId.slice(0,8)}...</p>
                      {b.evidence && <a href={b.evidence} target="_blank" className="text-xs text-blue-600 hover:underline">View Evidence →</a>}
                    </div>
                    <div className="flex gap-2 items-start">
                      <input value={selectedId === b.id ? actionNote : ''} onChange={e => { setSelectedId(b.id); setActionNote(e.target.value); }} placeholder="Rejection note..." className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs dark:bg-gray-800 dark:text-white w-40" />
                      <button onClick={() => approveBadge(b)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700">Approve</button>
                      <button onClick={() => rejectBadge(b)} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-700">Reject</button>
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

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-4xl mb-2">{icon}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
