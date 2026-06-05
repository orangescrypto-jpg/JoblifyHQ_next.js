'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GigsService } from '@/src/services/providers/firebase/gigs';
import { useAuth } from '@/context/AuthContext';
import type { Gig } from '@/types';
import { AFRICAN_COUNTRIES, JOB_CATEGORIES } from '@/constants';

const GIG_CATEGORIES = [
  'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
  'Digital Marketing', 'Content Writing', 'Video Editing', 'Data Analysis',
  'Cybersecurity', 'DevOps & Cloud', 'AI & Machine Learning', 'SEO',
  'Social Media', 'Translation', 'Accounting & Finance', 'Legal',
  'Photography', 'Voice Over', 'Virtual Assistant', 'Other',
];

const DURATION_OPTIONS = [
  'Less than 1 week', '1-2 weeks', '2-4 weeks', '1-2 months', '3-6 months', 'Ongoing',
];

function GigCard({ gig, onClick }: { gig: Gig; onClick: () => void }) {
  const budgetStr = gig.currency === 'NGN'
    ? `₦${gig.budgetMin.toLocaleString()} – ₦${gig.budgetMax.toLocaleString()}`
    : `$${gig.budgetMin} – $${gig.budgetMax}`;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 line-clamp-2">{gig.title}</h3>
        {gig.isFeatured && (
          <span className="shrink-0 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Featured</span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{gig.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {gig.skills.slice(0, 4).map(s => (
          <span key={s} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{s}</span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="font-semibold text-green-600">{budgetStr}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <span>📍 {gig.country}</span>
          {gig.isRemote && <span>🌍 Remote</span>}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
        <span>{gig.category}</span>
        <span>{gig.proposalCount || 0} proposals</span>
      </div>
    </div>
  );
}

export default function GigsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [gigs, setGigs]           = useState<Gig[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [country, setCountry]     = useState('');
  const [isRemote, setIsRemote]   = useState(false);
  const [budgetMax, setBudgetMax] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { gigs: data } = await GigsService.getGigs({
        search: search || undefined,
        category: category || undefined,
        country: country || undefined,
        isRemote: isRemote || undefined,
        budgetMax: budgetMax ? parseInt(budgetMax) : undefined,
      });
      setGigs(data);
    } finally { setLoading(false); }
  }, [search, category, country, isRemote, budgetMax]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Freelance Gig Marketplace</h1>
          <p className="text-blue-100 mb-6">Find skilled African freelancers. Pay securely with escrow.</p>
          {/* Search */}
          <div className="flex gap-2 max-w-2xl">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search gigs, skills..."
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button onClick={load} className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5 sticky top-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white">
                  <option value="">All Categories</option>
                  {GIG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)}
                  className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white">
                  <option value="">All Africa</option>
                  {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Max Budget (USD)</label>
                <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)}
                  placeholder="e.g. 500"
                  className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isRemote} onChange={e => setIsRemote(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Remote only</span>
              </label>
              <button onClick={() => { setSearch(''); setCategory(''); setCountry(''); setIsRemote(false); setBudgetMax(''); }}
                className="w-full text-sm text-blue-600 hover:underline">Clear filters</button>
            </div>
          </aside>

          {/* Gig list */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{gigs.length} gigs found</p>
              {(user?.role === 'employer' || user?.role === 'user') && (
                <button onClick={() => router.push('/client/post-gig')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  + Post a Gig
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : gigs.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-medium">No gigs found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {gigs.map(gig => (
                  <GigCard key={gig.id} gig={gig} onClick={() => router.push(`/gigs/${gig.id}`)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
