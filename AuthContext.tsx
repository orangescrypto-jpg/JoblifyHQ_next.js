'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/src/services/auth';
import type { AppUser, UserRole } from '@/types';
import type { UserCredential } from 'firebase/auth';

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

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser]       = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((resolvedUser) => {
      setUser(resolvedUser);
      setError(null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, name: string, role: UserRole = 'user', company: string | null = null) => {
    try {
      setError(null);
      const result = await AuthService.signup(email, password, name, role, company);
      return result as { success: boolean; user: UserCredential['user'] };
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
      return await AuthService.login(email, password);
    } catch (err: unknown) {
      const e = err as { code?: string };
      const message = e.code === 'auth/too-many-requests' ? 'Too many attempts. Try later.' : 'Invalid email or password.';
      setError(message); throw new Error(message);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      return await AuthService.loginWithGoogle();
    } catch (err: unknown) {
      const e = err as { message?: string };
      const message = e.message || 'Google sign-in failed.';
      setError(message); throw new Error(message);
    }
  };

  const logout = async () => {
    const result = await AuthService.logout();
    setUser(null); setError(null);
    return result;
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      return await AuthService.resetPassword(email);
    } catch {
      const message = 'Failed to send reset email.';
      setError(message); throw new Error(message);
    }
  };

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!user?.uid) return;
    const result = await AuthService.updateUserProfile(user.uid, updates);
    setUser(prev => prev ? { ...prev, ...updates } : null);
    return result;
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (!user) throw new Error('Unauthorized.');
    return await AuthService.updateUserRole(user, userId, newRole);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      signup, login, loginWithGoogle, logout, resetPassword,
      updateUserProfile, updateUserRole,
      isAdmin:         () => user?.role === 'admin',
      isEmployer:      () => user?.role === 'employer',
      isAuthenticated: () => !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
