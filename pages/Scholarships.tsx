'use client';
import { useEffect, useState } from 'react';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { getScholarships } from '@/services/firebase/scholarships';
import ScholarshipCard from '@/components/scholarship/ScholarshipCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { AFRICAN_COUNTRIES, JOB_CATEGORIES as CATEGORIES } from '@/constants';

const FUNDING_TYPES = ['Full Funding', 'Partial Funding', 'Grant', 'Tuition Waiver'];


const HOST_COUNTRIES = [
  'UK', 'USA', 'Canada', 'Australia', 'Germany', 'France', 'China',
  'Netherlands', 'Sweden', 'Norway', 'Japan', 'South Korea', 'Worldwide'
];


export default function Scholarships() {
  const [allScholarships, setAllScholarships] = useState<any[]>([]);
  const [displayScholarships, setDisplayScholarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fundingFilter, setFundingFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all scholarships once
  useEffect(() => {
    setLoading(true);
    getScholarships({}).then(result => {
      setAllScholarships(result || []);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching scholarships:', err);
      setLoading(false);
    });
  }, []);

  // Apply all filters in JS
  useEffect(() => {
    let filtered = [...allScholarships];

    if (fundingFilter) {
      filtered = filtered.filter(s =>
        (s.funding || s.type || '').toLowerCase() === fundingFilter.toLowerCase()
      );
    }
    if (countryFilter) {
      filtered = filtered.filter(s =>
        (s.country || '').toLowerCase() === countryFilter.toLowerCase()
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase().trim();
      filtered = filtered.filter(sch =>
        (sch.title || '').toLowerCase().includes(s) ||
        (sch.org || '').toLowerCase().includes(s) ||
        (sch.description || '').toLowerCase().includes(s)
      );
    }

    // Featured float to top
    filtered.sort((a, b) => {
      if (b.isFeatured && !a.isFeatured) return 1;
      if (a.isFeatured && !b.isFeatured) return -1;
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    setDisplayScholarships(filtered);
  }, [allScholarships, fundingFilter, countryFilter, categoryFilter, search]);

  const clearFilters = () => {
    setFundingFilter('');
    setCountryFilter('');
    setCategoryFilter('');
    setSearch('');
  };

  const hasActiveFilters = fundingFilter || countryFilter || categoryFilter || search;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Scholarships for Africans</h1>
        <p className="text-gray-500 dark:text-gray-400">Discover fully funded and partial scholarships open to African students worldwide</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6 shadow-sm">
        <form onSubmit={e => e.preventDefault()} className="flex gap-3 mb-3">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search scholarships, org, or keyword..."
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
            {/* Funding Type */}
            <select value={fundingFilter} onChange={e => setFundingFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Funding Types</option>
              {FUNDING_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            {/* Host Country */}
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">🌍 All Countries</option>
              <optgroup label="Study in Africa">
                {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Study Abroad">
                {HOST_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>

            {/* Category */}
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
            {countryFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                🌍 {countryFilter}
                <button onClick={() => setCountryFilter('')} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {fundingFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                💰 {fundingFilter}
                <button onClick={() => setFundingFilter('')} className="ml-1 hover:text-red-500">✕</button>
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
      ) : displayScholarships.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">🎓</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No scholarships found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
            {hasActiveFilters
              ? 'No scholarships match your current filters. Try removing some filters.'
              : 'No scholarships available right now. Check back soon!'}
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {displayScholarships.length} scholarship{displayScholarships.length !== 1 ? 's' : ''} found
            {countryFilter ? ` in ${countryFilter}` : ''}
            {fundingFilter ? ` · ${fundingFilter}` : ''}
            {categoryFilter ? ` · ${categoryFilter}` : ''}
          </p>
          <div className="space-y-4">
            {displayScholarships.map(s => <ScholarshipCard key={s.id} scholarship={s} />)}
          </div>
        </>
      )}
    </div>
  );
}
