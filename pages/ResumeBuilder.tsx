'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FreelancerService } from '@/src/services/providers/firebase/freelancer';
import type { Resume, ResumeExperience, ResumeEducation, ResumeCertification } from '@/types';

function uid() { return Math.random().toString(36).slice(2,9); }

const EMPTY_RESUME: Omit<Resume, 'userId'> = {
  fullName: '', email: '', phone: '', location: '', summary: '',
  experience: [], education: [], skills: [], certifications: [], languages: [],
};

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [resume, setResume]     = useState<Omit<Resume, 'userId'>>(EMPTY_RESUME);
  const [skillInput, setSkillInput] = useState('');
  const [langInput, setLangInput]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [tab, setTab]           = useState<'edit' | 'preview'>('edit');
  const printRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    FreelancerService.getResume(user.uid).then(r => {
      if (r) setResume({ fullName: r.fullName, email: r.email, phone: r.phone||'', location: r.location||'', summary: r.summary||'', experience: r.experience||[], education: r.education||[], skills: r.skills||[], certifications: r.certifications||[], languages: r.languages||[] });
    });
  }, [user]);

  const set = (k: string, v: any) => setResume(r => ({ ...r, [k]: v }));

  const saveResume = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await FreelancerService.saveResume(user.uid, { ...resume, userId: user.uid });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handlePrint = () => window.print();

  // Experience handlers
  const addExp = () => set('experience', [...resume.experience, { id: uid(), company: '', role: '', startDate: '', endDate: '', current: false, description: '' }]);
  const updateExp = (id: string, k: string, v: any) => set('experience', resume.experience.map(e => e.id === id ? { ...e, [k]: v } : e));
  const removeExp = (id: string) => set('experience', resume.experience.filter(e => e.id !== id));

  // Education handlers
  const addEdu = () => set('education', [...resume.education, { id: uid(), institution: '', degree: '', field: '', startYear: '', endYear: '', current: false }]);
  const updateEdu = (id: string, k: string, v: any) => set('education', resume.education.map(e => e.id === id ? { ...e, [k]: v } : e));
  const removeEdu = (id: string) => set('education', resume.education.filter(e => e.id !== id));

  // Cert handlers
  const addCert = () => set('certifications', [...(resume.certifications||[]), { id: uid(), name: '', issuer: '', year: '', url: '' }]);
  const updateCert = (id: string, k: string, v: any) => set('certifications', (resume.certifications||[]).map(c => c.id === id ? { ...c, [k]: v } : c));
  const removeCert = (id: string) => set('certifications', (resume.certifications||[]).filter(c => c.id !== id));

  const addSkill = () => { if (skillInput.trim()) { set('skills', [...resume.skills, skillInput.trim()]); setSkillInput(''); }};
  const addLang  = () => { if (langInput.trim()) { set('languages', [...(resume.languages||[]), langInput.trim()]); setLangInput(''); }};

  const inp = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const label = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Builder</h1>
            <p className="text-sm text-gray-500">Build a professional resume and download as PDF</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab(tab === 'edit' ? 'preview' : 'edit')}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
              {tab === 'edit' ? '👁 Preview' : '✏️ Edit'}
            </button>
            {tab === 'preview' && (
              <button onClick={handlePrint} className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                🖨 Print / PDF
              </button>
            )}
            <button onClick={saveResume} disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {tab === 'edit' ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-5">
              {/* Personal Info */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className={label}>Full Name</label><input className={inp} value={resume.fullName} onChange={e => set('fullName', e.target.value)} placeholder="John Doe" /></div>
                  <div><label className={label}>Email</label><input className={inp} value={resume.email} onChange={e => set('email', e.target.value)} placeholder="john@email.com" /></div>
                  <div><label className={label}>Phone</label><input className={inp} value={resume.phone} onChange={e => set('phone', e.target.value)} placeholder="+234 800 000 0000" /></div>
                  <div className="col-span-2"><label className={label}>Location</label><input className={inp} value={resume.location} onChange={e => set('location', e.target.value)} placeholder="Lagos, Nigeria" /></div>
                  <div className="col-span-2"><label className={label}>Professional Summary</label><textarea className={inp + ' resize-none'} rows={4} value={resume.summary} onChange={e => set('summary', e.target.value)} placeholder="Brief overview of your professional background and key strengths..." /></div>
                </div>
              </section>

              {/* Experience */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Work Experience</h2>
                  <button onClick={addExp} className="text-sm text-blue-600 hover:underline font-medium">+ Add</button>
                </div>
                <div className="space-y-4">
                  {resume.experience.map(exp => (
                    <div key={exp.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 relative">
                      <button onClick={() => removeExp(exp.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm">✕</button>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={label}>Job Title</label><input className={inp} value={exp.role} onChange={e => updateExp(exp.id, 'role', e.target.value)} placeholder="Software Engineer" /></div>
                        <div><label className={label}>Company</label><input className={inp} value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} placeholder="Company Name" /></div>
                        <div><label className={label}>Start Date</label><input type="month" className={inp} value={exp.startDate} onChange={e => updateExp(exp.id, 'startDate', e.target.value)} /></div>
                        <div>
                          <label className={label}>End Date</label>
                          {exp.current ? <span className="text-sm text-blue-600 font-medium">Present</span> :
                            <input type="month" className={inp} value={exp.endDate} onChange={e => updateExp(exp.id, 'endDate', e.target.value)} />}
                        </div>
                        <label className="col-span-2 flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={exp.current} onChange={e => updateExp(exp.id, 'current', e.target.checked)} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Currently working here</span>
                        </label>
                        <div className="col-span-2"><label className={label}>Description</label><textarea className={inp + ' resize-none'} rows={3} value={exp.description} onChange={e => updateExp(exp.id, 'description', e.target.value)} placeholder="Key responsibilities and achievements..." /></div>
                      </div>
                    </div>
                  ))}
                  {resume.experience.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No experience added yet.</p>}
                </div>
              </section>

              {/* Education */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Education</h2>
                  <button onClick={addEdu} className="text-sm text-blue-600 hover:underline font-medium">+ Add</button>
                </div>
                <div className="space-y-4">
                  {resume.education.map(edu => (
                    <div key={edu.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 relative">
                      <button onClick={() => removeEdu(edu.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm">✕</button>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2"><label className={label}>Institution</label><input className={inp} value={edu.institution} onChange={e => updateEdu(edu.id, 'institution', e.target.value)} placeholder="University of Lagos" /></div>
                        <div><label className={label}>Degree</label><input className={inp} value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} placeholder="B.Sc." /></div>
                        <div><label className={label}>Field of Study</label><input className={inp} value={edu.field} onChange={e => updateEdu(edu.id, 'field', e.target.value)} placeholder="Computer Science" /></div>
                        <div><label className={label}>Start Year</label><input className={inp} value={edu.startYear} onChange={e => updateEdu(edu.id, 'startYear', e.target.value)} placeholder="2018" /></div>
                        <div><label className={label}>End Year</label><input className={inp} value={edu.endYear} onChange={e => updateEdu(edu.id, 'endYear', e.target.value)} placeholder="2022 or leave blank" /></div>
                      </div>
                    </div>
                  ))}
                  {resume.education.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No education added yet.</p>}
                </div>
              </section>

              {/* Certifications */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Certifications</h2>
                  <button onClick={addCert} className="text-sm text-blue-600 hover:underline font-medium">+ Add</button>
                </div>
                <div className="space-y-3">
                  {(resume.certifications||[]).map(cert => (
                    <div key={cert.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 grid grid-cols-3 gap-2 relative">
                      <button onClick={() => removeCert(cert.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs">✕</button>
                      <div><label className={label}>Certificate</label><input className={inp} value={cert.name} onChange={e => updateCert(cert.id,'name',e.target.value)} placeholder="AWS Solutions Architect" /></div>
                      <div><label className={label}>Issuer</label><input className={inp} value={cert.issuer} onChange={e => updateCert(cert.id,'issuer',e.target.value)} placeholder="Amazon" /></div>
                      <div><label className={label}>Year</label><input className={inp} value={cert.year} onChange={e => updateCert(cert.id,'year',e.target.value)} placeholder="2023" /></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Skills */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Skills</h2>
                <div className="flex gap-2 mb-3">
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add skill..." className={inp} />
                  <button onClick={addSkill} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">+</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map(s => (
                    <span key={s} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full">
                      {s}<button onClick={() => set('skills', resume.skills.filter(x => x !== s))} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </section>

              {/* Languages */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Languages</h2>
                <div className="flex gap-2 mb-3">
                  <input value={langInput} onChange={e => setLangInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLang())} placeholder="e.g. English (Fluent)" className={inp} />
                  <button onClick={addLang} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">+</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(resume.languages||[]).map(l => (
                    <span key={l} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full">
                      {l}<button onClick={() => set('languages', (resume.languages||[]).filter(x => x !== l))} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </section>

              <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl p-5 text-sm">
                <h3 className="font-semibold mb-2">💡 Tips</h3>
                <ul className="space-y-1.5 text-blue-100 text-xs">
                  <li>• Use action verbs: Built, Led, Grew, Reduced</li>
                  <li>• Quantify achievements with numbers</li>
                  <li>• Tailor skills to each job application</li>
                  <li>• Keep to 1–2 pages</li>
                  <li>• Proofread before sending</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* PREVIEW */
          <div ref={printRef} className="bg-white rounded-xl shadow-lg max-w-3xl mx-auto print:shadow-none print:rounded-none" id="resume-preview">
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-8 rounded-t-xl print:rounded-none">
              <h1 className="text-3xl font-bold">{resume.fullName || 'Your Name'}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-blue-200 text-sm">
                {resume.email    && <span>✉ {resume.email}</span>}
                {resume.phone    && <span>📞 {resume.phone}</span>}
                {resume.location && <span>📍 {resume.location}</span>}
              </div>
              {resume.summary && <p className="mt-3 text-blue-100 text-sm leading-relaxed">{resume.summary}</p>}
            </div>
            <div className="p-8 space-y-6">
              {resume.experience.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-blue-700 uppercase tracking-widest border-b-2 border-blue-100 pb-1 mb-3">Experience</h2>
                  {resume.experience.map(exp => (
                    <div key={exp.id} className="mb-4">
                      <div className="flex items-start justify-between">
                        <div><p className="font-semibold text-gray-900">{exp.role}</p><p className="text-sm text-gray-600">{exp.company}</p></div>
                        <p className="text-xs text-gray-500 shrink-0">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</p>
                      </div>
                      {exp.description && <p className="text-sm text-gray-700 mt-1 leading-relaxed">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )}
              {resume.education.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-blue-700 uppercase tracking-widest border-b-2 border-blue-100 pb-1 mb-3">Education</h2>
                  {resume.education.map(edu => (
                    <div key={edu.id} className="mb-3 flex justify-between">
                      <div><p className="font-semibold text-gray-900">{edu.institution}</p><p className="text-sm text-gray-600">{edu.degree} in {edu.field}</p></div>
                      <p className="text-xs text-gray-500">{edu.startYear} – {edu.endYear || 'Present'}</p>
                    </div>
                  ))}
                </div>
              )}
              {resume.skills.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-blue-700 uppercase tracking-widest border-b-2 border-blue-100 pb-1 mb-3">Skills</h2>
                  <div className="flex flex-wrap gap-2">{resume.skills.map(s => <span key={s} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-100">{s}</span>)}</div>
                </div>
              )}
              {(resume.certifications||[]).length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-blue-700 uppercase tracking-widest border-b-2 border-blue-100 pb-1 mb-3">Certifications</h2>
                  {(resume.certifications||[]).map(c => (
                    <div key={c.id} className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{c.name} <span className="font-normal text-gray-500">— {c.issuer}</span></span>
                      <span className="text-gray-500">{c.year}</span>
                    </div>
                  ))}
                </div>
              )}
              {(resume.languages||[]).length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-blue-700 uppercase tracking-widest border-b-2 border-blue-100 pb-1 mb-3">Languages</h2>
                  <div className="flex flex-wrap gap-2">{(resume.languages||[]).map(l => <span key={l} className="text-sm text-gray-700">• {l}</span>)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
