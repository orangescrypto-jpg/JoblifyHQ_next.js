'use client';
import type { FormEvent } from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiSearch, FiArrowRight } from 'react-icons/fi';

const AFRICAN_COUNTRIES = [
  'All Countries', 'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Uganda',
  'Tanzania', 'Ethiopia', 'Rwanda', 'Senegal', 'Côte d\'Ivoire', 'Cameroon',
  'Zimbabwe', 'Zambia', 'Botswana', 'Namibia', 'Egypt', 'Morocco', 'Tunisia'
];

export default function Hero() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('All Countries');
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (country !== 'All Countries') params.set('country', country);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <section className="relative bg-white dark:bg-gray-900 pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 mb-8 animate-fade-in-up">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">🌍 Now covering Nigeria, Ghana, Kenya, South Africa & more</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-[1.1]">
          Africa's #1 platform for <br className="hidden md:block" />
          <span className="text-primary-600">jobs</span> &amp; <span className="text-primary-600">scholarships</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-4 max-w-2xl mx-auto leading-relaxed">
          JoblifyHQ curates verified opportunities across Africa — from Lagos to Nairobi, Accra to Johannesburg.
        </p>

        {/* Country flags row */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 text-sm">
          {['🇳🇬 Nigeria', '🇬🇭 Ghana', '🇰🇪 Kenya', '🇿🇦 South Africa', '🇺🇬 Uganda', '🇷🇼 Rwanda'].map(c => (
            <span key={c} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 text-xs font-medium">{c}</span>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 shadow-sm hover:shadow-md transition">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search jobs, scholarships, or topics..."
                className="w-full pl-9 pr-3 py-2.5 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 whitespace-nowrap">
              Search <FiArrowRight />
            </button>
          </div>
        </form>

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          <span>Popular:</span>
          <Link href="/jobs?country=Nigeria" className="hover:text-primary-600 underline decoration-2 decoration-primary-200 underline-offset-4">🇳🇬 Nigeria Jobs</Link>
          <Link href="/jobs?country=Ghana" className="hover:text-primary-600 underline decoration-2 decoration-primary-200 underline-offset-4">🇬🇭 Ghana Jobs</Link>
          <Link href="/jobs?country=Kenya" className="hover:text-primary-600 underline decoration-2 decoration-primary-200 underline-offset-4">🇰🇪 Kenya Jobs</Link>
          <Link href="/scholarships" className="hover:text-primary-600 underline decoration-2 decoration-primary-200 underline-offset-4">Scholarships</Link>
        </div>
      </div>
    </section>
  );
}
