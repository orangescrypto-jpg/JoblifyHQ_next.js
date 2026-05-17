'use client';
import type { FormEvent } from 'react';

import { useState, useEffect, useRef } from 'react';
import { FiX, FiAlignLeft, FiList } from 'react-icons/fi';
import { AFRICAN_COUNTRIES, COUNTRY_FLAGS, JOB_CATEGORIES as CATEGORIES } from '@/constants';

const HOST_COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Uganda',
  'UK', 'USA', 'Canada', 'Australia', 'Germany', 'France',
  'China', 'Netherlands', 'Sweden', 'Norway', 'Japan', 'South Korea', 'Worldwide'
];

interface SimpleEditorProps {
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
}

function SimpleEditor({ value, onChange, rows = 6, placeholder = '' }: SimpleEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = (before: string, after = '') => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newValue);
    setTimeout(() => {
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
      el.focus();
    }, 0);
  };

  const insertParagraph = () => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const newValue = value.slice(0, start) + '\n\n' + value.slice(start);
    onChange(newValue);
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + 2; el.focus(); }, 0);
  };

  const insertBullet = () => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newValue = value.slice(0, lineStart) + '• ' + value.slice(lineStart);
    onChange(newValue);
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + 2; el.focus(); }, 0);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        <button type="button" onClick={() => insert('<b>', '</b>')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm">B</button>
        <button type="button" onClick={() => insert('<i>', '</i>')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 italic text-sm">I</button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button type="button" onClick={insertParagraph}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs flex items-center gap-1">
          <FiAlignLeft size={13} /> Para
        </button>
        <button type="button" onClick={insertBullet}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs flex items-center gap-1">
          <FiList size={13} /> Bullet
        </button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <span className="text-xs text-gray-400 ml-1">Select text then click Bold/Italic</span>
      </div>
      <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
        rows={rows} placeholder={placeholder}
        className="w-full px-3 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 resize-y focus:outline-none" />
    </div>
  );
}

type FormType = 'job' | 'scholarship' | 'blog';

interface FieldDef {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  rows?: number;
  groups?: { label: string; options: string[] }[];
}

interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: FormType;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

export default function AdminFormModal({ isOpen, onClose, type, initialData, onSubmit }: AdminFormModalProps) {
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({});
    setPreviewMode(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...form, id: initialData?.id, type });
    } finally {
      setLoading(false);
    }
  };

  const fields: Record<FormType, FieldDef[]> = {
    job: [
      { key: 'title', label: 'Job Title', type: 'text', required: true },
      { key: 'company', label: 'Company', type: 'text', required: true },
      { key: 'country', label: 'Country', type: 'country-select', required: true },
      { key: 'location', label: 'City / Area', type: 'text', required: false },
      { key: 'type', label: 'Job Type', type: 'grouped-select', required: true,
        groups: [
          { label: 'Professional', options: ['Full-time', 'Part-time', 'Remote', 'Contract'] },
          { label: 'Students & Graduates', options: ['Internship', 'Entry-level', 'Graduate Trainee', 'NYSC', 'Volunteer'] }
        ]
      },
      { key: 'category', label: 'Category', type: 'select', options: CATEGORIES, required: false },
      { key: 'salary', label: 'Salary Range', type: 'text', required: false },
      { key: 'deadline', label: 'Deadline', type: 'date', required: true },
      { key: 'applyLink', label: 'Apply Link (URL)', type: 'url', required: false },
      { key: 'description', label: 'Description', type: 'richtext', required: true },
    ],
    scholarship: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'org', label: 'Organization', type: 'text', required: true },
      { key: 'country', label: 'Host Country', type: 'host-country-select', required: true },
      { key: 'type', label: 'Funding Type', type: 'select', options: ['Full Funding', 'Partial Funding', 'Grant', 'Tuition Waiver'], required: true },
      { key: 'category', label: 'Category', type: 'select', options: CATEGORIES, required: false },
      { key: 'deadline', label: 'Deadline', type: 'date', required: true },
      { key: 'benefits', label: 'Benefits', type: 'text', required: false },
      { key: 'applyLink', label: 'Apply Link (URL)', type: 'url', required: false },
      { key: 'description', label: 'Description', type: 'richtext', required: true },
    ],
    blog: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'author', label: 'Author', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'image', label: 'Featured Image URL', type: 'url', required: false },
      { key: 'excerpt', label: 'Short Excerpt', type: 'textarea', required: true },
      { key: 'content', label: 'Content (HTML supported)', type: 'textarea', rows: 12, required: true },
    ]
  };

  const currentFields = fields[type] || [];

  const renderField = (f: FieldDef) => {
    const strVal = (form[f.key] as string) || '';

    if (f.type === 'grouped-select') {
      return (
        <select value={strVal} onChange={e => handleChange(f.key, e.target.value)}
          className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white" required={f.required}>
          <option value="">Select type...</option>
          {f.groups?.map(g => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </optgroup>
          ))}
        </select>
      );
    }
    if (f.type === 'country-select') {
      return (
        <select value={strVal} onChange={e => handleChange(f.key, e.target.value)}
          className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white" required={f.required}>
          <option value="">Select country...</option>
          {AFRICAN_COUNTRIES.map((c: string) => (
            <option key={c} value={c}>{(COUNTRY_FLAGS as Record<string, string>)[c] || '🌍'} {c}</option>
          ))}
        </select>
      );
    }
    if (f.type === 'host-country-select') {
      return (
        <select value={strVal} onChange={e => handleChange(f.key, e.target.value)}
          className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white" required={f.required}>
          <option value="">Select country...</option>
          <optgroup label="Study in Africa">
            {AFRICAN_COUNTRIES.map((c: string) => <option key={c} value={c}>{(COUNTRY_FLAGS as Record<string, string>)[c] || '🌍'} {c}</option>)}
          </optgroup>
          <optgroup label="Study Abroad">
            {HOST_COUNTRIES.filter(c => !(AFRICAN_COUNTRIES as string[]).includes(c)).map(c => (
              <option key={c} value={c}>{(COUNTRY_FLAGS as Record<string, string>)[c] || '🌍'} {c}</option>
            ))}
          </optgroup>
        </select>
      );
    }
    if (f.type === 'select') {
      return (
        <select value={strVal} onChange={e => handleChange(f.key, e.target.value)}
          className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white" required={f.required}>
          <option value="">Select...</option>
          {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    if (f.type === 'richtext') {
      return (
        <SimpleEditor value={strVal} onChange={val => handleChange(f.key, val)}
          rows={7} placeholder="Write description here. Use toolbar to format." />
      );
    }
    if (f.type === 'textarea') {
      return (
        <div>
          {type === 'blog' && f.key === 'content' && (
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setPreviewMode(!previewMode)}
                className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition">
                {previewMode ? 'Edit HTML' : 'Preview'}
              </button>
            </div>
          )}
          {previewMode && type === 'blog' && f.key === 'content' ? (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 min-h-[200px] prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: strVal || '<p class="text-gray-400 italic">Preview will appear here...</p>' }} />
          ) : (
            <textarea value={strVal} onChange={e => handleChange(f.key, e.target.value)}
              rows={f.rows || 4}
              className="input-field font-mono text-sm resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder={type === 'blog' && f.key === 'content' ? '<p>Write HTML content here...</p>' : ''}
              required={f.required} />
          )}
        </div>
      );
    }
    return (
      <input type={f.type} value={strVal} onChange={e => handleChange(f.key, e.target.value)}
        className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        placeholder={f.key === 'applyLink' ? 'https://example.com/apply' : ''}
        required={f.required} />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h3 className="text-lg font-semibold capitalize dark:text-white">{initialData ? 'Edit' : 'Create'} {type}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {currentFields.map(f => (
            <div key={f.key} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {f.label}
                {!f.required && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
              </label>
              {renderField(f)}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary dark:bg-gray-800 dark:text-white dark:border-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
