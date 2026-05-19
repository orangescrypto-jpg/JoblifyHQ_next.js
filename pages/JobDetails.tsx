'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMapPin, FiClock, FiDollarSign, FiBookmark, FiExternalLink, FiCalendar, FiSend, FiMail, FiUsers, FiGlobe } from 'react-icons/fi';
import { getJobById, getJobs, createReferral } from '@/services/firebase/jobs';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import ShareButtons from '@/components/blog/ShareButtons';
import ApplyModal from '@/components/common/ApplyModal';
import JobCard from '@/components/job/JobCard';
import { daysUntil } from '@/constants';

function RichDescription({ text }: { text: string }) {
  if (!text) return null;
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return (
      <div
        className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  return (
    <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
      {text.split('\n\n').map((block, i) => {
        const lines = block.split('\n');
        const hasBullets = lines.some(l => l.startsWith('• '));
        if (hasBullets) {
          return (
            <ul key={i} className="list-disc list-inside space-y-1">
              {lines.map((line, j) => (
                <li key={j}>{line.startsWith('• ') ? line.slice(2) : line}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}


function isActivelyHiring(createdAt: any) {
  if (!createdAt) return false;
  const posted = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
  return (Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24) <= 7;
}

export default function JobDetails() {
  const params = useParams(); const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { savedJobs, toggleSaveJob } = useDashboard();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState<any[]>([]);

  // Referral state
  const [showReferral, setShowReferral] = useState(false);
  const [referralEmail, setReferralEmail] = useState('');
  const [referralSent, setReferralSent] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setRelatedJobs([]);
    setShowReferral(false);
    setReferralSent(false);
    getJobById(id).then(data => {
      setJob(data || null);
      setLoading(false);
      if (data?.category) {
        getJobs({ category: data.category }, 10).then(({ jobs }: { jobs: any[] }) => {
          setRelatedJobs(jobs.filter(j => j.id !== id).slice(0, 2));
        }).catch(() => {});
      }
    }).catch(() => setLoading(false));
  }, [id]);

  const isSaved = savedJobs.some(j => j.jobId === id || j.id === id);
  const hasWebsite = !!job?.applyLink;
  const hasEmail = !!job?.applyEmail;
  const days = job ? daysUntil(job.deadline) : null;
  const activeHiring = job ? isActivelyHiring(job.createdAt) : false;

  const handleReferral = async () => {
    if (!user) { router.push('/login'); return; }
    if (!referralEmail) return;
    setReferralLoading(true);
    try {
      await createReferral(id, user.uid, referralEmail);
      setReferralSent(true);
      setReferralEmail('');
    } catch (e) {
      console.error(e);
    } finally {
      setReferralLoading(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-4 p-10 max-w-4xl mx-auto">
      <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  );

  if (!job) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Job Not Found</h2>
      <button onClick={() => router.push('/jobs')} className="btn-primary">Browse Jobs</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {activeHiring && (
              <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 border border-green-300 rounded-full font-semibold animate-pulse">
                🟢 Actively Hiring
              </span>
            )}
            {job.isRemote && (
              <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-semibold flex items-center gap-1">
                <FiGlobe size={11} /> Global Remote
              </span>
            )}
            {days !== null && days <= 7 && days >= 0 && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${days <= 3 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                ⏰ {days === 0 ? 'Closes today!' : `Closes in ${days} day${days === 1 ? '' : 's'}`}
              </span>
            )}
            {job.isFeatured && (
              <span className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full font-semibold">
                ⚡ Featured
              </span>
            )}
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
              <Link
                href={`/employers/${encodeURIComponent(job.company)}`}
                className="text-lg text-primary-600 font-medium mt-1 hover:underline inline-block"
              >
                {job.company}
              </Link>
            </div>
            <button
              onClick={() => user ? toggleSaveJob(job) : router.push('/login')}
              className={`p-3 rounded-lg border self-start ${isSaved ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'} hover:opacity-80 transition`}
            >
              <FiBookmark size={20} />
            </button>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Location</span>
              <span className="font-medium text-gray-900 dark:text-white flex items-center justify-center gap-1"><FiMapPin size={14} /> {job.location}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Type</span>
              <span className="font-medium text-gray-900 dark:text-white flex items-center justify-center gap-1"><FiClock size={14} /> {job.type}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Salary</span>
              <span className="font-medium text-gray-900 dark:text-white flex items-center justify-center gap-1"><FiDollarSign size={14} /> {job.salary || 'N/A'}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Deadline</span>
              <span className="font-medium text-gray-900 dark:text-white flex items-center justify-center gap-1"><FiCalendar size={14} /> {job.deadline || 'Rolling'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">About the Role</h3>
            <RichDescription text={job.description} />
          </div>

          {/* Apply Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setApplyOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition text-lg"
            >
              <FiSend size={18} /> Apply on JoblifyHQ
            </button>
            {hasWebsite && (
              <a href={job.applyLink} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-bold py-3 px-6 rounded-xl transition text-lg">
                <FiExternalLink size={18} /> Apply on Website
              </a>
            )}
            {hasEmail && (
              <a href={`mailto:${job.applyEmail}?subject=Application for ${encodeURIComponent(job.title)}`}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-bold py-3 px-6 rounded-xl transition text-lg">
                <FiMail size={18} /> Apply via Email
              </a>
            )}
          </div>

          {hasWebsite && hasEmail && (
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
              You can apply through the website or send your application directly by email.
            </p>
          )}

          {/* ── Referral / Networking Prompt ── */}
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <FiUsers size={16} /> Do you know someone at {job.company}?
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Networking is how most jobs are filled in Nigeria. Refer a friend to this role and help them land their next opportunity.
                </p>
              </div>
              {!showReferral && !referralSent && (
                <button
                  onClick={() => setShowReferral(true)}
                  className="flex-shrink-0 text-sm font-semibold px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                >
                  Refer a Friend
                </button>
              )}
            </div>

            {referralSent && (
              <p className="mt-3 text-sm text-green-700 dark:text-green-400 font-medium">
                ✅ Referral sent! Your friend will see this opportunity.
              </p>
            )}

            {showReferral && !referralSent && (
              <div className="mt-4 flex gap-2">
                <input
                  type="email"
                  value={referralEmail}
                  onChange={e => setReferralEmail(e.target.value)}
                  placeholder="Enter your friend's email address"
                  className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleReferral}
                  disabled={referralLoading || !referralEmail}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                >
                  {referralLoading ? 'Sending...' : 'Send'}
                </button>
                <button onClick={() => setShowReferral(false)} className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Share */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <ShareButtons
              title={`${job.title} at ${job.company} — JoblifyHQ`}
              url={typeof window !== 'undefined' ? window.location.href : ''}
            />
          </div>

        </div>
      </div>

      {/* Related Jobs */}
      {relatedJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Related Jobs in <span className="text-primary-600">{job.category}</span>
            </h2>
            <button onClick={() => router.push('/jobs')} className="text-sm text-primary-600 hover:underline font-medium">
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedJobs.map(related => <JobCard key={related.id} job={related} />)}
          </div>
        </div>
      )}

      <ApplyModal isOpen={applyOpen} onClose={() => setApplyOpen(false)} opportunity={job} type="job" />
    </div>
  );
}
