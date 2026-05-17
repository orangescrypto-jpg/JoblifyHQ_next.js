'use client';
import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import {
  FiPlus, FiBriefcase, FiAward, FiFileText, FiEdit2, FiTrash2,
  FiEye, FiUsers, FiTrendingUp, FiMail, FiPhone, FiX, FiRefreshCw,
  FiDollarSign, FiMapPin
} from 'react-icons/fi';
import AdminFormModal from '@/components/admin/AdminFormModal';
import { getJobs, createJob, updateJob, deleteJob } from '@/services/firebase/jobs';
import { getScholarships, createScholarship, updateScholarship, deleteScholarship } from '@/services/firebase/scholarships';
import { getDocs, collection, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/context/AuthContext';
import { AFRICAN_COUNTRIES, CITIES_BY_COUNTRY, EXPERIENCE_LEVELS, COUNTRY_FLAGS } from '@/constants';

const TABS = [
  { key: 'job',         label: 'Jobs',         icon: FiBriefcase  },
  { key: 'scholarship', label: 'Scholarships',  icon: FiAward      },
  { key: 'blog',        label: 'Blog Posts',    icon: FiFileText   },
  { key: 'applications',label: 'Applications',  icon: FiUsers      },
  { key: 'salaries',    label: 'Salary Data',   icon: FiDollarSign },
];

const APP_STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  New:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Viewed:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Contacted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Interview: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Rejected:  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const EMPTY_SALARY = {
  role: '', country: '', city: '', industry: '',
  experience: '', salaryMin: '', salaryMax: '', notes: '',
};

function getFlag(location = ''): string {
  for (const [name, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (location.toLowerCase().includes(name.toLowerCase())) return flag;
  }
  return '🌍';
}

// ── Salary inline modal ──────────────────────────────────────────────────────
interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initial: Record<string, string> | null;
  loading: boolean;
}

function SalaryModal({ isOpen, onClose, onSubmit, initial, loading }: SalaryModalProps) {
  const [form, setForm] = useState<Record<string, string>>(initial || EMPTY_SALARY);
  useEffect(() => {
    setForm(initial || EMPTY_SALARY);
  }, [initial, isOpen]);

  if (!isOpen) return null;

  const set = (k: string, v: string) => setForm((p: Record<string, string>) => ({ ...p, [k]: v }));
  const availableCities = form.country ? ((CITIES_BY_COUNTRY as Record<string, string[]>)[form.country] || []) : [];

  const handleSubmit = (e: FormEvent) => {
    e?.preventDefault();
    if (!form.role.trim())    return alert('Role is required');
    if (!form.country)        return alert('Country is required');
    if (!form.salaryMin && !form.salaryMax) return alert('Enter at least one salary figure');
    onSubmit({
      ...form,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiDollarSign className="text-primary-600" />
            {initial ? 'Edit Salary Record' : 'Add Salary Record'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <FiX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Role / Title <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.role} onChange={e => set('role', e.target.value)}
              placeholder="e.g. Software Engineer, Product Manager"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {/* Country + City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country <span className="text-red-500">*</span></label>
              <select value={form.country} onChange={e => setForm((p: Record<string, string>) => ({ ...p, country: e.target.value, city: '' }))}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Select country</option>
                {AFRICAN_COUNTRIES.map(c => (
                  <option key={c} value={c}>{(COUNTRY_FLAGS as Record<string, string>)[c] || '🌍'} {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <select value={form.city} onChange={e => set('city', e.target.value)} disabled={!form.country}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50">
                <option value="">All cities</option>
                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industry</label>
            <input type="text" value={form.industry} onChange={e => set('industry', e.target.value)}
              placeholder="e.g. Fintech, Healthcare, FMCG, Oil & Gas"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience Level</label>
            <select value={form.experience} onChange={e => set('experience', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select level</option>
              {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {/* Salary min/max */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monthly Salary Range (in local currency, numbers only) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input type="number" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} placeholder="Min e.g. 150000"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p className="text-xs text-gray-400 mt-1">Minimum</p>
              </div>
              <div>
                <input type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} placeholder="Max e.g. 300000"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p className="text-xs text-gray-400 mt-1">Maximum</p>
              </div>
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              placeholder="e.g. Includes bonuses. Based on 10 data points from Lagos-based Fintechs."
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <><FiDollarSign size={15} /> {initial ? 'Save Changes' : 'Add Salary Record'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Admin component ─────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]     = useState<'job' | 'scholarship' | 'blog' | 'applications' | 'salaries'>('job');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  // Applications tab state
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [appFilterStatus, setAppFilterStatus] = useState('all');
  const [appSearch, setAppSearch]           = useState('');
  // Salary tab state
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [editSalary, setEditSalary] = useState<any | null>(null);
  const [salarySearch, setSalarySearch]       = useState('');

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = async () => {
    setLoading(true);
    type FItem = Record<string, unknown> & { id: string };
    const ts = (x: unknown) => ((x as { seconds?: number })?.seconds || 0);
    try {
      if (activeTab === 'job') {
        const snap = await getDocs(collection(db, 'jobs'));
        const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FItem));
        jobs.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
        setItems(jobs);
      } else if (activeTab === 'scholarship') {
        const snap = await getDocs(collection(db, 'scholarships'));
        const scholarships = snap.docs.map(d => ({ id: d.id, ...d.data() } as FItem));
        scholarships.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
        setItems(scholarships);
      } else if (activeTab === 'blog') {
        const snap = await getDocs(collection(db, 'blog'));
        const blogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FItem));
        blogs.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
        setItems(blogs);
      } else if (activeTab === 'applications') {
        const snap = await getDocs(collection(db, 'applications'));
        const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as FItem));
        apps.sort((a, b) => ts(b.appliedAt) - ts(a.appliedAt));
        setItems(apps);
      } else if (activeTab === 'salaries') {
        const snap = await getDocs(collection(db, 'salary_data'));
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as FItem));
        rows.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
        setItems(rows);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [activeTab]);

  const handleCreate    = () => { setEditItem(null); setModalOpen(true); };
  const handleEdit      = (item: any) => { setEditItem(item); setModalOpen(true); };
  const handleDeleteClick = (item: any) => { setDeleteTarget(item); setConfirmDelete(true); };

  const handleBoost = async (item: any) => {
    try {
      const colName = activeTab === 'job' ? 'jobs' : 'scholarships';
      const ref = doc(db, colName, item.id as string);
      await updateDoc(ref, { isFeatured: !item.isFeatured, updatedAt: Timestamp.now() });
      showToast(item.isFeatured ? 'Removed from featured' : '⚡ Marked as Featured!');
      fetchItems();
    } catch {
      showToast('Failed to update featured status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      if (activeTab === 'job')          await deleteJob(deleteTarget.id as string);
      else if (activeTab === 'scholarship') await deleteScholarship(deleteTarget.id as string, user?.uid ?? '');
      else if (activeTab === 'blog')    await deleteDoc(doc(db, 'blog', deleteTarget.id as string));
      else if (activeTab === 'salaries') await deleteDoc(doc(db, 'salary_data', deleteTarget.id as string));
      showToast('Deleted successfully');
      setConfirmDelete(false);
      setDeleteTarget(null);
      fetchItems();
    } catch {
      showToast('Failed to delete', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    setActionLoading(true);
    const isEdit = !!editItem;
    try {
      const { id: _id, type: _type, ...cleanData } = formData;
      if (activeTab === 'job') {
        const jobData = { ...cleanData, status: cleanData.status || 'active' };
        if (isEdit) await updateJob(editItem.id as string, jobData);
        else        await createJob(jobData, user?.uid ?? '');
      } else if (activeTab === 'scholarship') {
        const schData = { ...cleanData, status: cleanData.status || 'active' };
        if (isEdit) await updateScholarship(editItem.id as string, schData, user?.uid ?? '');
        else        await createScholarship(schData, user?.uid ?? '');
      } else if (activeTab === 'blog') {
        if (isEdit) {
          await updateDoc(doc(db, 'blog', editItem.id as string), { ...cleanData, published: cleanData.published ?? true, updatedAt: Timestamp.now() });
        } else {
          await addDoc(collection(db, 'blog'), { ...cleanData, published: true, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), views: 0 });
        }
      }
      showToast(isEdit ? 'Updated successfully!' : 'Created successfully!');
      setModalOpen(false);
      setEditItem(null);
      fetchItems();
    } catch {
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Salary CRUD handlers ───────────────────────────────────────────────────
  const handleSalarySubmit = async (formData: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      if (editSalary) {
        await updateDoc(doc(db, 'salary_data', editSalary.id as string), {
          ...formData,
          status: formData.status || 'active',
          updatedAt: Timestamp.now(),
        });
        showToast('Salary record updated!');
      } else {
        await addDoc(collection(db, 'salary_data'), {
          ...formData,
          status: 'active',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          dataPoints: 1,
        });
        showToast('Salary record added!');
      }
      setSalaryModalOpen(false);
      setEditSalary(null);
      const snap = await getDocs(collection(db, 'salary_data'));
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      (rows as any[]).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setItems(rows);
    } catch (err) {
      console.error(err);
      showToast('Failed to save salary record', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAppStatusChange = async (appId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status: newStatus, updatedAt: Timestamp.now() });
      setItems((prev: any[]) => prev.map((a: any) => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedApp?.id === appId) setSelectedApp((prev: any) => prev ? { ...prev, status: newStatus } : prev);
      showToast('Status updated');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const formatDate = (ts: { toDate?: () => Date } | null | undefined): string => {
    if (!ts?.toDate) return 'Recently';
    const d = ts.toDate();
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString();
  };

  const formatSalaryDisplay = (s: Record<string, unknown>): string => {
    const fmt = (n: number | null | undefined): string | null => {
      if (!n) return null;
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      return `${(n / 1000).toFixed(0)}k`;
    };
    const fMin = fmt(s.salaryMin as number | null | undefined);
    const fMax = fmt(s.salaryMax as number | null | undefined);
    if (!fMin && !fMax) return 'N/A';
    if (!fMax) return fMin ?? 'N/A';
    return `${fMin ?? ''} – ${fMax}`;
  };

  const filteredApps = items.filter(app => {
    const statusMatch = appFilterStatus === 'all' || (app.status as string) === appFilterStatus;
    const searchMatch = appSearch === '' ||
      String(app.userName ?? "").toLowerCase().includes(appSearch.toLowerCase()) ||
      String(app.userEmail ?? "").toLowerCase().includes(appSearch.toLowerCase()) ||
      String(app.title ?? "").toLowerCase().includes(appSearch.toLowerCase());
    return statusMatch && searchMatch;
  });

  const filteredSalaries = items.filter(s =>
    !salarySearch ||
    String(s.role ?? "").toLowerCase().includes(salarySearch.toLowerCase()) ||
    String(s.industry ?? "").toLowerCase().includes(salarySearch.toLowerCase()) ||
    String(s.country ?? "").toLowerCase().includes(salarySearch.toLowerCase())
  );

  const totalViews        = items.reduce((sum: number, i: any) => sum + (Number(i.views) || 0), 0);
  const totalApplications = items.reduce((sum: number, i: any) => sum + (Number(i.applications) || 0), 0);
  const totalFeatured     = items.filter(i => i.isFeatured).length;

  const columns = {
    job:        ['title', 'company', 'country', 'type', 'deadline'],
    scholarship:['title', 'org',     'country', 'type', 'deadline'],
    blog:       ['title', 'author',  'category'],
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        {activeTab !== 'applications' && activeTab !== 'salaries' && (
          <button onClick={handleCreate} className="flex items-center gap-2 btn-primary">
            <FiPlus /> Add {TABS.find(t => t.key === activeTab)?.label.slice(0, -1)}
          </button>
        )}
        {activeTab === 'salaries' && (
          <button onClick={() => { setEditSalary(null); setSalaryModalOpen(true); }} className="flex items-center gap-2 btn-primary">
            <FiPlus /> Add Salary Record
          </button>
        )}
        {activeTab === 'applications' && (
          <button onClick={fetchItems} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 transition">
            <FiRefreshCw size={14} /> Refresh
          </button>
        )}
      </div>

      {/* Stats Row — jobs & scholarships */}
      {activeTab !== 'blog' && activeTab !== 'applications' && activeTab !== 'salaries' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total',        value: items.length,      color: 'text-gray-900 dark:text-white' },
            { label: 'Total Views',  value: totalViews,        color: 'text-blue-600' },
            { label: 'Applications', value: totalApplications, color: 'text-primary-600' },
            { label: 'Featured',     value: totalFeatured,     color: 'text-amber-600', emoji: '⚡' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.emoji && <span className="mr-1">{stat.emoji}</span>}{stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Applications stats */}
      {activeTab === 'applications' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total',     value: items.length,                                            color: 'text-gray-900 dark:text-white' },
            { label: 'Pending',   value: items.filter(a => a.status === 'pending' || !a.status).length, color: 'text-yellow-600' },
            { label: 'Interview', value: items.filter(a => a.status === 'Interview').length,      color: 'text-indigo-600' },
            { label: 'With CV',   value: items.filter(a => a.cvUrl).length,                      color: 'text-primary-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Salary stats */}
      {activeTab === 'salaries' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Records', value: items.length, color: 'text-gray-900 dark:text-white' },
            { label: 'Countries',     value: [...new Set(items.map(s => s.country).filter(Boolean))].length, color: 'text-primary-600' },
            { label: 'Industries',    value: [...new Set(items.map(s => s.industry).filter(Boolean))].length, color: 'text-blue-600' },
            { label: 'Cities',        value: [...new Set(items.map(s => s.city).filter(Boolean))].length, color: 'text-green-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
                activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}>
              <Icon size={16} /> {tab.label}
              {tab.key === 'applications' && items.length > 0 && activeTab === 'applications' && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full text-xs font-bold">
                  {items.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          SALARY TAB
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'salaries' && (
        <div className="space-y-4">
          <input type="text" placeholder="Search by role, industry or country..."
            value={salarySearch} onChange={e => setSalarySearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredSalaries.length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
              <FiDollarSign size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">No salary records yet</p>
              <p className="text-sm mb-4">Start adding salary data to power the public Salary Portal.</p>
              <button onClick={() => { setEditSalary(null); setSalaryModalOpen(true); }} className="btn-primary inline-flex items-center gap-2">
                <FiPlus /> Add First Record
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Industry</th>
                    <th className="px-4 py-3">Experience</th>
                    <th className="px-4 py-3 text-right">Salary Range / mo</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredSalaries.map(s => (
                    <tr key={s.id as string} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[160px] truncate">
                        {(s.role as string) || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <span>{(COUNTRY_FLAGS as Record<string, string>)[s.country as string] || '🌍'}</span>
                          <span className="truncate max-w-[100px]">
                            {(s.city as string) ? `${s.city}, ${s.country}` : (s.country as string) || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[120px] truncate">
                        {(s.industry as string) || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {(s.experience as string) ? (
                          <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium whitespace-nowrap">
                            {(s.experience as string)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary-600">
                        {formatSalaryDisplay(s)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditSalary(s); setSalaryModalOpen(true); }}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition" title="Edit">
                            <FiEdit2 size={15} />
                          </button>
                          <button onClick={() => handleDeleteClick(s)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete">
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
          {items.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-2">
              💡 These records are live on the public{' '}
              <a href="/salaries" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                /salaries
              </a>{' '}
              page — visible to all visitors.
            </p>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          APPLICATIONS TAB
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'applications' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder="Search by name, email or job title..."
              value={appSearch} onChange={e => setAppSearch(e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm flex-1 min-w-48" />
            <select value={appFilterStatus} onChange={e => setAppFilterStatus(e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm w-40">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="New">New</option>
              <option value="Viewed">Viewed</option>
              <option value="Contacted">Contacted</option>
              <option value="Interview">Interview</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <FiUsers size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No applications found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {items.length === 0 ? 'No one has applied yet.' : 'Try adjusting your search or filter.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredApps.map(app => (
                <div key={app.id as string} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base">{(app.userName as string) || 'Applicant'}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Applied for: <span className="font-medium text-gray-700 dark:text-gray-300">{(app.title as string) || 'Unknown Role'}</span>
                            {(app.company as string) && <span className="text-gray-400"> · {app.company as string}</span>}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${APP_STATUS_STYLES[(app.status as string) || 'pending'] || APP_STATUS_STYLES.pending}`}>
                          {String(app.status || 'pending')}
                        </span>
                      </div>
                      {(app.coverNote as string) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-1">{app.coverNote as string}</p>
                      )}
                      {(app.cvUrl as string) && (
                        <a href={app.cvUrl as string} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
                          <FiFileText size={12} /> {(app.cvFileName as string) || 'View CV'}
                        </a>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                        {(app.userEmail as string) && <span>📧 {app.userEmail as string}</span>}
                        {(app.phone as string) && <span>📱 {app.phone as string}</span>}
                        <span>⏰ {formatDate(app.appliedAt as { toDate?: () => Date } | null)}</span>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col gap-2 shrink-0">
                      <button onClick={() => setSelectedApp(app)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition">
                        <FiEye size={13} /> View
                      </button>
                      {(app.userEmail as string) && (
                        <a href={`mailto:${app.userEmail as string}`}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 rounded-lg transition">
                          <FiMail size={13} /> Email
                        </a>
                      )}
                      {(app.phone as string) && (
                        <a href={`tel:${app.phone.replace(/\s/g, '')}`}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 rounded-lg transition">
                          <FiPhone size={13} /> Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Application Detail Modal */}
          {selectedApp && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{(selectedApp.userName as string) || 'Applicant'}'s Application</h3>
                  <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                    <FiX size={20} />
                  </button>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-500 dark:text-gray-400">Name</p><p className="font-medium text-gray-900 dark:text-white">{(selectedApp.userName as string) || '—'}</p></div>
                    <div><p className="text-gray-500 dark:text-gray-400">Email</p><p className="font-medium text-gray-900 dark:text-white">{(selectedApp.userEmail as string) || '—'}</p></div>
                    <div><p className="text-gray-500 dark:text-gray-400">Phone</p><p className="font-medium text-gray-900 dark:text-white">{(selectedApp.phone as string) || 'Not provided'}</p></div>
                    <div><p className="text-gray-500 dark:text-gray-400">Applied For</p><p className="font-medium text-gray-900 dark:text-white">{(selectedApp.title as string) || '—'}</p></div>
                    <div><p className="text-gray-500 dark:text-gray-400">Company</p><p className="font-medium text-gray-900 dark:text-white">{(selectedApp.company as string) || '—'}</p></div>
                    <div><p className="text-gray-500 dark:text-gray-400">Applied</p><p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedApp.appliedAt as { toDate?: () => Date } | null)}</p></div>
                    <div className="col-span-2">
                      <p className="text-gray-500 dark:text-gray-400 mb-1">Status</p>
                      <select
                        value={(selectedApp.status as string) || 'pending'}
                        onChange={e => handleAppStatusChange(selectedApp.id as string, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${APP_STATUS_STYLES[selectedApp.status as string] || APP_STATUS_STYLES.pending}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="New">New</option>
                        <option value="Viewed">Viewed</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Interview">Interview</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  {(selectedApp.cvUrl as string) && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CV / Resume</p>
                      <a href={selectedApp.cvUrl as string} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition text-sm font-medium border border-primary-200 dark:border-primary-800">
                        <FiFileText size={15} /> {(selectedApp.cvFileName as string) || 'View CV / Resume'}
                      </a>
                    </div>
                  )}
                  {(selectedApp.coverNote as string) && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Note</p>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-sm">{selectedApp.coverNote as string}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
                    {(selectedApp.userEmail as string) && (
                      <a href={`mailto:${selectedApp.userEmail as string}?subject=Re: Your application for ${selectedApp.title as string}`}
                        className="btn-primary flex items-center gap-2 text-sm">
                        <FiMail size={14} /> Send Email
                      </a>
                    )}
                    {(selectedApp.phone as string) && (
                      <a href={`tel:${selectedApp.phone.replace(/\s/g, '')}`}
                        className="btn-secondary flex items-center gap-2 text-sm">
                        <FiPhone size={14} /> Call Now
                      </a>
                    )}
                    {(selectedApp.cvUrl as string) && (
                      <a href={selectedApp.cvUrl as string} target="_blank" rel="noopener noreferrer"
                        className="btn-secondary flex items-center gap-2 text-sm">
                        <FiFileText size={14} /> Download CV
                      </a>
                    )}
                    <button onClick={() => setSelectedApp(null)} className="btn-secondary text-sm">Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          JOBS / SCHOLARSHIPS / BLOG TABLE
      ═══════════════════════════════════════════════════════ */}
      {activeTab !== 'applications' && activeTab !== 'salaries' && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">No {activeTab}s yet.</p>
              <button onClick={handleCreate} className="text-primary-600 hover:underline font-medium">
                + Create your first one
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs uppercase">
                  <tr>
                    {(columns as Record<string, string[]>)[activeTab]?.map(col => (
                      <th key={col} className="px-4 py-3 capitalize">{col}</th>
                    ))}
                    {activeTab !== 'blog' && (
                      <>
                        <th className="px-4 py-3 text-center">Views</th>
                        <th className="px-4 py-3 text-center">Applications</th>
                        <th className="px-4 py-3 text-center">Featured</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map(item => (
                    <tr key={item.id as string}
                      className={`bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${item.isFeatured ? 'border-l-4 border-yellow-400' : ''}`}>
                      {(columns as Record<string, string[]>)[activeTab]?.map(col => (
                        <td key={col} className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[180px] truncate">
                          {col === 'country' || col === 'location'
                            ? <span>{getFlag((item[col] as string) || '')} {(item[col] as string) || '—'}</span>
                            : (item[col] as string) || '—'}
                        </td>
                      ))}
                      {activeTab !== 'blog' && (
                        <>
                          <td className="px-4 py-3 text-center">
                            <span className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
                              <FiEye size={13} /> {item.views || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="flex items-center justify-center gap-1 text-primary-600 font-medium">
                              <FiUsers size={13} /> {item.applications || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleBoost(item)}
                              title={item.isFeatured ? 'Remove Featured' : 'Mark as Featured'}
                              className={`p-2 rounded-lg transition text-base ${item.isFeatured ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}>
                              ⚡
                            </button>
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEdit(item)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition" title="Edit">
                            <FiEdit2 size={15} />
                          </button>
                          <button onClick={() => handleDeleteClick(item)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete">
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
        </>
      )}

      {/* Create/Edit Modal (jobs, scholarships, blog) */}
      {activeTab !== 'applications' && activeTab !== 'salaries' && (
        <AdminFormModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          type={activeTab as 'job' | 'scholarship' | 'blog'}
          initialData={editItem}
          onSubmit={handleFormSubmit}
        />
      )}
      {/* Salary Add/Edit Modal */}
      <SalaryModal
        isOpen={salaryModalOpen}
        onClose={() => { setSalaryModalOpen(false); setEditSalary(null); }}
        onSubmit={handleSalarySubmit}
        initial={editSalary as Record<string, string> | null}
        loading={actionLoading}
      />
      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete this item?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              "<span className="font-medium text-gray-700 dark:text-gray-300">{(deleteTarget?.title as string) || (deleteTarget?.role as string) || 'this item'}</span>" will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setConfirmDelete(false); setDeleteTarget(null); }}
                className="btn-secondary dark:bg-gray-800 dark:text-white dark:border-gray-700">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={actionLoading}
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
