'use client';
// FeatureGate — wrap any section/page in this to respect platform feature flags
// Usage: <FeatureGate feature="freelanceEnabled">...</FeatureGate>
import { usePlatform } from '@/context/PlatformContext';
import type { PlatformFeatureFlags } from '@/types';
import type { ReactNode } from 'react';

interface Props {
  feature: keyof PlatformFeatureFlags;
  fallback?: ReactNode;
  children: ReactNode;
}

export default function FeatureGate({ feature, fallback, children }: Props) {
  const { isFeatureEnabled, loading } = usePlatform();
  if (loading) return null;
  if (!isFeatureEnabled(feature)) {
    return fallback ? <>{fallback}</> : (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-4xl mb-3">🚧</p>
          <p className="font-medium">This feature is currently unavailable.</p>
          <p className="text-sm mt-1">Check back soon.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
