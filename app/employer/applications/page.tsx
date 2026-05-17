'use client';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import EmployerLayout from '@/layouts/EmployerLayout';
import EmployerApplications from '@/pages/employer/EmployerApplications';

export default function ApplicationsPage() {
  return (
    <ProtectedRoute roleRequired="employer">
      <EmployerLayout><EmployerApplications /></EmployerLayout>
    </ProtectedRoute>
  );
}
