'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GigsService } from '@/src/services/providers/firebase/gigs';
import { PlatformService } from '@/src/services/providers/firebase/platform';
import { useAuth } from '@/context/AuthContext';
import { AFRICAN_COUNTRIES } from '@/constants';

const GIG_CATEGORIES = [
  'Web Development','Mobile Development','UI/UX Design','Graphic Design',
  'Digital Marketing','Content Writing','Video Editing','Data Analysis',
  'Cybersecurity','DevOps & Cloud','AI & Machine Learning','SEO',
  'Social Media','Translation','Accounting & Finance','Legal',
  'Photography','Voice Over','Virtual Assistant','Other',
];

export default function PostGigPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [skillInput, setSkillInput] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', category: '',
    skills: [] as string[],
    budgetMin: '', budgetMax: '', currency: 'USD',
    duration: '1-2 weeks', country: 'Nigeria',
    isRemote: true, deadline: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      set('skills', [...form.skills, s]);
      setSkillInput('');
    }
  };

  const handleSubmit = async () => {
    if (!user) { setError('Please log in first.'); return; }
    if (!form.title || !form.description || !form.category || form.skills.length === 0) {
      setError('Please fill in all required fields and add at least one skill.'); return;
    }
    if (!form.budgetMin || !form.budgetMax) { setError('Please enter a budget range.'); return; }
    setLoading(true);
    setError('');
    try {
      const needsApproval = await PlatformService.isFeatureEnabled('kycEnabled')
        ? (await PlatformService.getSettings()).requireGigApproval
        : false;
      const gigId = await GigsService.createGig({
        title: form.title, description: form.description,
        category: form.category, skills: form.skills,
        budgetMin: parseInt(form.budgetMin), budgetMax: parseInt(form.budgetMax),
        currency: form.currency, duration: form.duration,
        country: form.country, isRemote: form.isRemote,
        clientId: user.uid, clientName: user.name || user.displayName || 'Client',
        clientPhoto: user.photoURL || undefined,
        clientVerified: user.employerVerified || false,
        status: 'open',
        deadline: form.deadline || undefined,
      }, needsApproval);
      router.push(`/gigs/${gigId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to post gig.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post a Gig</h1>
          <p className="text-gray-500 mt-1">Find skilled African freelancers for your project.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {error && <div className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gig Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Build a React Native mobile app"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={6} placeholder="Describe your project in detail. Include deliverables, goals, any resources provided..."
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white">
                <option value="">Select category</option>
                {GIG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
              <select value={form.duration} onChange={e => set('duration', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white">
                {['Less than 1 week','1-2 weeks','2-4 weeks','1-2 months','3-6 months','Ongoing'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Required Skills *</label>
            <div className="flex gap-2">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill and press Enter"
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white" />
              <button onClick={addSkill} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-blue-700">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.skills.map(s => (
                <span key={s} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 rounded-full">
                  {s}
                  <button onClick={() => set('skills', form.skills.filter(x => x !== s))} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Range *</label>
            <div className="flex gap-2 items-center">
              <select value={form.currency} onChange={e => set('currency', e.target.value)}
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white">
                <option value="USD">USD ($)</option>
                <option value="NGN">NGN (₦)</option>
              </select>
              <input type="number" value={form.budgetMin} onChange={e => set('budgetMin', e.target.value)}
                placeholder="Min" className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white" />
              <span className="text-gray-400">–</span>
              <input type="number" value={form.budgetMax} onChange={e => set('budgetMax', e.target.value)}
                placeholder="Max" className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              <select value={form.country} onChange={e => set('country', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white">
                {AFRICAN_COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline (optional)</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRemote} onChange={e => set('isRemote', e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Open to remote freelancers</span>
          </label>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
            <strong>🔒 Escrow Protection:</strong> Once you accept a proposal, funds are held in escrow and only released when you approve the work. Safe for both you and the freelancer.
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Posting...' : 'Post Gig'}
          </button>
        </div>
      </div>
    </div>
  );
}
