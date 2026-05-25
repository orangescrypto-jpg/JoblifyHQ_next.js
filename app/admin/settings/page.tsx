'use client';
export const dynamic = 'force-dynamic';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminSettings from '@/pages/AdminSettings';

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute roleRequired="admin">
      <AdminSettings />
    </ProtectedRoute>
  );
}
