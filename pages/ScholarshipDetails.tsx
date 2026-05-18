'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiGlobe, FiCalendar, FiAward, FiBookmark, FiExternalLink, FiSend, FiMail } from 'react-icons/fi';
import { getScholarshipById, getScholarships } from '@/services/firebase/scholarships';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import ApplyModal from '@/components/common/ApplyModal';
import ShareButtons from '@/components/blog/ShareButtons';
import ScholarshipCard from '@/components/scholarship/ScholarshipCard';

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

export default function ScholarshipDetails() {
  const params = useParams(); const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { savedScholarships, toggleSaveScholarship } = useDashboard();
  const [scholarship, setScholarship] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [relatedScholarships, setRelatedScholarships] = useState([]);

  useEffect(() => {
    setLoading(true);
    setRelatedScholarships([]);
    getScholarshipById(id).then(data => {
      setScholarship(data || null);
      setLoading(false);

      // Fetch related by same category, exclude current
      if (data?.category) {
        getScholarships({ category: data.category }).then(all => {
          const filtered = all.filter(s => s.id !== id).slice(0, 2);
          setRelatedScholarships(filtered);
        }).catch(() => {});
      }
    }).catch(() => setLoading(false));
  }, [id]);

  const isSaved = savedScholarships.some(s => s.scholarshipId === id || s.id === id);

  const hasWebsite = !!scholarship?.applyLink;
  const hasEmail = !!scholarship?.applyEmail;

  if (loading) return (
    <div className="animate-pulse space-y-4 p-10 max-w-4xl mx-auto">
      <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  );

  if (!scholarship) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Scholarship Not Found</h2>
      <button onClick={() => router.push('/scholarships')} className="btn-primary">Browse Scholarships</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Main Scholarship Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div>
              {scholarship.isFeatured && (
                <span className="inline-block mb-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full font-semibold">⚡ Featured</span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{scholarship.title}</h1>
              <p className="text-lg text-primary-600 font-medium mt-1">{scholarship.org}</p>
            </div>
            <button
              onClick={() => user ? toggleSaveScholarship(scholarship) : router.push('/login')}
              className={`p-3 rounded-lg border self-start ${isSaved ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'} hover:opacity-80 transition`}
              title={isSaved ? 'Unsave' : 'Save Scholarship'}
            >
              <FiBookmark size={20} />
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Host Country</span>
              <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2 text-sm"><FiGlobe size={14} /> {scholarship.country}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Funding Type</span>
              <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2 text-sm"><FiAward size={14} /> {scholarship.type}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Deadline</span>
              <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2 text-sm"><FiCalendar size={14} /> {scholarship.deadline}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Overview</h3>
            <RichDescription text={scholarship.description} />
          </div>

          {/* Apply Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setApplyModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition text-lg"
            >
              <FiSend size={18} /> Apply on JoblifyHQ
            </button>

            {hasWebsite && (
              <a
                href={scholarship.applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-semibold py-3 px-6 rounded-xl transition"
              >
                <FiExternalLink size={16} /> Apply on Website
              </a>
            )}

            {hasEmail && (
              <a
                href={`mailto:${scholarship.applyEmail}?subject=Application for ${encodeURIComponent(scholarship.title)}`}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-semibold py-3 px-6 rounded-xl transition"
              >
                <FiMail size={16} /> Apply via Email
              </a>
            )}
          </div>

          {hasWebsite && hasEmail && (
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
              You can apply through the website or send your application directly by email.
            </p>
          )}

          {/* Share */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <ShareButtons
              title={`${scholarship.title} — ${scholarship.org} | JoblifyHQ`}
              url={typeof window !== 'undefined' ? window.location.href : ''}
            />
          </div>

        </div>
      </div>

      {/* Related Scholarships Section */}
      {relatedScholarships.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Related Scholarships in <span className="text-primary-600">{scholarship.category}</span>
            </h2>
            <button
              onClick={() => router.push('/scholarships')}
              className="text-sm text-primary-600 hover:underline font-medium"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedScholarships.map(related => (
              <ScholarshipCard key={related.id} scholarship={related} />
            ))}
          </div>
        </div>
      )}

      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        opportunity={scholarship}
        type="scholarship"
      />
    </div>
  );
}
