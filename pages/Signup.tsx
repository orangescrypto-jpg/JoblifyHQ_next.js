'use client';
import type { FormEvent } from 'react';
import type { UserRole } from '@/types';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import FormInput from '@/components/forms/FormInput';
import SocialAuthButton from '@/components/common/SocialAuthButton';

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  
  const [role, setRole] = useState<UserRole>('user');
  const [form, setForm] = useState<{name:string;email:string;password:string;confirmPassword:string;company:string}>({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    company: '' 
  });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (role === 'employer' && !form.company.trim()) e.company = 'Company name is required for employers';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Call Firebase Signup with Role and Company
      await signup(
        form.email, 
        form.password, 
        form.name, 
        role, 
        role === 'employer' ? form.company : null
      );
      router.push(role === 'employer' ? '/employer' : '/dashboard');
    } catch (err: unknown) {
      // Handle Firebase specific errors (e.g., email already in use)
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
      // AuthContext handles redirect automatically after Google login
      router.push('/dashboard'); 
    } catch (err: unknown) {
      setErrors({ submit: 'Google sign-in failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {role === 'employer' ? 'Post jobs and find talent' : 'Find your next job or scholarship'}
          </p>
        </div>

        <SocialAuthButton onClick={handleGoogle} />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition ${
                role === 'user' 
                  ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-500' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              👤 Job Seeker
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition ${
                role === 'employer' 
                  ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-500' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              🏢 Employer
            </button>
          </div>

          <FormInput 
            label="Full Name" 
            value={form.name} 
            onChange={(e) => handleInputChange('name', e.target.value)} 
            error={errors.name} 
            placeholder={role === 'employer' ? "Jane Doe (HR Manager)" : "John Doe"}
          />

          {role === 'employer' && (
            <FormInput 
              label="Company Name *" 
              value={form.company} 
              onChange={(e) => handleInputChange('company', e.target.value)} 
              error={errors.company} 
              placeholder="Acme Corp"
            />
          )}

          <FormInput 
            label="Email Address" 
            type="email" 
            value={form.email} 
            onChange={(e) => handleInputChange('email', e.target.value)} 
            error={errors.email} 
            placeholder="you@example.com"
          />

          <FormInput 
            label="Password" 
            type="password" 
            value={form.password} 
            onChange={(e) => handleInputChange('password', e.target.value)} 
            error={errors.password} 
            placeholder="Min. 6 characters"
          />

          <FormInput 
            label="Confirm Password" 
            type="password" 
            value={form.confirmPassword} 
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)} 
            error={errors.confirmPassword} 
            placeholder="Repeat password"
          />

          {errors.submit && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
              {errors.submit}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70"
          >
            {loading ? 'Creating Account...' : `Sign Up as ${role === 'employer' ? 'Employer' : 'Job Seeker'}`}
          </button>
        </form>

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
