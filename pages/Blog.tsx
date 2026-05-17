'use client';
import { useEffect, useState } from 'react';
import { getBlogs } from '@/services/firebase/blog';
import BlogCard from '@/components/blog/BlogCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { FiSearch } from 'react-icons/fi';

export default function Blog() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    getBlogs()
      .then(posts => setData(posts || []))
      .catch(err => console.error('Error fetching blogs:', err))
      .finally(() => setLoading(false));
  }, []);

  // Get unique categories from posts
  const categories = ['All', ...new Set(data.map(p => p.category).filter(Boolean))];

  const filtered = data.filter(p => {
    const matchesSearch =
      String(p.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      String(p.excerpt ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Career & Education Blog</h1>
        <p className="text-gray-500 dark:text-gray-400">Insights, tips and opportunities for African professionals</p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Category filters */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                (cat === 'All' && !category) || cat === category
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No articles found" message="Try a different keyword or category." />
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(b => <BlogCard key={b.id} post={b} />)}
          </div>
        </>
      )}
    </div>
  );
}
