'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PlatformService } from '@/src/services/providers/firebase/platform';
import type { PlatformSettings } from '@/types';
import { DEFAULT_PLATFORM_SETTINGS } from '@/src/services/providers/firebase/platform';

interface PlatformContextValue {
  settings: PlatformSettings;
  loading: boolean;
  isFeatureEnabled: (feature: keyof PlatformSettings['features']) => boolean;
  refresh: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export const PlatformProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    try {
      const s = await PlatformService.getSettings();
      setSettings(s);
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <PlatformContext.Provider value={{
      settings, loading,
      isFeatureEnabled: (f) => settings.features[f] ?? true,
      refresh: load,
    }}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
};
