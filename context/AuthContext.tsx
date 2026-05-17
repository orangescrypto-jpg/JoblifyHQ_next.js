'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import type { AppUser, UserRole } from '@/types';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string, name: string, role?: UserRole, company?: string | null) => Promise<{ success: boolean; user: UserCredential['user'] }>;
  login: (email: string, password: string) => Promise<{ success: boolean }>;
  loginWithGoogle: () => Promise<{ success: boolean }>;
  logout: () => Promise<{ success: boolean }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<{ success: boolean } | undefined>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<{ success: boolean }>;
  isAdmin: () => boolean;
  isEmployer: () => boolean;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const profile = userSnap.data();
            setUser({
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
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email ?? '', name: newProfile.name, role: 'user', company: null, tier: 'free', photoURL: firebaseUser.photoURL, provider: newProfile.provider });
          }
        } else {
          setUser(null);
        }
        setError(null);
      } catch (err) {
        console.error('Auth state change error:', err);
        setError('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, name: string, role: UserRole = 'user', company: string | null = null) => {
    try {
      setError(null);
      const { user: fu } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(fu, { displayName: name });
      const profile = { name, email, role, company: role === 'employer' ? company : null, tier: role === 'employer' ? 'employer-free' : 'free', photoURL: null, provider: 'password', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
      await setDoc(doc(db, 'users', fu.uid), profile);
      setUser({ uid: fu.uid, email, name, role, company: role === 'employer' ? company : null, tier: profile.tier as AppUser['tier'], photoURL: null, provider: 'password' });
      return { success: true, user: fu };
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      let message = 'Failed to create account.';
      if (e.code === 'auth/email-already-in-use') message = 'Email already registered.';
      else if (e.code === 'auth/weak-password') message = 'Password must be at least 6 characters.';
      setError(message); throw new Error(message);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      const message = e.code === 'auth/too-many-requests' ? 'Too many attempts. Try later.' : 'Invalid email or password.';
      setError(message); throw new Error(message);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const { user: fu } = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', fu.uid);
      if (!(await getDoc(userRef)).exists()) {
        await setDoc(userRef, { name: fu.displayName || 'User', email: fu.email, role: 'user', tier: 'free', photoURL: fu.photoURL, provider: 'google', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      return { success: true };
    } catch (err: unknown) {
      const e = err as { message?: string };
      const message = e.message || 'Google sign-in failed.';
      setError(message); throw new Error(message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null); setError(null);
    return { success: true };
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent.' };
    } catch (err: unknown) {
      const message = 'Failed to send reset email.';
      setError(message); throw new Error(message);
    }
  };

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'users', user.uid), { ...updates, updatedAt: serverTimestamp() });
    setUser(prev => prev ? { ...prev, ...updates } : null);
    return { success: true };
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (!user || user.role !== 'admin') throw new Error('Unauthorized.');
    await updateDoc(doc(db, 'users', userId), { role: newRole, updatedAt: serverTimestamp() });
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signup, login, loginWithGoogle, logout, resetPassword, updateUserProfile, updateUserRole, isAdmin: () => user?.role === 'admin', isEmployer: () => user?.role === 'employer', isAuthenticated: () => !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
