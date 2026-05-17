'use client';
import type { FormEvent } from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { FiMail, FiCheck, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      console.error('Password reset error:', (err as any).code);
      // Hide Firebase technical errors - show generic success message for security
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6">
          <FiArrowLeft /> Back to login
        </Link>

        {!sent ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                <FiMail size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password?</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-lg transition disabled:opacity-70"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
              <FiCheck size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              If an account exists with <strong>{email}</strong>, we've sent password reset instructions to your email.
            </p>
            <div className="space-y-3">
              <Link href="/login" className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-lg transition">
                Back to Login
              </Link>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Try another email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
