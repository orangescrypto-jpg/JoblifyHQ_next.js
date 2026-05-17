import type { Metadata } from 'next';
import MainLayout from '@/layouts/MainLayout';
import TermsConditions from '@/pages/TermsConditions';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Read the JoblifyHQ terms and conditions of service.',
};

export default function TermsPage() {
  return <MainLayout><TermsConditions /></MainLayout>;
}
