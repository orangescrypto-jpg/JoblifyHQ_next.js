'use client';
import { ReactNode } from 'react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import LiveTicker from '@/components/common/LiveTicker';

interface MainLayoutProps {
  children?: ReactNode;
  showTicker?: boolean;
}

export default function MainLayout({ children, showTicker = false }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {showTicker && <LiveTicker />}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
      <Footer />
    </div>
  );
}
