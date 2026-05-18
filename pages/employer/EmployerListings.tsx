'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiEdit2, FiTrash2, FiStar, FiEye, FiUsers,
  FiBriefcase, FiAward, FiPlus
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { getEmployerJobs, deleteJob, updateJob } from '@/services/firebase/jobs';
import { getEmployerScholarships, deleteScholarship, updateScholarship } from '@/services/firebase/scholarships';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import AdminFormModal from '@/components/admin/AdminFormModal';
import { COUNTRY_FLAGS } from '@/constants';


function getFlag(country = '') {
  for (const [name, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (country.toLowerCase().includes(name.toLowerCase())) return flag;
  }
  return '🌍';
}

export default function EmployerListings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({ open: false, item: null, type: '' });
  const [promoteModal, setPromoteModal] = useState({ open: false, listing: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, listing: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchListings = async () => {
    if (!user!.uid) return;
    setLoading(true);
    try {
      const [jobs, scholarships] = await Promise.all([
        getEmployerJobs(user!.uid),
        getEmployerScholarships(user!.uid)
      ]);
      const jobsTagged = (jobs || []).map(j => ({ ...j, listingType: 'job' }));
      const scholsTagged = (scholarships || []).map(s => ({ ...s, listingType: 'scholarship' }));
      setListings([...jobsTagged, ...scholsTagged]);
    } catch (err) {
      console.error('Error fetching listings:', err);
      showToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, [user?.uid]);

  const filteredListings = activeTab === 'all'
    ? listings
    : listings.filter(l => l.listingType === activeTab);

  // Edit
  const handleEdit = (listing) => {
    setEditModal({ open: true, item: listing, type: listing.listingType });
  };

  const handleEditSubmit = async (formData) => {
    const { id: _id, type: _type, listingType, ...cleanData } = formData;
    try {
      if (editModal.type === 'job') {
        await updateJob(editModal.item.id, cleanData);
      } else {
        await updateScholarship(editModal.item.id, cleanData, user!.uid);
      }
      showToast('Listing updated successfully!');
      setEditModal({ open: false, item: null, type: '' });
      fetchListings();
    } catch (err) {
      showToast('Failed to update listing', 'error');
    }
  };

  // Boost
  const handlePromote = (listing) => setPromoteModal({ open: true, listing });

  const confirmPromote = async () => {
    const { listing } = promoteModal;
    setActionLoading(true);
    try {
      const colName = listing.listingType === 'job' ? 'jobs' : 'scholarships';
      await updateDoc(doc(db, colName, listing.id), {
        isFeatured: !listing.isFeatured,
        updatedAt: Timestamp.now()
      });
      showToast(listing.isFeatured ? 'Removed from featured' : '⚡ Listing is now featured!');
      setPromoteModal({ open: false, listing: null });
      fetchListings();
    } catch (err) {
      showToast('Failed to update featured status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete
  const handleDelete = (listing) => setDeleteModal({ open: true, listing });

  const confirmDelete = async () => {
    const { listing } = deleteModal;
    setActionLoading(true);
    try {
      if (listing.listingType === 'job') {
        await deleteJob(listing.id);
      } else {
        await deleteScholarship(listing.id, user!.uid);
      }
      showToast('Listing deleted');
      setDeleteModal({ open: false, listing: null });
      fetchListings();
    } catch (err) {
      showToast('Failed to delete listing', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium transition ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Listings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your jobs and scholarships across Africa</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {[
              { key: 'all', label: 'All' },
              { key: 'job', label: 'Jobs', icon: FiBriefcase },
              { key: 'scholarship', label: 'Scholarships', icon: FiAward },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition flex items-center gap-1 ${activeTab === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>
                {Icon && <Icon size={13} />} {label}
              </button>
            ))}
          </div>
          <Link href="/employer/post-job" className="btn-primary flex items-center gap-2 text-sm">
            <FiPlus /> Post New
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Listings', value: listings.length, color: 'text-gray-900 dark:text-white' },
          { label: 'Total Views', value: listings.reduce((sum: number, l: any) => sum + (l.views || 0), 0), color: 'text-blue-600' },
          { label: 'Total Applications', value: listings.reduce((sum: number, l: any) => sum + (l.applications || 0), 0), color: 'text-primary-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No listings yet.</p>
          <Link href="/employer/post-job" className="btn-primary inline-flex items-center gap-2">
            <FiPlus /> Post Your First Listing
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-medium">
              <tr>
                <th className="px-5 py-4">Listing</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Country</th>
                <th className="px-5 py-4 text-center">Views</th>
                <th className="px-5 py-4 text-center">Applications</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredListings.map(listing => (
                <tr key={listing.id}
                  className={`bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${listing.isFeatured ? 'border-l-4 border-yellow-400' : ''}`}>

                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{listing.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {listing.listingType === 'job' ? listing.company : listing.org} • Deadline: {listing.deadline || 'N/A'}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${listing.listingType === 'job' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {listing.listingType === 'job' ? <FiBriefcase size={12} /> : <FiAward size={12} />}
                      {listing.listingType === 'job' ? (listing.type || 'Job') : 'Scholarship'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-gray-600 dark:text-gray-400 text-sm">
                    {getFlag(listing.country || listing.location)} {listing.country || listing.location || '—'}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
                      <FiEye size={14} /> {listing.views || 0}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="flex items-center justify-center gap-1 text-primary-600 font-medium">
                      <FiUsers size={14} /> {listing.applications || 0}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    {listing.isFeatured ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-medium">
                        ⚡ Featured
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Standard</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit */}
                      <button onClick={() => handleEdit(listing)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"
                        title="Edit Listing">
                        <FiEdit2 size={15} />
                      </button>
                      {/* Boost toggle */}
                      <button onClick={() => handlePromote(listing)}
                        className={`p-2 rounded-lg transition ${listing.isFeatured ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                        title={listing.isFeatured ? 'Remove Featured' : 'Boost Listing'}>
                        <FiStar size={15} />
                      </button>
                      {/* Delete */}
                      <button onClick={() => handleDelete(listing)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Delete">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal — reuses AdminFormModal */}
      <AdminFormModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, item: null, type: '' })}
        type={editModal.type}
        initialData={editModal.item}
        onSubmit={handleEditSubmit}
      />

      {/* Promote Modal */}
      {promoteModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {promoteModal.listing?.isFeatured ? '⚡ Remove Featured?' : '⚡ Boost This Listing?'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {promoteModal.listing?.isFeatured
                ? `"${promoteModal.listing?.title}" will no longer appear as featured.`
                : `"${promoteModal.listing?.title}" will appear at the top of results and on the homepage across Africa.`}
            </p>
            {!promoteModal.listing?.isFeatured && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                  <span className="font-medium text-gray-900 dark:text-white">14 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
                  <span className="text-xl font-bold text-primary-600">$5</span>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPromoteModal({ open: false, listing: null })} className="btn-secondary">Cancel</button>
              <button onClick={confirmPromote} disabled={actionLoading}
                className={`px-4 py-2 rounded-lg font-medium text-white transition disabled:opacity-50 ${promoteModal.listing?.isFeatured ? 'bg-gray-500 hover:bg-gray-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                {actionLoading ? 'Updating...' : promoteModal.listing?.isFeatured ? 'Remove Featured' : 'Boost for $5'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete this listing?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              "<span className="font-medium text-gray-700 dark:text-gray-300">{deleteModal.listing?.title}</span>" will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteModal({ open: false, listing: null })} className="btn-secondary">Cancel</button>
              <button onClick={confirmDelete} disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
