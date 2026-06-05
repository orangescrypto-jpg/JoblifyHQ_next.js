// src/services/providers/firebase/platform.ts
// ─── Platform Settings & Feature Flags ──────────────────────────────────────
// Admin-controlled platform configuration stored in Firestore.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { PlatformSettings, PlatformFeatureFlags } from '@/types';

export const DEFAULT_FEATURES: PlatformFeatureFlags = {
  freelanceEnabled:    true,
  escrowEnabled:       true,
  scholarshipsEnabled: true,
  blogEnabled:         true,
  salaryPortalEnabled: true,
  skillBadgesEnabled:  true,
  resumeBuilderEnabled:true,
  aiMatchingEnabled:   true,
  servicesEnabled:     true,
  kycEnabled:          true,
  referralsEnabled:    true,
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  siteName:              'JoblifyHQ',
  siteTagline:           'Africa\'s #1 Job & Freelance Marketplace',
  maintenanceMode:       false,
  allowNewRegistrations: true,
  requireJobApproval:    false,
  requireGigApproval:    false,
  escrowFeePercent:      5,
  featuredJobDays:       14,
  features:              DEFAULT_FEATURES,
};

export const PlatformService = {

  async getSettings(): Promise<PlatformSettings> {
    const ref = doc(db, 'admin_config', 'platform_settings');
    const snap = await getDoc(ref);
    if (!snap.exists()) return DEFAULT_PLATFORM_SETTINGS;
    const data = snap.data();
    return {
      ...DEFAULT_PLATFORM_SETTINGS,
      ...data,
      features: { ...DEFAULT_FEATURES, ...(data.features || {}) },
    } as PlatformSettings;
  },

  async saveSettings(settings: Partial<PlatformSettings>, adminUid: string): Promise<void> {
    const ref = doc(db, 'admin_config', 'platform_settings');
    await setDoc(ref, { ...settings, updatedAt: serverTimestamp(), updatedBy: adminUid }, { merge: true });
  },

  async toggleFeature(feature: keyof PlatformFeatureFlags, enabled: boolean, adminUid: string): Promise<void> {
    const ref = doc(db, 'admin_config', 'platform_settings');
    await setDoc(ref, {
      features: { [feature]: enabled },
      updatedAt: serverTimestamp(),
      updatedBy: adminUid,
    }, { merge: true });
  },

  async isFeatureEnabled(feature: keyof PlatformFeatureFlags): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.features[feature] ?? true;
  },
};
