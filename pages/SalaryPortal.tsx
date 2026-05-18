'use client';
import { useEffect, useState } from 'react';
import { FiDollarSign, FiMapPin, FiBriefcase, FiTrendingUp, FiSearch } from 'react-icons/fi';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  AFRICAN_COUNTRIES, COUNTRY_FLAGS, CURRENCY_BY_COUNTRY,
  CITIES_BY_COUNTRY, EXPERIENCE_LEVELS, EXP_COLORS,
} from '@/constants';


export default function SalaryPortal() {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [expFilter, setExpFilter] = useState('');

  // No orderBy — sort in JS to avoid needing a Firestore composite index
  useEffect(() => {
    getDocs(collection(db, 'salary_data'))
      .then(snap => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setSalaries(rows);
      })
      .catch(() => setSalaries([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCountryChange = (c) => {
    setCountryFilter(c);
    setCityFilter('');
  };

  const availableCities = countryFilter ? ((CITIES_BY_COUNTRY as Record<string, string[]>)[countryFilter] || []) : [];

  const filtered = salaries.filter(s => {
    const searchMatch = !search ||
      s.role?.toLowerCase().includes(search.toLowerCase()) ||
      s.industry?.toLowerCase().includes(search.toLowerCase());
    const countryMatch = !countryFilter || s.country === countryFilter;
    const cityMatch = !cityFilter || s.city === cityFilter;
    const expMatch = !expFilter || s.experience === expFilter;
    return searchMatch && countryMatch && cityMatch && expMatch;
  });

  const formatSalary = (min, max, country) => {
    const currency = (CURRENCY_BY_COUNTRY as Record<string,any>)[country] || { symbol: '₦', name: 'NGN' };
    const fmt = (n) => {
      if (!n) return null;
      if (n >= 1000000) return `${currency.symbol}${(n / 1000000).toFixed(1)}M`;
      return `${currency.symbol}${(n / 1000).toFixed(0)}k`;
    };
    const fMin = fmt(min);
    const fMax = fmt(max);
    if (!fMin && !fMax) return 'N/A';
    if (!fMax) return `${fMin}/mo`;
    return `${fMin} – ${fMax}/mo`;
  };

  const uniqueCountries = [...new Set(salaries.map(s => s.country).filter(Boolean))];
  const uniqueIndustries = [...new Set(salaries.map(s => s.industry).filter(Boolean))];
  const hasActiveFilters = search || countryFilter || cityFilter || expFilter;

  return (
    <div className="max-w-5xl mx-auto">

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
            <FiDollarSign size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">African Salary Guide</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Real salary ranges across Africa — free to view</p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
          Salary data by role, city, and experience level across Nigeria, Ghana, Kenya, South Africa and more.
          Curated and verified by the JoblifyHQ team. No account needed.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{loading ? '—' : salaries.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Salary Records</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{loading ? '—' : uniqueCountries.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Countries</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{loading ? '—' : uniqueIndustries.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Industries</p>
        </div>
      </div>

      {/* Country quick-select pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => handleCountryChange('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${!countryFilter ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'}`}
        >
          🌍 All Africa
        </button>
        {AFRICAN_COUNTRIES.map(c => (
          <button
            key={c}
            onClick={() => handleCountryChange(countryFilter === c ? '' : c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${countryFilter === c ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'}`}
          >
            {(COUNTRY_FLAGS as Record<string, string>)[c] || '🌍'} {c}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search role or industry..."
              className="pl-9 w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {countryFilter && availableCities.length > 0 && (
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Cities</option>
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <select
            value={expFilter}
            onChange={e => setExpFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Experience</option>
            {EXPERIENCE_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setCountryFilter(''); setCityFilter(''); setExpFilter(''); }}
              className="px-3 py-2 text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {countryFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                {(COUNTRY_FLAGS as Record<string, string>)[countryFilter] || '🌍'} {countryFilter}
                <button onClick={() => handleCountryChange('')} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {cityFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                <FiMapPin size={10} /> {cityFilter}
                <button onClick={() => setCityFilter('')} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {expFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                {expFilter}
                <button onClick={() => setExpFilter('')} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <FiDollarSign size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium mb-1">No salary data found</p>
          <p className="text-sm">
            {hasActiveFilters
              ? 'Try adjusting your filters — no records match your current selection.'
              : "We're adding new data regularly. Check back soon!"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setCountryFilter(''); setCityFilter(''); setExpFilter(''); }}
              className="mt-4 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} salary record{filtered.length !== 1 ? 's' : ''} found
            {countryFilter ? ` in ${countryFilter}` : ' across Africa'}
          </p>

          {filtered.map(s => (
            <div key={s.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 flex-shrink-0">
                    <FiBriefcase size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{s.role}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {s.country && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          {(COUNTRY_FLAGS as Record<string, string>)[s.country] || '🌍'} {s.country}
                        </span>
                      )}
                      {s.city && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FiMapPin size={12} /> {s.city}
                        </span>
                      )}
                      {s.industry && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                          {s.industry}
                        </span>
                      )}
                      {s.experience && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(EXP_COLORS as Record<string,string>)[s.experience] || 'bg-gray-100 text-gray-600'}`}>
                          {s.experience}
                        </span>
                      )}
                    </div>
                    {s.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{s.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-primary-600">
                    {formatSalary(s.salaryMin, s.salaryMax, s.country)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center sm:justify-end gap-1">
                    <FiTrendingUp size={11} />
                    {s.dataPoints || 1} data point{(s.dataPoints || 1) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-10 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          💡 Salary data is curated by the JoblifyHQ team. Figures are estimates based on market research and may vary by company size and negotiation.
        </p>
      </div>
    </div>
  );
}
