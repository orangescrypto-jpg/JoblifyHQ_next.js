'use client';
import { useEffect } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
        <FiAlertTriangle size={28} className="text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">{error.message || 'An unexpected error occurred. Please try again.'}</p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary flex items-center gap-2">
          <FiRefreshCw size={16} /> Try Again
        </button>
        <Link href="/" className="btn-secondary flex items-center gap-2">
          <FiHome size={16} /> Go Home
        </Link>
      </div>
    </div>
  );
}
