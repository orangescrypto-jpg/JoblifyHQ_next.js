'use client';
export const dynamic = 'force-dynamic';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import EmployerLayout from '@/layouts/EmployerLayout';
import EmployerPostJob from '@/pages/employer/EmployerPostJob';

export default function PostJobPage() {
  return (
    <ProtectedRoute roleRequired="employer">
      <EmployerLayout><EmployerPostJob /></EmployerLayout>
    </ProtectedRoute>
  );
}
