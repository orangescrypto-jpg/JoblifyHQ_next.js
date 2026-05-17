import type { Metadata } from 'next';
import Signup from '@/pages/Signup';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join JoblifyHQ today to find jobs, scholarships and career resources tailored for you.',
};

export default function SignupPage() {
  return <Signup />;
}
