'use client';
import { useState, useEffect } from 'react';
import { Link, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  FiBookmark, FiSend, FiBriefcase, FiAward, FiMapPin, FiClock,
  FiChevronRight, FiZap, FiStar, FiBell, FiTrendingUp, FiShield, FiEye,
} from 'react-icons/fi';

const STATUS_STYLES: Record<string, string> = {
  'Interview':    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  'Under review': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  'pending':      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'Submitted':    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'Rejected':     'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const PREMIUM_PERKS = [
  { icon: FiTrendingUp, label: 'Profile Boost' },
  { icon: FiBell,       label: 'Unlimited Alerts' },
  { icon: FiEye,        label: 'Profile Views' },
  { icon: FiShield,     label: 'Application Tracking' },
  { icon: FiStar,       label: 'Featured Badge' },
];

const TABS = ['overview', 'saved', 'applications', 'profile', 'premium'];

// ── Kanban config ────────────────────────────────────────────────────────────
const KANBAN_COLUMNS = [
  {
    key: 'Applied',
    label: 'Applied',
    emoji: '📤',
    borderColor: 'border-t-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    bar: 'bg-blue-400',
  },
  {
    key: 'Viewed',
    label: 'Viewed',
    emoji: '👁️',
    borderColor: 'border-t-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/10',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    bar: 'bg-yellow-400',
  },
  {
    key: 'Shortlisted',
    label: 'Shortlisted',
    emoji: '⭐',
    borderColor: 'border-t-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/10',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    bar: 'bg-purple-400',
  },
  {
    key: 'Rejected',
    label: 'Rejected',
    emoji: '❌',
    borderColor: 'border-t-red-400',
    bg: 'bg-red-50 dark:bg-red-900/10',
    badge: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
    bar: 'bg-red-400',
  },
];

function mapToKanban(status: string | undefined) {
  if (!status || status === 'pending' || status === 'Submitted') return 'Applied';
  if (['Under review', 'Viewed', 'Contacted', 'New'].includes(status)) return 'Viewed';
  if (['Interview', 'Shortlisted'].includes(status)) return 'Shortlisted';
  if (status === 'Rejected') return 'Rejected';
  return 'Applied';
}

function fmtDate(ts: unknown) {
  if (!ts) return '';
  try {
    const d = (ts as any)?.toDate ? (ts as any).toDate() : new Date(ts as string | number | Date);
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

// ── KanbanBoard ──────────────────────────────────────────────────────────────
function KanbanBoard({ applications }: { applications: any[] }) {
  const grouped = KANBAN_COLUMNS.reduce<Record<string, any[]>>((acc, col) => {
    acc[col.key] = applications.filter(a => mapToKanban(a.status) === col.key);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Columns grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {KANBAN_COLUMNS.map(col => (
          <div
            key={col.key}
            className={`rounded-xl border-t-4 ${col.borderColor} border border-gray-200 dark:border-gray-700 overflow-hidden`}
          >
            {/* Column header */}
            <div className={`px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 ${col.bg}`}>
              <span className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                {col.emoji} {col.label}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                {grouped[col.key].length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-3 space-y-3 min-h-[100px] bg-white dark:bg-gray-800/40">
              {grouped[col.key].length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
                  No applications here
                </p>
              ) : (
                grouped[col.key].map(app => (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3.5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 shrink-0">
                        {app.opportunityType === 'scholarship' ? <FiAward size={14} /> : <FiBriefcase size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
                          {app.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {app.company || app.org || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                        {app.opportunityType === 'scholarship' ? '🎓 Scholarship' : '💼 Job'}
                      </span>
                      {app.appliedAt && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {fmtDate(app.appliedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline progress bar */}
      {applications.length > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Pipeline Overview
          </p>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
            {KANBAN_COLUMNS.map(col => {
              const count = grouped[col.key].length;
              const pct = (count / applications.length) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={col.key}
                  className={`${col.bar} first:rounded-l-full last:rounded-r-full transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${col.label}: ${count}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {KANBAN_COLUMNS.map(col => (
              <div key={col.key} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className={`w-2.5 h-2.5 rounded-full ${col.bar}`} />
                {col.emoji} {col.label} ({grouped[col.key].length})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const { savedJobs, savedScholarships, applications, loading } = useDashboard();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [profileViews, setProfileViews] = useState(0);
  const [viewsLoading, setViewsLoading] = useState(true);

  const isPremium = user?.tier === 'premium' || user?.tier === 'premium-annual';

  useEffect(() => {
    if (!user?.uid) { setViewsLoading(false); return; }
    getDocs(query(collection(db, 'profile_views'), where('userId', '==', user.uid)))
      .then(snap => setProfileViews(snap.size))
      .catch(() => setProfileViews(0))
      .finally(() => setViewsLoading(false));
  }, [user?.uid]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user?.name?.split(' ')[0] || 'User'}
                </h1>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full font-semibold border border-primary-200 dark:border-primary-700">
                    <FiZap size={11} /> Premium
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Your career dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              {!isPremium && (
                <button
                  onClick={() => router.push('/premium')}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
                >
                  <FiZap size={11} /> Upgrade to Premium
                </button>
              )}
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-xl font-bold text-primary-600 dark:text-primary-400">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{loading ? '—' : savedJobs.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Saved Jobs</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{loading ? '—' : applications.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Applications</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{loading ? '—' : savedScholarships.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Scholarships</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            {isPremium ? (
              <>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{viewsLoading ? '—' : profileViews}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Profile Views</p>
              </>
            ) : (
              <button onClick={() => router.push('/premium')} className="w-full h-full flex flex-col items-start justify-center text-left">
                <p className="text-3xl font-bold text-gray-300 dark:text-gray-600 mb-1">—</p>
                <p className="text-xs text-primary-600 font-medium flex items-center gap-1"><FiZap size={10} /> Unlock with Premium</p>
              </button>
            )}
          </div>
        </div>

        {/* Premium banner */}
        {!isPremium && (
          <div className="mb-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
            <div>
              <div className="flex items-center gap-2 mb-1"><FiZap size={16} /><span className="font-bold text-sm">Upgrade to JoblifyHQ Premium</span></div>
              <p className="text-primary-100 text-sm">Profile boost, unlimited alerts, view who checked your profile and more.</p>
            </div>
            <button onClick={() => router.push('/premium')} className="bg-white text-primary-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary-50 transition whitespace-nowrap self-start sm:self-center">
              See Plans →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize whitespace-nowrap transition flex items-center gap-1.5 ${activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {tab === 'premium' && <FiZap size={13} />}{tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Saved Jobs</h2>
                {savedJobs.length > 0 && <button onClick={() => setActiveTab('saved')} className="text-sm text-primary-600 hover:underline font-medium">View all →</button>}
              </div>
              {savedJobs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><FiBookmark size={24} /></div>
                  <p className="text-gray-900 dark:text-white font-medium mb-1">No saved jobs yet</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Browse opportunities to start building your list.</p>
                  <Link href="/jobs" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-lg transition">Browse Jobs</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedJobs.slice(0, 3).map(job => {
                    const data: any = job.itemData || job;
                    return (
                      <Link key={job.id} href={`/jobs/${data.id || job.jobId}`}
                        className="block bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-4">
                            <div className="w-11 h-11 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {data.company?.substring(0, 2).toUpperCase() || 'JB'}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{data.title}</h3>
                              <p className="text-gray-500 dark:text-gray-400 text-sm">{data.company}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"><FiMapPin size={11} /> {data.location}</span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">{data.type}</span>
                                {data.deadline && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full"><FiClock size={11} /> Due {data.deadline}</span>}
                              </div>
                            </div>
                          </div>
                          <FiChevronRight className="text-gray-400 flex-shrink-0 mt-1" size={18} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Applications</h2>
                {applications.length > 0 && <button onClick={() => setActiveTab('applications')} className="text-sm text-primary-600 hover:underline font-medium">View all →</button>}
              </div>
              {applications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><FiSend size={24} /></div>
                  <p className="text-gray-900 dark:text-white font-medium mb-1">No applications yet</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Find a job or scholarship and hit Apply on JoblifyHQ.</p>
                  <Link href="/jobs" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-lg transition">Find Opportunities</Link>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {applications.slice(0, 5).map(app => (
                    <div key={app.id} className="p-5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
                          {app.opportunityType === 'scholarship' ? <FiAward size={16} /> : <FiBriefcase size={16} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{app.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{app.company || app.org}</p>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${STATUS_STYLES[app.status] || STATUS_STYLES['Submitted']}`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {savedScholarships.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Saved Scholarships</h2>
                  <button onClick={() => setActiveTab('saved')} className="text-sm text-primary-600 hover:underline font-medium">View all →</button>
                </div>
                <div className="space-y-3">
                  {savedScholarships.slice(0, 2).map(sch => {
                    const data: any = sch.itemData || sch;
                    return (
                      <Link key={sch.id} href={`/scholarships/${data.id || sch.scholarshipId}`}
                        className="block bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex gap-3 items-center">
                            <div className="w-11 h-11 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0"><FiAward size={18} /></div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{data.title}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{data.org} · {data.country}</p>
                            </div>
                          </div>
                          <FiChevronRight className="text-gray-400 flex-shrink-0" size={18} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── SAVED ── */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FiBriefcase className="text-primary-600" /> Saved Jobs ({savedJobs.length})</h2>
              {savedJobs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No saved jobs yet. <Link href="/jobs" className="text-primary-600 hover:underline">Browse Jobs</Link></p>
              ) : (
                <div className="space-y-3">
                  {savedJobs.map(job => {
                    const data: any = job.itemData || job;
                    return (
                      <Link key={job.id} href={`/jobs/${data.id || job.jobId}`}
                        className="block bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 transition">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{data.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{data.company} · {data.location}</p>
                            {data.deadline && <p className="text-xs text-amber-600 mt-1">Deadline: {data.deadline}</p>}
                          </div>
                          <FiChevronRight className="text-gray-400 flex-shrink-0" size={18} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FiAward className="text-purple-600" /> Saved Scholarships ({savedScholarships.length})</h2>
              {savedScholarships.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No saved scholarships yet. <Link href="/scholarships" className="text-primary-600 hover:underline">Browse Scholarships</Link></p>
              ) : (
                <div className="space-y-3">
                  {savedScholarships.map(sch => {
                    const data: any = sch.itemData || sch;
                    return (
                      <Link key={sch.id} href={`/scholarships/${data.id || sch.scholarshipId}`}
                        className="block bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 transition">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{data.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{data.org} · {data.country}</p>
                            {data.deadline && <p className="text-xs text-amber-600 mt-1">Deadline: {data.deadline}</p>}
                          </div>
                          <FiChevronRight className="text-gray-400 flex-shrink-0" size={18} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── APPLICATIONS — KANBAN ── */}
        {activeTab === 'applications' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  My Applications{' '}
                  <span className="text-gray-400 font-normal text-base">({applications.length})</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Track every application through your hiring pipeline
                </p>
              </div>
              <Link href="/jobs" className="text-sm text-primary-600 hover:underline font-medium whitespace-nowrap">
                Find More Jobs →
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <FiSend size={40} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="font-medium text-gray-900 dark:text-white mb-1">No applications yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Apply to jobs and scholarships to track them here.
                </p>
                <Link href="/jobs" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-lg transition">
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <KanbanBoard applications={applications} />
            )}
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-2xl font-bold text-primary-600">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {isPremium && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                    <FiZap size={11} className="text-white" />
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user?.name}</h3>
                  {isPremium && <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full font-semibold">Premium</span>}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" defaultValue={user?.name} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" defaultValue={user?.email} readOnly className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white opacity-60 cursor-not-allowed" />
              </div>
              <button className="btn-primary">Save Changes</button>
            </div>
          </div>
        )}

        {/* ── PREMIUM ── */}
        {activeTab === 'premium' && (
          <div className="space-y-8">
            {isPremium ? (
              <>
                <div className="bg-gradient-to-br from-primary-600 to-purple-700 rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><FiZap size={22} /></div>
                    <div>
                      <h2 className="text-xl font-bold">Premium Active</h2>
                      <p className="text-primary-100 text-sm capitalize">{user?.tier?.replace('-', ' ')} plan</p>
                    </div>
                  </div>
                  <p className="text-primary-100 text-sm">You have full access to all premium features.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your active perks</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PREMIUM_PERKS.map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                        <div className="w-9 h-9 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0"><Icon size={17} /></div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{label}</span>
                        <span className="ml-auto text-xs text-green-600 font-semibold">Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-br from-primary-600 to-purple-700 rounded-2xl p-6 text-white text-center">
                  <FiZap size={36} className="mx-auto mb-3 opacity-90" />
                  <h2 className="text-2xl font-bold mb-2">Unlock Premium Features</h2>
                  <p className="text-primary-100 mb-5 text-sm max-w-md mx-auto">Stand out to employers, get unlimited job alerts, see who views your profile — from ₦2,500/month.</p>
                  <button onClick={() => router.push('/premium')} className="bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition">View Premium Plans →</button>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Features you're missing</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PREMIUM_PERKS.map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 opacity-60">
                        <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0"><Icon size={17} /></div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{label}</span>
                        <span className="ml-auto text-xs text-primary-600 font-semibold flex items-center gap-1"><FiZap size={10} /> Premium</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
