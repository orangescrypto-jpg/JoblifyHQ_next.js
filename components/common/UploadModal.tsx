'use client';
import type { FormEvent } from 'react';

import { useState } from 'react';
import { FiX, FiUploadCloud, FiCheck } from 'react-icons/fi';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityType: string;
  opportunityId: string;
  title: string;
  org: string;
  onApply: (data: { type: string; opportunityId: string; title: string; org: string; cvName: string; coverLetter: string }) => void;
}

export default function UploadModal({ isOpen, onClose, opportunityType, opportunityId, title, org, onApply }: UploadModalProps) {
  const [cv, setCv] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cv) return alert('Please upload your CV');
    setSubmitting(true);
    await new Promise(res => setTimeout(res, 1200)); // Mock network delay
    onApply({ type: opportunityType, opportunityId, title, org, cvName: cv.name, coverLetter });
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      setCv(null);
      setCoverLetter('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Apply to {title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><FiX size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><FiCheck size={28} /></div>
              <h4 className="text-lg font-semibold text-gray-900">Application Sent!</h4>
              <p className="text-gray-500 text-sm mt-1">You can track it in your dashboard.</p>
            </div>
          ) : (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition cursor-pointer relative">
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] ?? null)} className="absolute inset-0 opacity-0 cursor-pointer" required />
                <FiUploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">{cv ? cv.name : 'Click to upload CV (PDF/DOC)'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Message (Optional)</label>
                <textarea 
                  value={coverLetter} 
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Tell them why you're a great fit..."
                />
              </div>
              
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
