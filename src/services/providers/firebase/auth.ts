// src/services/providers/firebase/auth.ts
// ─── Firebase Auth Provider ───────────────────────────────────────────────────

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import type { AppUser, UserRole } from '@/types';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const AuthService = {

  onAuthStateChanged(callback: (user: AppUser | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { callback(null); return; }
      try {
        const userRef  = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const p = userSnap.data();
          callback({
            uid:         firebaseUser.uid,
            email:       firebaseUser.email ?? '',
            name:        p.name || firebaseUser.displayName || 'User',
            role:        p.role        || 'user',
            company:     p.company     || null,
            tier:        p.tier        || 'free',
            photoURL:    firebaseUser.photoURL || p.photoURL,
            createdAt:   p.createdAt,
            updatedAt:   p.updatedAt,
            provider:    p.provider    || 'password',
            country:     p.country     || '',
            // payout details for freelancers
            payoutDetails: p.payoutDetails || undefined,
            // premium
            premiumExpiresAt: p.premiumExpiresAt,
            premiumPlan:      p.premiumPlan,
            // extra profile
            bio:      p.bio,
            phone:    p.phone,
            website:  p.website,
            linkedin: p.linkedin,
            skills:   p.skills,
            isVerified:       p.isVerified,
            employerVerified: p.employerVerified,
            moderatorPermissions: p.moderatorPermissions,
            notifications:    p.notifications,
            privacySettings:  p.privacySettings,
          } as AppUser);
        } else {
          // First-time Google / social login — create a basic profile
          const newProfile = {
            email:     firebaseUser.email,
            name:      firebaseUser.displayName || 'User',
            role:      'user' as UserRole,
            tier:      'free',
            country:   '',
            photoURL:  firebaseUser.photoURL,
            provider:  firebaseUser.providerData[0]?.providerId || 'password',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          callback({
            uid:      firebaseUser.uid,
            email:    firebaseUser.email ?? '',
            name:     newProfile.name,
            role:     'user',
            company:  null,
            tier:     'free',
            country:  '',
            photoURL: firebaseUser.photoURL,
            provider: newProfile.provider,
          } as AppUser);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        callback(null);
      }
    });
  },

  /**
   * Email/password sign-up.
   * country is required — it drives payment routing throughout the app.
   */
  async signup(
    email: string,
    password: string,
    name: string,
    role: UserRole = 'user',
    company: string | null = null,
    country: string = '',
  ) {
    const { user: fu } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(fu, { displayName: name });

    const tierMap: Partial<Record<UserRole, string>> = {
      employer:   'employer-free',
      freelancer: 'freelancer-free',
    };

    await setDoc(doc(db, 'users', fu.uid), {
      name,
      email,
      role,
      country,
      company:   role === 'employer' ? company : null,
      tier:      tierMap[role] || 'free',
      photoURL:  null,
      provider:  'password',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, user: fu };
  },

  async login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  },

  async loginWithGoogle() {
    const { user: fu } = await signInWithPopup(auth, googleProvider);
    const userRef = doc(db, 'users', fu.uid);
    if (!(await getDoc(userRef)).exists()) {
      await setDoc(userRef, {
        name:      fu.displayName || 'User',
        email:     fu.email,
        role:      'user',
        tier:      'free',
        country:   '', // user should update in settings after first login
        photoURL:  fu.photoURL,
        provider:  'google',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return { success: true };
  },

  async logout() {
    await signOut(auth);
    return { success: true };
  },

  async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent.' };
  },

  async updateUserProfile(userId: string, updates: Partial<AppUser>) {
    await updateDoc(doc(db, 'users', userId), { ...updates, updatedAt: serverTimestamp() });
    return { success: true };
  },

  async updateUserRole(adminUser: AppUser, userId: string, newRole: UserRole) {
    if (adminUser.role !== 'admin') throw new Error('Unauthorized.');
    await updateDoc(doc(db, 'users', userId), { role: newRole, updatedAt: serverTimestamp() });
    return { success: true };
  },
};
