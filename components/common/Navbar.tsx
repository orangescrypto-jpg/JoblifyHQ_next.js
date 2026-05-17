'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [jobsDropdown, setJobsDropdown] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setJobsDropdown(false);
  }, [pathname]);

  const handleLogout = () => { logout(); router.push('/'); };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Jobs dropdown */}
      <div className={`relative ${mobile ? 'w-full' : ''}`}>
        <button
          onClick={() => setJobsDropdown(!jobsDropdown)}
          className={`flex items-center gap-1 px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg md:hover:bg-transparent transition ${mobile ? 'w-full' : ''}`}
        >
          Jobs <FiChevronDown size={14} className={`transition-transform ${jobsDropdown ? 'rotate-180' : ''}`} />
        </button>
        {jobsDropdown && (
          <div className={`${mobile ? 'relative w-full pl-4 mt-1' : 'absolute top-full left-0 mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg'} py-1 z-50`}>
            <Link href="/jobs" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              🌍 All Jobs
            </Link>
            <Link href="/students" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              🎓 Student Hub
            </Link>
            <Link href="/jobs?type=Internship" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              📋 Internships
            </Link>
            <Link href="/remote-jobs" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              🌐 Global Remote
            </Link>
            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
            <Link href="/jobs" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              🏢 Companies
            </Link>
          </div>
        )}
      </div>

      <Link
        href="/scholarships"
        className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg md:hover:bg-transparent transition"
      >
        Scholarships
      </Link>
      <Link
        href="/blog"
        className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg md:hover:bg-transparent transition"
      >
        Blog
      </Link>
    </>
  );

  const AuthButtons = () => (
    user ? (
      <>
        <Link
          href={user.role === 'employer' ? '/employer' : '/dashboard'}
          className="btn-secondary text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          Dashboard
        </Link>
        {user.role === 'admin' && (
          <Link href="/admin" className="btn-primary text-sm">Admin</Link>
        )}
        <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">
          Logout
        </button>
      </>
    ) : (
      <>
        <Link
          href="/login"
          className="btn-secondary text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          Login
        </Link>
        <Link href="/signup" className="btn-primary text-sm">Sign Up</Link>
      </>
    )
  );

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
            JoblifyHQ
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLinks />
            <DarkModeToggle />
            <div className="flex items-center space-x-3 ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
              <AuthButtons />
            </div>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <DarkModeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-600 dark:text-gray-300"
            >
              {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-4 px-4 transition-all">
          <div className="pt-2 space-y-1">
            <NavLinks mobile />
            <div className="pt-4 space-y-3 flex flex-col border-t border-gray-100 dark:border-gray-800 mt-2">
              <AuthButtons />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
