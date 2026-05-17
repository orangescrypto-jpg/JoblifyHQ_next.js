import type { Metadata } from 'next';
import Login from '@/pages/Login';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your JoblifyHQ account to access saved jobs, applications and more.',
};

export default function LoginPage() {
  return <Login />;
}
