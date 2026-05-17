'use client';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import Admin from '@/pages/Admin';

export default function AdminPage() {
  return (
    <ProtectedRoute roleRequired="admin">
      <MainLayout><Admin /></MainLayout>
    </ProtectedRoute>
  );
}
