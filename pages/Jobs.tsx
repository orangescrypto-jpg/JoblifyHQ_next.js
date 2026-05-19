'use client';
import type { FormEvent } from 'react';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { getJobs } from '@/services/firebase/jobs';
import JobCard from '@/components/job/JobCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { JOB_TYPES, AFRICAN_COUNTRIES, JOB_CATEGORIES, isWithin7Days } from '@/constants';

export default function Jobs() {
  const searchParams = useSearchParams();
  const [allJobs, setAllJobs] = useState<any[]>([]); // raw from Firebase
  const [displayJobs, setDisplayJobs] = useState<any[]>([]); // filtered result
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams?.get('q') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams?.get('type') || '');
  const [countryFilter, setCountryFilter] = useState(searchParams?.get('country') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeHiringOnly, setActiveHiringOnly] = useState(false);
  const [globalRemoteOnly, setGlobalRemoteOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all jobs once from Firebase
  useEffect(() => {
    setLoading(true);
    getJobs({}, 500).then(result => {
      setAllJobs(result.jobs || []);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching jobs:', err);
      setLoading(false);
    });
  }, []);

  // Apply all filters in JS whenever filters or allJobs change
  useEffect(() => {
    let filtered = [...allJobs];

    if (typeFilter) {
      filtered = filtered.filter(j => j.type === typeFilter);
    }
    if (countryFilter) {
      filtered = filtered.filter(j =>
        (j.country || '').toLowerCase() === countryFilter.toLowerCase() ||
        (j.location || '').toLowerCase().includes(countryFilter.toLowerCase())
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter(j => j.category === categoryFilter);
    }
    if (activeHiringOnly) {
      filtered = filtered.filter(j => isWithin7Days(j.createdAt));
    }
    if (globalRemoteOnly) {
      filtered = filtered.filter(j =>
        j.type === 'Remote' || j.isRemote === true
      );
    }
    if (search.trim()) {
      const s = search.toLowerCase().trim();
      filtered = filtered.filter(j =>
        (j.title || '').toLowerCase().includes(s) ||
        (j.company || '').toLowerCase().includes(s) ||
        (j.description || '').toLowerCase().includes(s) ||
        (j.category || '').toLowerCase().includes(s)
      );
    }

    // Featured jobs float to top, rest stay newest first
    filtered.sort((a, b) => {
      if (b.isFeatured && !a.isFeatured) return 1;
      if (a.isFeatured && !b.isFeatured) return -1;
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    setDisplayJobs(filtered);
  }, [allJobs, typeFilter, countryFilter, categoryFilter, activeHiringOnly, globalRemoteOnly, search]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    // search state already updates displayJobs via the useEffect above
  };

  const clearFilters = () => {
    setTypeFilter('');
    setCountryFilter('');
    setCategoryFilter('');
    setSearch('');
    setActiveHiringOnly(false);
    setGlobalRemoteOnly(false);
  };

  const hasActiveFilters = typeFilter || countryFilter || categoryFilter || search || activeHiringOnly || globalRemoteOnly;

  const getResultMessage = () => {
    if (displayJobs.length === 0) return null;
    let msg = `${displayJobs.length} job${displayJobs.length !== 1 ? 's' : ''} found`;
    if (countryFilter) msg += ` in ${countryFilter}`;
    else msg += ' across Africa';
    if (typeFilter) msg += ` · ${typeFilter}`;
    if (categoryFilter) msg += ` · ${categoryFilter}`;
    if (activeHiringOnly) msg += ' · Actively Hiring';
    if (globalRemoteOnly) msg += ' · Remote';
    return msg;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Browse Jobs Across Africa</h1>
        <p className="text-gray-500 dark:text-gray-400">Find opportunities in Nigeria, Ghana, Kenya, South Africa and more</p>
      </div>

      {/* Quick filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button onClick={() => { setActiveHiringOnly(!activeHiringOnly); setGlobalRemoteOnly(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition shrink-0 ${activeHiringOnly ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400'}`}>
          <span className={`w-2 h-2 rounded-full ${activeHiringOnly ? 'bg-white animate-pulse' : 'bg-green-500'}`} />
          Actively Hiring
        </button>
        <button onClick={() => { setGlobalRemoteOnly(!globalRemoteOnly); setActiveHiringOnly(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition shrink-0 ${globalRemoteOnly ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'}`}>
          🌍 Global Remote
        </button>
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
              placeholder="Search job title, company or keyword..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition">
            Search
          </button>
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-600 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <FiFilter size={16} /> Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-600" />}
          </button>
        </form>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            {/* Country */}
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">🌍 All Countries</option>
              {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Job Type */}
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Types</option>
              <optgroup label="Professional">
                {['Full-time', 'Part-time', 'Remote', 'Contract'].map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
              <optgroup label="Students & Graduates">
                {['Internship', 'Entry-level', 'Graduate Trainee', 'NYSC', 'Volunteer'].map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
            </select>

            {/* Category */}
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Categories</option>
              {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:text-red-600 font-medium">
                <FiX size={14} /> Clear all
              </button>
            )}
          </div>
        )}

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activeHiringOnly && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium border border-green-200 dark:border-green-800">
                🟢 Actively Hiring
                <button onClick={() => setActiveHiringOnly(false)} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {globalRemoteOnly && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800">
                🌍 Remote Only
                <button onClick={() => setGlobalRemoteOnly(false)} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {countryFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                🌍 {countryFilter}
                <button onClick={() => setCountryFilter('')} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                {typeFilter}
                <button onClick={() => setTypeFilter('')} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {categoryFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                {categoryFilter}
                <button onClick={() => setCategoryFilter('')} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                🔍 "{search}"
                <button onClick={() => setSearch('')} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : displayJobs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No jobs found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
            {hasActiveFilters
              ? `No jobs match your current filters. Try removing some filters or searching something else.`
              : 'No jobs available right now. Check back soon!'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition text-sm">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{getResultMessage()}</p>
          <div className="space-y-4">
            {displayJobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </>
      )}
    </div>
  );
}
