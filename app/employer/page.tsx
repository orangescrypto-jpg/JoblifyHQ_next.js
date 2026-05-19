'use client';
export const dynamic = 'force-dynamic';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import EmployerLayout from '@/layouts/EmployerLayout';
import EmployerDashboard from '@/pages/employer/EmployerDashboard';

export default function EmployerPage() {
  return (
    <ProtectedRoute roleRequired="employer">
      <EmployerLayout><EmployerDashboard /></EmployerLayout>
    </ProtectedRoute>
  );
}
