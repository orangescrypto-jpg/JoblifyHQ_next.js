import type { Metadata } from 'next';
import MainLayout from '@/layouts/MainLayout';
import PrivacyPolicy from '@/pages/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the JoblifyHQ privacy policy to understand how we collect, use and protect your data.',
};

export default function PrivacyPolicyPage() {
  return <MainLayout><PrivacyPolicy /></MainLayout>;
}
