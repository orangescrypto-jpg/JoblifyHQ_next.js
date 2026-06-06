'use client';
import type { FormEvent } from 'react';
import type { UserRole } from '@/types';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import FormInput from '@/components/forms/FormInput';
import SocialAuthButton from '@/components/common/SocialAuthButton';

const AFRICAN_COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Uganda', 'Tanzania',
  'Ethiopia', 'Rwanda', 'Senegal', 'Cameroon', 'Zimbabwe', 'Zambia',
  'Egypt', 'Morocco', 'Ivory Coast', 'Mozambique', 'Madagascar', 'Angola',
  'Niger', 'Burkina Faso', 'Mali', 'Malawi', 'Botswana', 'Namibia',
  'Lesotho', 'Eswatini', 'Mauritius', 'Seychelles', 'Gambia', 'Sierra Leone',
  'Liberia', 'Guinea', 'Togo', 'Benin', 'Gabon', 'Congo', 'Other',
];

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [role, setRole] = useState<UserRole>('user');
  const [form, setForm] = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
    company:         '',
    country:         'Nigeria',
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = 'Full name is required';
    if (!form.email)        e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.country)      e.country = 'Please select your country';
    if (role === 'employer' && !form.company.trim()) e.company = 'Company name is required for employers';
    if (form.password.length < 6)           e.password        = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(
        form.email,
        form.password,
        form.name,
        role,
        role === 'employer' ? form.company : null,
        form.country,
      );
      router.push(role === 'employer' ? '/employer' : '/dashboard');
    } catch (err: unknown) {
      if ((err as any).code === 'auth/email-already-in-use') {
        setErrors({ submit: 'This email is already registered. Please login.' });
      } else {
        setErrors({ submit: 'Failed to create account. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch {
      setErrors({ submit: 'Google sign-in failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const inp = `w-full border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white
    focus:ring-2 focus:ring-primary-500 focus:border-transparent
    border-gray-300 dark:border-gray-700`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {role === 'employer' ? 'Post jobs and find talent' : role === 'freelancer' ? 'Offer your skills and earn' : 'Find your next job or scholarship'}
          </p>
        </div>

        <SocialAuthButton onClick={handleGoogle} />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <div className="space-y-4">

          {/* Role Selector */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {([
              { role: 'user',       icon: '👤', label: 'Job Seeker' },
              { role: 'employer',   icon: '🏢', label: 'Employer' },
              { role: 'freelancer', icon: '💼', label: 'Freelancer' },
            ] as { role: UserRole; icon: string; label: string }[]).map(r => (
              <button
                key={r.role}
                type="button"
                onClick={() => setRole(r.role)}
                className={`flex flex-col items-center gap-1 px-3 py-3 border rounded-xl text-xs font-medium transition ${
                  role === r.role
                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-500'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-lg">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          <FormInput
            label="Full Name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            error={errors.name}
            placeholder={role === 'employer' ? 'Jane Doe (HR Manager)' : 'John Doe'}
          />

          {role === 'employer' && (
            <FormInput
              label="Company Name *"
              value={form.company}
              onChange={e => set('company', e.target.value)}
              error={errors.company}
              placeholder="Acme Corp"
            />
          )}

          {/* Country — required at signup, drives payment routing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={form.country}
              onChange={e => set('country', e.target.value)}
              className={inp + (errors.country ? ' border-red-400' : '')}
            >
              <option value="">— Select your country —</option>
              {AFRICAN_COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.country && (
              <p className="mt-1 text-xs text-red-500">{errors.country}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              This determines your available payment options.
            </p>
          </div>

          <FormInput
            label="Email Address"
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
          />

          <FormInput
            label="Password"
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            error={errors.password}
            placeholder="Min. 6 characters"
          />

          <FormInput
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={e => set('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            placeholder="Repeat password"
          />

          {errors.submit && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
              {errors.submit}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70"
          >
            {loading
              ? 'Creating Account...'
              : `Sign Up as ${role === 'employer' ? 'Employer' : role === 'freelancer' ? 'Freelancer' : 'Job Seeker'}`}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
