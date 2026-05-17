'use client';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import EmployerLayout from '@/layouts/EmployerLayout';
import EmployerListings from '@/pages/employer/EmployerListings';

export default function ListingsPage() {
  return (
    <ProtectedRoute roleRequired="employer">
      <EmployerLayout><EmployerListings /></EmployerLayout>
    </ProtectedRoute>
  );
}
