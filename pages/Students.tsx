'use client';
import type { FormEvent } from 'react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiFilter, FiAward } from 'react-icons/fi';
import { getJobs } from '@/services/firebase/jobs';
import JobCard from '@/components/job/JobCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { AFRICAN_COUNTRIES, JOB_CATEGORIES as CATEGORIES } from '@/constants';

const STUDENT_LEVELS = [
  { key: '', label: '🎓 All Student Roles' },
  { key: 'Internship', label: '📋 Internships' },
  { key: 'NYSC', label: '🇳🇬 NYSC-Friendly' },
  { key: 'Entry-level', label: '🚀 Entry Level' },
  { key: 'Graduate Trainee', label: '🎯 Graduate Trainee' },
  { key: 'Volunteer', label: '🤝 Volunteer' },
];



export default function Students() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [lastDoc, setLastDoc] = useState<null | import('firebase/firestore').QueryDocumentSnapshot>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const STUDENT_TYPES = ['Internship', 'Entry-level', 'Graduate Trainee', 'NYSC', 'Volunteer'];

  const fetchJobs = async (reset = false) => {
    try {
      const filters: Record<string,unknown> = {};
      if (levelFilter) filters.type = levelFilter;
      if (countryFilter) filters.country = countryFilter;
      if (categoryFilter) filters.category = categoryFilter;
      if (search) filters.search = search;

      // Fetch more than needed so we can filter client-side for student roles
      const result = await getJobs(filters, 50, reset ? null : lastDoc);

      let filtered = (result.jobs || []).filter(job => {
        const type = (job.type || '').toLowerCase();
        const title = (job.title || '').toLowerCase();
        const isStudentRole =
          STUDENT_TYPES.some(t => type.includes(t.toLowerCase())) ||
          title.includes('intern') ||
          title.includes('trainee') ||
          title.includes('graduate') ||
          title.includes('nysc') ||
          title.includes('entry') ||
          title.includes('junior') ||
          title.includes('volunteer');
        return isStudentRole;
      });

      // Featured first
      filtered = filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

      if (reset) {
        setJobs(filtered);
      } else {
        setJobs(prev => [...prev, ...filtered]);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error fetching student jobs:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchJobs(true);
  }, [levelFilter, countryFilter, categoryFilter]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchJobs(true);
  };

  const clearFilters = () => {
    setLevelFilter('');
    setCountryFilter('');
    setCategoryFilter('');
    setSearch('');
  };

  return (
    <div className="max-w-5xl mx-auto">

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <FiAward size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Student & Graduate Hub 🎓</h1>
            <p className="text-primary-100 text-sm md:text-base max-w-xl">
              Internships, NYSC-friendly roles, graduate trainee programmes and entry-level jobs across Africa — built for students and fresh graduates.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {STUDENT_LEVELS.slice(1).map(l => (
                <button
                  key={l.key}
                  onClick={() => setLevelFilter(levelFilter === l.key ? '' : l.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    levelFilter === l.key
                      ? 'bg-white text-primary-700 border-white'
                      : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3 mb-3">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search internships, trainee roles..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <FiFilter size={16} /> Filters
          </button>
        </form>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">🌍 All Countries</option>
              {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {(levelFilter || countryFilter || categoryFilter || search) && (
              <button onClick={clearFilters} className="px-3 py-2 text-sm text-red-500 hover:text-red-600 font-medium">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Active filter pills */}
        {(levelFilter || countryFilter) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {levelFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                {STUDENT_LEVELS.find(l => l.key === levelFilter)?.label || levelFilter}
                <button onClick={() => setLevelFilter('')} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {countryFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                🌍 {countryFilter}
                <button onClick={() => setCountryFilter('')} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No student roles found"
          message="Try clearing your filters or check back later for new opportunities."
        />
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {jobs.length} opportunit{jobs.length !== 1 ? 'ies' : 'y'} for students & graduates
          </p>
          <div className="space-y-4">
            {jobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => { setLoadingMore(true); fetchJobs(false); }}
                disabled={loadingMore}
                className="btn-secondary px-8 py-3"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
