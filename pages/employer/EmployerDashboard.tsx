'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getEmployerJobs } from '@/services/firebase/jobs';
import { getEmployerScholarships } from '@/services/firebase/scholarships';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiPlus, FiTrendingUp, FiUsers, FiClock, FiBriefcase, FiAward, FiEdit2, FiEye, FiZap } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ totalViews: 0, totalApplications: 0, activeListings: 0 });
  const [listings, setListings] = useState<any[]>([]);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchDashboardData = async () => {
      try {
        const [jobs, scholarships] = await Promise.all([
          getEmployerJobs(user.uid),
          getEmployerScholarships(user.uid)
        ]);

        const totalViews = jobs.reduce((sum: number, j: any) => sum + (j.views || 0), 0) +
                           scholarships.reduce((sum: number, s: any) => sum + (s.views || 0), 0);
        const totalApplications = jobs.reduce((sum: number, j: any) => sum + (j.applications || 0), 0) +
                                  scholarships.reduce((sum: number, s: any) => sum + (s.applications || 0), 0);

        setStats({ totalViews, totalApplications, activeListings: jobs.length + scholarships.length });

        // Combine and tag listings, show latest 5
        const jobsTagged = jobs.map(j => ({ ...j, listingType: 'job' }));
        const scholsTagged = scholarships.map(s => ({ ...s, listingType: 'scholarship' }));
        const all = [...jobsTagged, ...scholsTagged].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setListings(all.slice(0, 5));

        // Fetch recent applications
        const allIds = [...jobs.map(j => j.id), ...scholarships.map(s => s.id)];
        if (allIds.length === 0) { setRecentApps([]); return; }

        const appsQuery = query(
          collection(db, 'applications'),
          where('opportunityId', 'in', allIds.slice(0, 10))
        );
        const appsSnap = await getDocs(appsQuery);
        const appsData = appsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by appliedAt descending
        appsData.sort((a, b) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0));
        setRecentApps(appsData.slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user?.company || user?.name} 👋</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your job postings and review applicants.</p>
        </div>
        <Link href="/employer/post-job" className="btn-primary flex items-center gap-2 w-fit">
          <FiPlus /> Post a New Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalViews}</p>
            </div>
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600"><FiTrendingUp /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Applications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalApplications}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600"><FiUsers /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.activeListings}</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600"><FiClock /></div>
          </div>
        </div>
      </div>

      {/* My Listings Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Listings</h2>
          <Link href="/employer/listings" className="text-sm text-primary-600 hover:underline">Manage All →</Link>
        </div>

        {listings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No listings yet. Post your first job or scholarship!</p>
            <Link href="/employer/post-job" className="btn-primary inline-flex items-center gap-2">
              <FiPlus /> Post Now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {listings.map(listing => (
              <div key={listing.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${listing.listingType === 'job' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'}`}>
                    {listing.listingType === 'job' ? <FiBriefcase size={16} /> : <FiAward size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{listing.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {listing.listingType === 'job' ? listing.company : listing.org} •
                      <span className="ml-1"><FiEye size={10} className="inline" /> {listing.views || 0} views</span>
                      {listing.isFeatured && <span className="ml-2 text-amber-500 font-semibold">⚡ Featured</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    Deadline: {listing.deadline || 'N/A'}
                  </span>
                  <button
                    onClick={() => router.push('/employer/listings')}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"
                    title="Edit"
                  >
                    <FiEdit2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {listings.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-center">
            <Link href="/employer/listings" className="text-sm text-primary-600 hover:underline font-medium">
              View & manage all {stats.activeListings} listing{stats.activeListings !== 1 ? 's' : ''} →
            </Link>
          </div>
        )}
      </div>

      {/* Recent Applications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Applications</h2>
          <Link href="/employer/applications" className="text-sm text-primary-600 hover:underline">View All →</Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentApps.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No applications yet. Post a job to start receiving applications!
            </div>
          ) : (
            recentApps.map(app => (
              <div key={app.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{app.userName || 'Anonymous'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Applied for: {app.title}</p>
                  {app.userEmail && <p className="text-xs text-gray-400 mt-0.5">{app.userEmail}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">
                    {app.appliedAt?.toDate
                      ? app.appliedAt.toDate().toLocaleDateString()
                      : 'Recently'}
                  </span>
                  <Link href="/employer/applications" className="text-sm text-primary-600 hover:underline">Review</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Premium CTA */}
      <div className="bg-gradient-to-br from-primary-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiZap size={18} />
              <h3 className="text-lg font-bold">Upgrade to Employer Premium</h3>
            </div>
            <p className="text-primary-100 text-sm">
              Get featured listings, full applicant pipeline, analytics dashboard and a verified employer badge.
            </p>
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              {['⚡ Featured Listings', '📊 Analytics', '✅ Verified Badge', '🔍 Candidate Search'].map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-white/20 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
          <Link
            href="/employer/premium"
            className="bg-white text-primary-700 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition whitespace-nowrap self-start sm:self-center shrink-0"
          >
            See Plans →
          </Link>
        </div>
      </div>
    </div>
  );
}
