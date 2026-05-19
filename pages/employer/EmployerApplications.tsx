'use client';
import { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiEye, FiX, FiUsers, FiRefreshCw, FiFileText, FiZap } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { getEmployerJobs, sortApplicationsByBoost } from '@/services/firebase/jobs';
import { getEmployerScholarships } from '@/services/firebase/scholarships';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

const STATUS_STYLES: Record<string,string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  New:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Viewed:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Contacted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Interview: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Rejected:  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const isPremiumApplicant = (app: Record<string, any>) =>
  app.applicantTier === 'premium' || app.applicantTier === 'premium-annual';

export default function EmployerApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Record<string, any> | null>(null);
  const [filterJob, setFilterJob] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchApplications = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [jobs, scholarships] = await Promise.all([
        getEmployerJobs(user.uid),
        getEmployerScholarships(user.uid),
      ]);

      const allListings = [
        ...jobs.map(j => ({ ...j, listingType: 'job' })),
        ...scholarships.map(s => ({ ...s, listingType: 'scholarship' })),
      ];

      setJobTitles(allListings.map(l => ({ id: l.id, title: l.title })));

      if (allListings.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const allIds = allListings.map(l => l.id);
      const chunks = [];
      for (let i = 0; i < allIds.length; i += 10) {
        chunks.push(allIds.slice(i, i + 10));
      }

      let allApps: any[] = [];
      for (const chunk of chunks) {
        const q = query(
          collection(db, 'applications'),
          where('opportunityId', 'in', chunk)
        );
        const snap = await getDocs(q);
        allApps = [...allApps, ...snap.docs.map(d => ({ id: d.id, ...d.data() } as any))];
      }

      setApplications(sortApplicationsByBoost(allApps));
    } catch (err) {
      console.error('Error fetching applications:', err);
      showToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [user?.uid]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedApp?.id === appId) setSelectedApp(prev => ({ ...prev, status: newStatus }));
      showToast('Status updated');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const filtered = applications.filter(app => {
    const jobMatch = filterJob === 'all' || app.opportunityId === filterJob;
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;
    return jobMatch && statusMatch;
  });

  const formatDate = (ts: any) => {
    if (!ts?.toDate) return 'Recently';
    const d = ts.toDate();
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Applications Received</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {applications.length} total application{applications.length !== 1 ? 's' : ''}
            {applications.filter(isPremiumApplicant).length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-medium">
                <FiZap size={11} />
                {applications.filter(isPremiumApplicant).length} premium
              </span>
            )}
          </p>
        </div>
        <button onClick={fetchApplications} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 transition">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterJob} onChange={e => setFilterJob(e.target.value)}
          className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm w-48">
          <option value="all">All Listings</option>
          {jobTitles.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm w-40">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="New">New</option>
          <option value="Viewed">Viewed</option>
          <option value="Contacted">Contacted</option>
          <option value="Interview">Interview</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FiUsers size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No applications yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {applications.length === 0
              ? 'Applications from job seekers will appear here once they apply.'
              : 'No applications match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(app => (
            <div
              key={app.id}
              className={`bg-white dark:bg-gray-800 p-5 rounded-xl border hover:shadow-md transition ${
                isPremiumApplicant(app)
                  ? 'border-primary-200 dark:border-primary-700 ring-1 ring-primary-100 dark:ring-primary-900/30'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {app.userName || 'Applicant'}
                        </h3>
                        {isPremiumApplicant(app) && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full font-semibold border border-primary-200 dark:border-primary-700">
                            <FiZap size={10} /> Premium
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Applied for: <span className="font-medium">{app.title}</span>
                      </p>
                    </div>
                    <select
                      value={app.status || 'pending'}
                      onChange={e => handleStatusChange(app.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border-0 cursor-pointer shrink-0 ${STATUS_STYLES[app.status] || STATUS_STYLES.pending}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="New">New</option>
                      <option value="Viewed">Viewed</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Interview">Interview</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {app.coverNote && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{app.coverNote}</p>
                  )}

                  {app.cvUrl && (
                    <a
                      href={app.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      <FiFileText size={12} /> {app.cvFileName || 'View CV'}
                    </a>
                  )}

                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    {app.userEmail && <span>📧 {app.userEmail}</span>}
                    {app.phone && <span>📱 {app.phone}</span>}
                    <span>⏰ {formatDate(app.appliedAt)}</span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 shrink-0">
                  <button onClick={() => setSelectedApp(app)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition">
                    <FiEye size={14} /> View
                  </button>
                  {app.userEmail && (
                    <a href={`mailto:${app.userEmail}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition">
                      <FiMail size={14} /> Email
                    </a>
                  )}
                  {app.phone && (
                    <a href={`tel:${app.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition">
                      <FiPhone size={14} /> Call
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedApp.userName}'s Application
                </h3>
                {isPremiumApplicant(selectedApp) && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full font-semibold border border-primary-200 dark:border-primary-700">
                    <FiZap size={10} /> Premium
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedApp.userName || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedApp.userEmail || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedApp.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Applied For</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedApp.title}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Applied</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedApp.appliedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Status</p>
                  <select
                    value={selectedApp.status || 'pending'}
                    onChange={e => handleStatusChange(selectedApp.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_STYLES[selectedApp.status] || STATUS_STYLES.pending}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="New">New</option>
                    <option value="Viewed">Viewed</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interview">Interview</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {selectedApp.cvUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CV / Resume</p>
                  <a
                    href={selectedApp.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition text-sm font-medium border border-primary-200 dark:border-primary-800"
                  >
                    <FiFileText size={15} /> {selectedApp.cvFileName || 'View CV / Resume'}
                  </a>
                </div>
              )}

              {selectedApp.coverNote && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Note</p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-sm">{selectedApp.coverNote}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
                {selectedApp.userEmail && (
                  <a
                    href={`mailto:${selectedApp.userEmail}?subject=Re: Your application for ${selectedApp.title}`}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FiMail /> Send Email
                  </a>
                )}
                {selectedApp.phone && (
                  <a
                    href={`tel:${selectedApp.phone.replace(/\s/g, '')}`}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <FiPhone /> Call Now
                  </a>
                )}
                {selectedApp.cvUrl && (
                  <a
                    href={selectedApp.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-2"
                  >
                    <FiFileText /> Download CV
                  </a>
                )}
                <button onClick={() => setSelectedApp(null)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
