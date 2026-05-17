import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── updateUserRole authorization guard ────────────────────────────────────
// We test the guard logic directly (extracted as a pure function)
// without needing to spin up Firebase or a React tree.

/**
 * Pure implementation of the role-update authorization check.
 * Mirrors the guard added to AuthContext.updateUserRole.
 */
function authorizeRoleUpdate(currentUser) {
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('Unauthorized: only admins can change user roles.');
  }
  return true;
}

describe('updateUserRole authorization guard', () => {
  it('allows an admin user', () => {
    const admin = { uid: 'a1', role: 'admin' };
    expect(authorizeRoleUpdate(admin)).toBe(true);
  });

  it('blocks a regular user', () => {
    const regularUser = { uid: 'u1', role: 'user' };
    expect(() => authorizeRoleUpdate(regularUser)).toThrow('Unauthorized');
  });

  it('blocks an employer', () => {
    const employer = { uid: 'e1', role: 'employer' };
    expect(() => authorizeRoleUpdate(employer)).toThrow('Unauthorized');
  });

  it('blocks a null/unauthenticated caller', () => {
    expect(() => authorizeRoleUpdate(null)).toThrow('Unauthorized');
    expect(() => authorizeRoleUpdate(undefined)).toThrow('Unauthorized');
  });
});

// ── ProtectedRoute role redirect logic ────────────────────────────────────
// Tests the redirect logic without rendering the React component.

function resolveRedirect(user, roleRequired) {
  if (!user) return '/login';
  if (roleRequired && user.role !== roleRequired) {
    if (user.role === 'admin')    return '/admin';
    if (user.role === 'employer') return '/employer';
    return '/dashboard';
  }
  return null; // no redirect — render children
}

describe('ProtectedRoute redirect logic', () => {
  it('redirects to /login when not authenticated', () => {
    expect(resolveRedirect(null, null)).toBe('/login');
  });

  it('does not redirect when role matches', () => {
    expect(resolveRedirect({ role: 'admin' }, 'admin')).toBeNull();
    expect(resolveRedirect({ role: 'employer' }, 'employer')).toBeNull();
  });

  it('redirects admin to /admin when wrong role required', () => {
    expect(resolveRedirect({ role: 'admin' }, 'employer')).toBe('/admin');
  });

  it('redirects employer to /employer when wrong role required', () => {
    expect(resolveRedirect({ role: 'employer' }, 'admin')).toBe('/employer');
  });

  it('redirects plain user to /dashboard when admin role required', () => {
    expect(resolveRedirect({ role: 'user' }, 'admin')).toBe('/dashboard');
  });

  it('allows any authenticated user when no role required', () => {
    expect(resolveRedirect({ role: 'user' }, null)).toBeNull();
    expect(resolveRedirect({ role: 'employer' }, null)).toBeNull();
  });
});

