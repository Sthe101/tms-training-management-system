'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  CLERK: '/clerk/dashboard',
  EMPLOYEE: '/employee/pending',
};

/**
 * Redirects the user to their role's home page if their current role
 * does not match the required role for this portal.
 * Uses the live role from GET /auth/me (always fresh from DB),
 * so promotions take effect on next page load without requiring re-login.
 */
export function useRoleGuard(requiredRole: string) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== requiredRole) {
      const destination = ROLE_HOME[user.role] ?? '/login';
      router.replace(destination);
    }
  }, [user, loading, requiredRole, router]);
}
