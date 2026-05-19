import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import MainLayout from '@/layouts/MainLayout';
import EmployerProfile from '@/pages/EmployerProfile';

export const metadata: Metadata = {
  title: 'Employer Profile',
  description: 'View employer profile, active job listings and company information on JoblifyHQ.',
};

export default function EmployerProfilePage() {
  return <MainLayout><EmployerProfile /></MainLayout>;
}
