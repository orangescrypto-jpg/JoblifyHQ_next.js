'use client';
import type { FormEvent } from 'react';

import Link from 'next/link';
import { useState } from 'react';
import { FiMail, FiCheck } from 'react-icons/fi';
import { FaBriefcase } from 'react-icons/fa';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => { setSubscribed(false); setEmail(''); }, 3000);
    }
  };

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">

          {/* Brand */}
          <div className="md:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <div className="bg-primary-600 text-white p-2 rounded-lg">
                <FaBriefcase className="text-xl" />
              </div>
              Joblify<span className="text-primary-600">HQ</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Jobs, scholarships, and career insights in one modern platform built for Africa and beyond.
            </p>
            {/* Country flags */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['🇳🇬 Nigeria', '🇬🇭 Ghana', '🇰🇪 Kenya', '🇿🇦 S. Africa', '🇺🇬 Uganda'].map(c => (
                <span key={c} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">{c}</span>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Explore</h3>
            <ul className="space-y-3">
              <li><Link href="/jobs" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">Browse Jobs</Link></li>
              <li><Link href="/students" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">🎓 Student Hub</Link></li>
              <li><Link href="/scholarships" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">Scholarships</Link></li>
              <li><Link href="/blog" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">Career Blog</Link></li>
            </ul>
          </div>

          {/* Jobs by Type */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Job Types</h3>
            <ul className="space-y-3">
              <li><Link href="/jobs?type=Internship" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">Internships</Link></li>
              <li><Link href="/jobs?type=Remote" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">Remote Jobs</Link></li>
              <li><Link href="/jobs?type=Graduate Trainee" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">Graduate Trainee</Link></li>
              <li><Link href="/jobs?type=NYSC" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">NYSC Roles</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">Contact</Link></li>
              <li><Link href="/privacy-policy" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Newsletter — takes remaining space */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Get Updates</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Weekly jobs & scholarships straight to your inbox.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={subscribed}
                className={`w-full py-2.5 rounded-xl font-medium transition flex items-center justify-center gap-2 text-sm ${subscribed ? 'bg-green-500 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
              >
                {subscribed ? <><FiCheck /> Subscribed!</> : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} JoblifyHQ. All rights reserved. Built for Africa 🌍
          </p>
          <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/privacy-policy" className="hover:text-primary-600 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-primary-600 transition">Terms</Link>
            <Link href="/contact" className="hover:text-primary-600 transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
