import type { Metadata } from 'next';
import ForgotPassword from '@/pages/ForgotPassword';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your JoblifyHQ account password.',
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
