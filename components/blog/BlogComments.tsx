'use client';
import type { FormEvent } from 'react';

import { useState, useEffect } from 'react';

interface Comment {
  id: number;
  name: string;
  text: string;
  date: string;
}

interface BlogCommentsProps {
  postId: string;
}

export default function BlogComments({ postId }: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [form, setForm] = useState({ name: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`blog_comments_${postId}`);
    if (stored) setComments(JSON.parse(stored));
  }, [postId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) return;
    setSubmitting(true);
    const newComment: Comment = {
      id: Date.now(),
      name: form.name.trim(),
      text: form.text.trim(),
      date: new Date().toISOString(),
    };
    const updated = [newComment, ...comments];
    setComments(updated);
    localStorage.setItem(`blog_comments_${postId}`, JSON.stringify(updated));
    setForm({ name: '', text: '' });
    setSubmitting(false);
  };

  return (
    <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-xl font-bold mb-6">💬 Discussion ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field md:col-span-1"
            required
          />
          <div className="md:col-span-2 flex gap-2">
            <textarea
              placeholder="Share your thoughts..."
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="input-field flex-grow resize-none"
              rows={2}
              required
            />
            <button type="submit" disabled={submitting} className="btn-primary h-10 px-4 whitespace-nowrap">
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 italic text-center py-4">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</span>
                <span className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
