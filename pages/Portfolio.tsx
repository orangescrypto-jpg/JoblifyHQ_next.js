'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FreelancerService } from '@/src/services/providers/firebase/freelancer';
import type { PortfolioItem } from '@/types';

const CATEGORIES = ['Web','Mobile','Design','Marketing','Writing','Video','Other'];

export default function PortfolioPage() {
  const { user }              = useAuth();
  const [items, setItems]     = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({ title:'', description:'', category:'Web', imageUrl:'', projectUrl:'', tags: [] as string[] });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!user) return;
    FreelancerService.getPortfolio(user.uid).then(setItems).finally(() => setLoading(false));
  }, [user]);

  const openAdd  = () => { setForm({ title:'', description:'', category:'Web', imageUrl:'', projectUrl:'', tags:[] }); setEditId(null); setShowForm(true); };
  const openEdit = (item: PortfolioItem) => { setForm({ title: item.title, description: item.description, category: item.category, imageUrl: item.imageUrl||'', projectUrl: item.projectUrl||'', tags: item.tags||[] }); setEditId(item.id); setShowForm(true); };

  const addTag = () => { if (tagInput.trim() && !form.tags.includes(tagInput.trim())) { set('tags', [...form.tags, tagInput.trim()]); setTagInput(''); }};

  const save = async () => {
    if (!user || !form.title) return;
    setSaving(true);
    try {
      if (editId) {
        await FreelancerService.updatePortfolioItem(editId, form);
        setItems(items.map(i => i.id === editId ? { ...i, ...form } : i));
      } else {
        const id = await FreelancerService.addPortfolioItem({ ...form, userId: user.uid });
        setItems([{ id, ...form, userId: user.uid, createdAt: new Date() }, ...items]);
      }
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    await FreelancerService.deletePortfolioItem(id);
    setItems(items.filter(i => i.id !== id));
  };

  const inp = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Portfolio</h1>
            <p className="text-sm text-gray-500">Showcase your best work to attract clients.</p>
          </div>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Project</button>
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">{editId ? 'Edit Project' : 'Add Project'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Project Title *</label><input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. E-commerce Website for Lagos Brand" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Description</label><textarea className={inp + ' resize-none'} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe what you built, the challenge and impact..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select className={inp} value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs text-gray-500 mb-1">Image URL</label><input className={inp} value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Project URL</label><input className={inp} value={form.projectUrl} onChange={e => set('projectUrl', e.target.value)} placeholder="https://..." /></div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag..." className={inp} />
                  <button onClick={addTag} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">+</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map(t => <span key={t} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded">{t}<button onClick={() => set('tags', form.tags.filter(x => x !== t))} className="hover:text-red-500">×</button></span>)}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={save} disabled={saving || !form.title} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Project'}</button>
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 dark:text-gray-400 py-2.5 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-52 animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🎨</p>
            <p className="font-medium text-gray-700 dark:text-gray-300">No projects yet</p>
            <p className="text-sm text-gray-500 mb-4">Add your first project to showcase your skills.</p>
            <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add First Project</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-md transition">
                {item.imageUrl ? (
                  <div className="h-36 overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  </div>
                ) : (
                  <div className="h-36 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-4xl">🎨</div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{item.title}</h3>
                    <span className="shrink-0 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded ml-2">{item.category}</span>
                  </div>
                  {item.description && <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{item.description}</p>}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(item.tags||[]).slice(0,3).map(t => <span key={t} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                  <div className="flex gap-2">
                    {item.projectUrl && <a href={item.projectUrl} target="_blank" className="flex-1 text-center text-xs border border-blue-600 text-blue-600 py-1.5 rounded-lg hover:bg-blue-50">View Live</a>}
                    <button onClick={() => openEdit(item)} className="flex-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Edit</button>
                    <button onClick={() => remove(item.id)} className="text-xs text-red-500 hover:text-red-700 px-2">🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
