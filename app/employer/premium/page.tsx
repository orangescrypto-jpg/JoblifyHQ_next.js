'use client';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import EmployerLayout from '@/layouts/EmployerLayout';
import EmployerPremium from '@/pages/employer/EmployerPremium';

export default function EmployerPremiumPage() {
  return (
    <ProtectedRoute roleRequired="employer">
      <EmployerLayout><EmployerPremium /></EmployerLayout>
    </ProtectedRoute>
  );
}
