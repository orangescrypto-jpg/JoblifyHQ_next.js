'use client';
import { usePlatform } from '@/context/PlatformContext';

export default function MaintenanceScreen({ children }: { children: React.ReactNode }) {
  const { settings, loading } = usePlatform();
  if (loading) return null;
  if (settings.maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-6">🔧</p>
          <h1 className="text-2xl font-bold mb-3">{settings.siteName} is under maintenance</h1>
          <p className="text-gray-400">{settings.siteTagline}</p>
          <p className="text-sm text-gray-500 mt-6">We'll be back shortly. Thank you for your patience.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
