'use client';
import Link from 'next/link';
import { FiMapPin, FiDollarSign, FiGlobe } from 'react-icons/fi';
import ShareButtons from '@/components/blog/ShareButtons';
import { getCountryFlag, daysUntil, isWithin7Days } from '@/constants';
import type { Job } from '@/types';

interface JobCardProps {
  job: any;
  [key: string]: any;
}

export default function JobCard({ job }: JobCardProps) {
  const flag         = getCountryFlag(job.location || job.country || '');
  const days         = daysUntil(job.deadline);
  const activeHiring = isWithin7Days(job.createdAt as { seconds: number } | string | null | undefined);
  const shareUrl     = typeof window !== 'undefined'
    ? `${window.location.origin}/jobs/${job.id}`
    : `/jobs/${job.id}`;

  const urgencyLabel = () => {
    if (days === null) return null;
    if (days < 0)  return { text: 'Expired',           color: 'bg-red-100 text-red-600' };
    if (days === 0) return { text: 'Closes today!',     color: 'bg-red-100 text-red-600' };
    if (days <= 3)  return { text: `Closes in ${days}d`, color: 'bg-orange-100 text-orange-600' };
    if (days <= 7)  return { text: `Closes in ${days}d`, color: 'bg-yellow-100 text-yellow-700' };
    return null;
  };

  const urgency = urgencyLabel();

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`card p-5 flex flex-col gap-3 group ${job.isFeatured ? 'border-2 border-yellow-400 dark:border-yellow-500' : ''}`}
    >
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {job.isFeatured && (
          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full font-semibold">
            ⚡ Featured
          </span>
        )}
        {activeHiring && (
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Actively Hiring
          </span>
        )}
        {job.isRemote && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-semibold flex items-center gap-1">
            <FiGlobe size={10} /> Remote
          </span>
        )}
        {urgency && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${urgency.color}`}>
            ⏰ {urgency.text}
          </span>
        )}
      </div>

      {/* Title & type */}
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition leading-snug">
          {job.title}
        </h3>
        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium flex-shrink-0">
          {job.type}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>

      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1"><FiMapPin size={13} /> {flag} {job.location}</span>
        <span className="flex items-center gap-1"><FiDollarSign size={13} /> {job.salary || 'N/A'}</span>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-500">Deadline: {job.deadline || 'Rolling'}</span>
        <div className="flex items-center gap-2">
          <ShareButtons compact url={shareUrl} title={`${job.title} at ${job.company} — JoblifyHQ`} />
          <span className="text-primary-600 text-sm font-medium group-hover:underline">View →</span>
        </div>
      </div>
    </Link>
  );
}
