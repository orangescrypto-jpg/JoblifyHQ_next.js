'use client';
import type { ReactNode } from 'react';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiBriefcase, FiList, FiUsers, FiLogOut, FiPlus, FiZap } from 'react-icons/fi';

interface EmployerLayoutProps {
  children?: ReactNode;
}

export default function EmployerLayout({ children }: EmployerLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPremium = user?.employerTier && user.employerTier !== 'basic';

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navItems = [
    { path: '/employer',              label: 'Overview',     icon: <FiBriefcase size={20} /> },
    { path: '/employer/post-job',     label: 'Post Job',     icon: <FiPlus size={20} /> },
    { path: '/employer/listings',     label: 'Listings',     icon: <FiList size={20} /> },
    { path: '/employer/applications', label: 'Applications', icon: <FiUsers size={20} /> },
    { path: '/employer/premium',      label: 'Premium',      icon: <FiZap size={20} />, highlight: !isPremium },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Employer Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold text-primary-600">
              Joblify<span className="text-gray-900 dark:text-white">HQ</span>
            </Link>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full">
              Employer Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isPremium ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full font-semibold border border-primary-200 dark:border-primary-700">
                <FiZap size={11} /> Premium
              </span>
            ) : (
              <Link
                href="/employer/premium"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                <FiZap size={11} /> Upgrade
              </Link>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
              {user?.company || user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 transition"
            >
              <FiLogOut /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">

        {/* Sidebar — desktop only */}
        <aside className="w-64 hidden lg:block">
          <nav className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sticky top-24">
            <ul className="space-y-1">
              {navItems.map(item => {
                const isActive = pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : item.highlight
                          ? 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {item.highlight && (
                        <span className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-full font-bold">
                          NEW
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Quick Stats</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Active Jobs</span>
                  <span className="font-semibold text-gray-900 dark:text-white">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Applications</span>
                  <span className="font-semibold text-gray-900 dark:text-white">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Promoted</span>
                  <span className="font-semibold text-primary-600">1</span>
                </div>
              </div>
            </div>

            {/* Premium upsell in sidebar */}
            {!isPremium && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl p-4 text-white text-center">
                  <FiZap size={20} className="mx-auto mb-2" />
                  <p className="text-xs font-bold mb-1">Get 3× More Applicants</p>
                  <p className="text-xs text-primary-100 mb-3">
                    Feature your listings and unlock the full hiring pipeline.
                  </p>
                  <Link
                    href="/employer/premium"
                    className="block bg-white text-primary-700 text-xs font-bold py-2 px-3 rounded-lg hover:bg-primary-50 transition"
                  >
                    See Premium Plans →
                  </Link>
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(item => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition min-w-0 flex-1 ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : item.highlight
                    ? 'text-primary-500 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <div className="relative">
                  {item.highlight && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-600 rounded-full" />
                  )}
                  {item.icon}
                </div>
                <span className="text-xs font-medium truncate w-full text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
