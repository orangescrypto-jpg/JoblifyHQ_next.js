'use client';
import type { FormEvent } from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiCheck, FiBriefcase, FiAward, FiLink, FiMail, FiGlobe } from 'react-icons/fi';
import { createJob } from '@/services/firebase/jobs';
import { createScholarship } from '@/services/firebase/scholarships';
import { AFRICAN_COUNTRIES, COUNTRY_FLAGS, JOB_CATEGORIES as CATEGORIES } from '@/constants';


const HOST_COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Uganda',
  'UK', 'USA', 'Canada', 'Australia', 'Germany', 'France',
  'China', 'Netherlands', 'Sweden', 'Norway', 'Japan', 'South Korea', 'Worldwide'
];



export default function EmployerPostJob() {
  const router = useRouter();
  const { user } = useAuth();
  const [listingType, setListingType] = useState('job');

  const [form, setForm] = useState({
    title: '', company: '', org: '', city: '', country: '',
    type: '', funding: 'Full Funding', category: '',
    salary: '', benefits: '', deadline: '', description: '',
    applyLink: '', applyEmail: '', isRemote: false  // ← Added isRemote
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.uid) { alert('Please sign in'); router.push('/login'); return; }
    setSubmitting(true);
    try {
      if (listingType === 'job') {
        await createJob({
          title: form.title,
          company: form.company,
          country: form.country,
          location: form.city ? `${form.city}, ${form.country}` : form.country,
          type: form.type,
          category: form.category,
          salary: form.salary,
          deadline: form.deadline,
          description: form.description,
          applyLink: form.applyLink || '',
          applyEmail: form.applyEmail || '',
          isRemote: form.isRemote || false,  // ← Saved to Firestore
          postedByName: user?.company || user?.name
        }, user.uid);
      } else {
        await createScholarship({
          title: form.title,
          org: form.org,
          country: form.country,
          funding: form.funding,
          type: form.funding,
          category: form.category,
          benefits: form.benefits,
          deadline: form.deadline,
          description: form.description,
          applyLink: form.applyLink || '',
          applyEmail: form.applyEmail || '',
          postedByName: user?.company || user?.name
        }, user.uid);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({
          title: '', company: '', org: '', city: '', country: '',
          type: '', funding: 'Full Funding', category: '',
          salary: '', benefits: '', deadline: '', description: '',
          applyLink: '', applyEmail: '', isRemote: false
        });
        router.push('/employer/listings');
      }, 2000);
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert('Failed to publish. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  if (success) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
          <FiCheck size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {listingType === 'job' ? 'Job' : 'Scholarship'} Posted!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Your listing is now live across Africa.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/employer/listings')} className="btn-secondary">View Listings</button>
          <button onClick={() => setSuccess(false)} className="btn-primary">Post Another</button>
        </div>
      </div>
    );
  }

  const isJob = listingType === 'job';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Listing</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Post a job or scholarship visible across Africa.</p>
      </div>

      {/* Toggle */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <button type="button" onClick={() => setListingType('job')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition ${isJob ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <FiBriefcase /> Post a Job
          </button>
          <button type="button" onClick={() => setListingType('scholarship')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition ${!isJob ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <FiAward /> Post a Scholarship
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isJob ? 'Job Title' : 'Scholarship Title'} *</label>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={isJob ? 'e.g. Senior Frontend Developer' : 'e.g. Global STEM Excellence Award'} required />
          </div>

          {/* Company / Org */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isJob ? 'Company Name' : 'Organization'} *</label>
            <input type="text" value={isJob ? form.company : form.org} onChange={e => set(isJob ? 'company' : 'org', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={isJob ? 'Your company name' : 'Foundation or institution name'} required />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isJob ? 'Country' : 'Host Country (where to study)'} *
            </label>
            <select value={form.country} onChange={e => set('country', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
              <option value="">Select country...</option>
              {isJob ? (
                AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{(COUNTRY_FLAGS as Record<string, string>)[c] || '🌍'} {c}</option>)
              ) : (
                <>
                  <optgroup label="Study in Africa">
                    {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{(COUNTRY_FLAGS as Record<string, string>)[c] || '🌍'} {c}</option>)}
                  </optgroup>
                  <optgroup label="Study Abroad">
                    {HOST_COUNTRIES.filter(c => !AFRICAN_COUNTRIES.includes(c)).map(c => <option key={c} value={c}>{(COUNTRY_FLAGS as Record<string, string>)[c] || '🌍'} {c}</option>)}
                  </optgroup>
                </>
              )}
            </select>
          </div>

          {/* City (jobs only) */}
          {isJob && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City / Area</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g. Lagos, Accra, Remote" />
            </div>
          )}

          {/* Job Type / Funding Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isJob ? 'Job Type' : 'Funding Type'} *</label>
            <select value={isJob ? form.type : form.funding} onChange={e => set(isJob ? 'type' : 'funding', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
              <option value="">Select type...</option>
              {isJob ? (
                <>
                  <optgroup label="Professional">
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Contract">Contract</option>
                  </optgroup>
                  <optgroup label="Students & Graduates">
                    <option value="Internship">Internship</option>
                    <option value="Entry-level">Entry Level</option>
                    <option value="Graduate Trainee">Graduate Trainee</option>
                    <option value="NYSC">NYSC-Friendly</option>
                    <option value="Volunteer">Volunteer</option>
                  </optgroup>
                </>
              ) : (
                <>
                  <option value="Full Funding">Full Funding</option>
                  <option value="Partial Funding">Partial Funding</option>
                  <option value="Grant">Grant</option>
                  <option value="Tuition Waiver">Tuition Waiver</option>
                </>
              )}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Salary / Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isJob ? 'Salary Range' : 'Benefits'}</label>
            <input type="text" value={isJob ? form.salary : form.benefits} onChange={e => set(isJob ? 'salary' : 'benefits', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={isJob ? 'e.g. ₦300k–₦500k / month' : 'e.g. Tuition + $15k stipend + flights'} />
          </div>

          {/* Global Remote Toggle — jobs only */}
          {isJob && (
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-blue-400 transition">
                <input
                  type="checkbox"
                  checked={form.isRemote || false}
                  onChange={e => set('isRemote', e.target.checked)}
                  className="accent-blue-600 w-4 h-4"
                />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <FiGlobe className="text-blue-600" /> This is a Global Remote role
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Open to African talent anywhere — will appear in the Global Remote section</span>
                </div>
              </label>
            </div>
          )}

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application Deadline</label>
            <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>

          {/* Apply Link (Website URL) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1"><FiLink size={14} /> Apply Link <span className="text-gray-400 font-normal">(optional)</span></span>
            </label>
            <input type="url" value={form.applyLink} onChange={e => set('applyLink', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="https://yourcompany.com/apply" />
            <p className="text-xs text-gray-400 mt-1">Candidates will see an "Apply on Website" button linking here</p>
          </div>

          {/* Apply Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1"><FiMail size={14} /> Apply Email <span className="text-gray-400 font-normal">(optional)</span></span>
            </label>
            <input type="email" value={form.applyEmail} onChange={e => set('applyEmail', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g. hr@yourcompany.com or vc@wesleyuni.edu.ng" />
            <p className="text-xs text-gray-400 mt-1">Candidates will see an "Apply via Email" button that opens their mail app</p>
          </div>

        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={6}
            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            placeholder={isJob ? 'Describe the role, responsibilities, and requirements...' : 'Describe eligibility criteria, benefits, and how to apply...'}
            required />
        </div>

        {/* Boost Option */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 text-xl">⚡</div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">Boost Your Listing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get 3x more visibility — appear at the top of results and on the homepage across Africa.</p>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" name="boost" className="text-amber-500 rounded focus:ring-amber-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Yes, boost for $5 (14 days)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={() => router.push('/employer/listings')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Publishing...' : `Publish ${isJob ? 'Job' : 'Scholarship'} across Africa`}
          </button>
        </div>
      </form>
    </div>
  );
}
