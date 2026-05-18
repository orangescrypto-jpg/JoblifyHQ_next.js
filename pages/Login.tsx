'use client';
import type { FormEvent } from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import FormInput from '@/components/forms/FormInput';
import SocialAuthButton from '@/components/common/SocialAuthButton';

export default function Login() {
  // authError intentionally NOT used here — avoids leaking Firebase internal messages
  const { login, loginWithGoogle, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setLocalError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSubmitting(true);

    if (!form.email || !form.password) {
      setLocalError('Please enter both email and password.');
      setSubmitting(false);
      return;
    }

    try {
      await login(form.email, form.password);
      router.push('/');
    } catch (err: unknown) {
      // Always show clean message — never expose Firebase error codes
      setLocalError('Invalid credentials. Please check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      // FIXED: small delay lets onAuthStateChanged settle before navigating
      setTimeout(() => router.push('/'), 300);
    } catch (err: unknown) {
      if ((err as any).message?.includes('popup-closed') || (err as any).message?.includes('cancelled')) {
        setLocalError('Sign-in was cancelled. Please try again.');
      } else if ((err as any).message?.includes('popup-blocked')) {
        setLocalError('Popup blocked. Please allow popups for this site and try again.');
      } else {
        setLocalError('Google sign-in failed. Please try again or use email/password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Sign in to access your dashboard</p>
        </div>

        <SocialAuthButton onClick={handleGoogleLogin} label="Continue with Google" />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="you@example.com"
          />

          <FormInput
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="••••••••"
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              Remember me
            </label>
            <Link href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Forgot password?
            </Link>
          </div>

          {/* FIXED: only localError shown, no authError that could leak Firebase messages */}
          {localError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
              {localError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || authLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting || authLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
