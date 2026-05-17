'use client';
import type { Metadata } from 'next';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout><Dashboard /></MainLayout>
    </ProtectedRoute>
  );
}
