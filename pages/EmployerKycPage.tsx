'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FreelancerService } from '@/src/services/providers/firebase/freelancer';
import { AFRICAN_COUNTRIES } from '@/constants';
import type { EmployerKyc } from '@/types';

export default function EmployerKycPage() {
  const { user }               = useAuth();
  const [existing, setExisting] = useState<EmployerKyc | null>(null);
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [msg, setMsg]          = useState('');

  const [form, setForm] = useState({
    companyName: '', cacNumber: '', taxId: '',
    websiteUrl: '', documentUrl: '', country: 'Nigeria',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!user) return;
    FreelancerService.getKycByEmployer(user.uid).then(k => {
      if (k) {
        setExisting(k);
        setForm({ companyName: k.companyName, cacNumber: k.cacNumber || '', taxId: k.taxId || '', websiteUrl: k.websiteUrl || '', documentUrl: k.documentUrl || '', country: k.country });
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const submit = async () => {
    if (!user) return;
    if (!form.companyName) { setMsg('Company name is required.'); return; }
    setSaving(true);
    try {
      await FreelancerService.submitKyc({
        employerId:   user.uid,
        employerName: user.name || '',
        ...form,
      });
      const k = await FreelancerService.getKycByEmployer(user.uid);
      setExisting(k);
      setMsg('Verification submitted! A moderator will review within 24 hours.');
    } catch { setMsg('Failed to submit. Try again.'); }
    finally { setSaving(false); }
  };

  const inp = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const lbl = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide";

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employer Verification</h1>
          <p className="text-sm text-gray-500">Get a verified badge to build trust with job seekers and freelancers.</p>
        </div>

        {/* Status banner */}
        {existing && (
          <div className={`mb-5 rounded-xl p-4 flex items-center gap-3 ${
            existing.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
            existing.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
            'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
            <span className="text-2xl">
              {existing.status === 'approved' ? '✅' : existing.status === 'rejected' ? '❌' : '⏳'}
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">{existing.status}</p>
              {existing.status === 'approved' && <p className="text-sm text-green-700 dark:text-green-400">Your employer profile is verified. ✓ badge appears on all your listings.</p>}
              {existing.status === 'pending'  && <p className="text-sm text-yellow-700 dark:text-yellow-400">Under review. Usually takes 24 hours.</p>}
              {existing.status === 'rejected' && <p className="text-sm text-red-700 dark:text-red-400">Rejected: {existing.rejectionReason || 'No reason provided.'} You can re-submit.</p>}
            </div>
          </div>
        )}

        {msg && <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg px-4 py-3 text-sm">{msg}</div>}

        {(existing?.status !== 'approved') && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Company Information</h2>

            <div><label className={lbl}>Company Name *</label><input className={inp} value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Acme Technologies Ltd" /></div>

            <div>
              <label className={lbl}>Country</label>
              <select className={inp} value={form.country} onChange={e => set('country', e.target.value)}>
                {(AFRICAN_COUNTRIES as string[]).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {form.country === 'Nigeria' && (
              <div><label className={lbl}>CAC Registration Number</label><input className={inp} value={form.cacNumber} onChange={e => set('cacNumber', e.target.value)} placeholder="RC 1234567" /></div>
            )}

            <div><label className={lbl}>Tax ID / Business Number</label><input className={inp} value={form.taxId} onChange={e => set('taxId', e.target.value)} placeholder="Optional" /></div>
            <div><label className={lbl}>Company Website</label><input className={inp} value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} placeholder="https://yourcompany.com" /></div>
            <div><label className={lbl}>Document URL (CAC cert, business reg, etc.)</label><input className={inp} value={form.documentUrl} onChange={e => set('documentUrl', e.target.value)} placeholder="Link to uploaded document" /></div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
              💡 Upload your document to a cloud storage (Google Drive, Dropbox) and paste the public link above.
            </div>

            <button onClick={submit} disabled={saving}
              className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Benefits of Verification</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {[
              '✓ Blue verified badge on all job listings',
              '✓ Higher placement in employer search',
              '✓ Freelancers prefer verified clients for gigs',
              '✓ Trust signals increase application rate by 40%',
              '✓ Access to premium talent pool',
            ].map(b => <li key={b}>{b}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
