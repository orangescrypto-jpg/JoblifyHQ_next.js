'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children?: ReactNode;
  roleRequired?: UserRole;
}

export default function ProtectedRoute({ children, roleRequired }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (roleRequired && user.role !== roleRequired) {
      if (user.role === 'admin') router.replace('/admin');
      else if (user.role === 'employer') router.replace('/employer');
      else router.replace('/dashboard');
    }
  }, [user, loading, roleRequired, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) return null;
  if (roleRequired && user.role !== roleRequired) return null;

  return <>{children}</>;
}
