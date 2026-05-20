// src/services/providers/firebase/auth.ts
// ─── Firebase Auth Provider ───────────────────────────────────────────────────
// All Firebase auth logic lives here. Nothing outside this folder touches Firebase.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  UserCredential,
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
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profile = userSnap.data();
          callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            name: profile.name || firebaseUser.displayName || 'User',
            role: profile.role || 'user',
            company: profile.company || null,
            tier: profile.tier || 'free',
            photoURL: firebaseUser.photoURL || profile.photoURL,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
            provider: profile.provider || 'password',
          });
        } else {
          const newProfile = {
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'User',
            role: 'user' as UserRole,
            tier: 'free',
            photoURL: firebaseUser.photoURL,
            provider: firebaseUser.providerData[0]?.providerId || 'password',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            name: newProfile.name,
            role: 'user',
            company: null,
            tier: 'free',
            photoURL: firebaseUser.photoURL,
            provider: newProfile.provider,
          });
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        callback(null);
      }
    });
  },

  async signup(email: string, password: string, name: string, role: UserRole = 'user', company: string | null = null) {
    const { user: fu } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(fu, { displayName: name });
    const profile = {
      name, email, role,
      company: role === 'employer' ? company : null,
      tier: role === 'employer' ? 'employer-free' : 'free',
      photoURL: null,
      provider: 'password',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', fu.uid), profile);
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
        name: fu.displayName || 'User',
        email: fu.email,
        role: 'user',
        tier: 'free',
        photoURL: fu.photoURL,
        provider: 'google',
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
