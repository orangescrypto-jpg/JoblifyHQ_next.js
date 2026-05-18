'use client';
import type { FormEvent } from 'react';

import { useEffect, useState } from 'react';
import { FiSearch, FiFilter, FiZap, FiGlobe } from 'react-icons/fi';
import { getJobs } from '@/services/firebase/jobs';
import JobCard from '@/components/job/JobCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { JOB_CATEGORIES as CATEGORIES } from '@/constants';


function isGlobalRemote(job) {
  return (
    (job.location || '').toLowerCase().includes('remote') ||
    (job.type || '').toLowerCase().includes('remote') ||
    job.isRemote === true
  );
}

export default function GlobalRemoteJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    setLoading(true);
    getJobs({}, 300).then(({ jobs: allJobs }) => {
      let remote = allJobs.filter(isGlobalRemote);
      remote.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
      setJobs(remote);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: FormEvent) => e.preventDefault();

  const filtered = jobs.filter(job => {
    const matchCat = category === 'All' || (job.category || '').toLowerCase().includes(category.toLowerCase());
    const s = search.toLowerCase().trim();
    const matchSearch = !s ||
      (job.title || '').toLowerCase().includes(s) ||
      (job.company || '').toLowerCase().includes(s) ||
      (job.category || '').toLowerCase().includes(s);
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto">

      {/* Hero Banner */}
      <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-primary-600 to-purple-600 text-white p-8">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-sm font-medium mb-2">
              <FiGlobe size={14} /> Global Remote Jobs for African Talent
            </div>
            <h1 className="text-2xl md:text-3xl font-black mb-2 leading-tight">
              Get Hired by a US Company<br />from Lagos. 🚀
            </h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base">
              International companies actively hiring Nigerians, Ghanaians, Kenyans, and African talent — 100% remote, paid in dollars/euros.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 text-xs">
              {['🇺🇸 US Companies', '🇬🇧 UK Companies', '💰 Dollar Salaries', '🌍 Work from Africa', '📅 Flexible Hours'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/20 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
          <div className="text-6xl hidden md:block">🌍</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search role, skill, or company..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition">
            Search
          </button>
        </form>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${
                category === cat
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tips Banner */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start gap-3">
        <FiZap className="text-blue-500 mt-0.5 shrink-0" size={18} />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Pro Tip for African Applicants</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            Many international companies now accept applications from Nigeria, Ghana, Kenya & South Africa. Use a professional email, tailor your CV to the role, and mention your timezone compatibility (WAT/EAT is close to EU hours).
          </p>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">🌍</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No remote jobs found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Try a different category or check back soon.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {filtered.length} global remote role{filtered.length !== 1 ? 's' : ''} found
            {category !== 'All' ? ` in ${category}` : ''}
          </p>
          <div className="space-y-4">
            {filtered.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </>
      )}
    </div>
  );
}
