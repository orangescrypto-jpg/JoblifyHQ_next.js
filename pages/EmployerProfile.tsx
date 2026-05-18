'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMapPin, FiGlobe, FiBriefcase, FiArrowLeft, FiShare2, FiUsers } from 'react-icons/fi';
import { getJobs } from '@/services/firebase/jobs';
import JobCard from '@/components/job/JobCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

function isActivelyHiring(jobs: any[]) {
  return jobs.some(job => {
    if (!job.createdAt) return false;
    const posted = job.createdAt?.seconds
      ? new Date(job.createdAt.seconds * 1000)
      : new Date(job.createdAt);
    return (Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  });
}

export default function EmployerProfile() {
  const params = useParams(); const company = params?.company as string;
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const companyName = decodeURIComponent(company || '');

  useEffect(() => {
    if (!companyName) return;
    setLoading(true);
    getJobs({}, 200).then(({ jobs: allJobs }) => {
      const filtered = allJobs.filter(
        j => (j.company || '').toLowerCase() === companyName.toLowerCase()
      );
      setJobs(filtered);
    }).catch(console.error).finally(() => setLoading(false));
  }, [companyName]);

  const activelyHiring = isActivelyHiring(jobs);
  const firstJob = jobs[0];
  const location = firstJob?.location || firstJob?.country || '—';
  const website = firstJob?.companyWebsite || firstJob?.applyLink || null;
  const initials = companyName.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${companyName} — JoblifyHQ`, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Back */}
      <button
        onClick={() => router.push(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 transition"
      >
        <FiArrowLeft size={16} /> Back
      </button>

      {/* Company Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-primary-600 to-purple-600" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center text-2xl font-black text-primary-600 select-none">
              {initials}
            </div>
            <div className="flex items-center gap-2 mt-12">
              {activelyHiring && (
                <span className="text-xs px-3 py-1 bg-green-100 text-green-700 border border-green-300 rounded-full font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                  Actively Hiring
                </span>
              )}
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-primary-600 border border-gray-200 dark:border-gray-700 rounded-lg transition"
                title="Share profile"
              >
                <FiShare2 size={16} />
              </button>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{companyName}</h1>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <FiBriefcase size={14} /> {jobs.length} open role{jobs.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <FiMapPin size={14} /> {location}
            </span>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-600 hover:underline"
              >
                <FiGlobe size={14} /> Company Website
              </a>
            )}
          </div>

          {/* About */}
          <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
              <FiUsers size={15} /> About {companyName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {firstJob?.companyAbout ||
                `${companyName} is actively hiring on JoblifyHQ. Browse their open roles below and apply today.`}
            </p>
          </div>
        </div>
      </div>

      {/* Open Roles */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Open Roles at {companyName}
        </h2>

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">No open roles right now</p>
            <p className="text-sm mb-4">Check back soon or browse other opportunities.</p>
            <Link href="/jobs" className="btn-primary text-sm">Browse All Jobs</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </div>
    </div>
  );
}
