import type { Metadata } from 'next';
import MainLayout from '@/layouts/MainLayout';
import Home from '@/pages/Home';

export const metadata: Metadata = {
  title: 'Jobs, Scholarships & Career Insights',
  description: 'Discover top jobs, scholarships, salary insights and career resources. JoblifyHQ is your one-stop career platform.',
};

export default function HomePage() {
  return (
    <MainLayout showTicker>
      <Home />
    </MainLayout>
  );
}
