'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, User, Mail, Building2, Layers } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';

interface ProfileData {
  user: { id: string; name: string; email: string; role: string };
  employee: {
    id: string;
    name: string;
    employeeNumber: string;
    department: {
      name: string;
      division: { name: string };
    };
  } | null;
}

const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  CLERK: '/clerk/dashboard',
};

export default function PendingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Redirect away as soon as we know the user has a real role assigned
  useEffect(() => {
    if (loading || !user) return;
    const destination = ROLE_REDIRECT[user.role];
    if (destination) {
      router.replace(destination);
    }
  }, [user, loading, router]);

  const load = useCallback(async () => {
    try {
      const res = await api.auth.getProfile() as ProfileData;
      setProfile(res);
    } catch {
      // non-critical — we already have user from auth context
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const emp = profile?.employee;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Status card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Account Pending Assignment
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Your account has been created successfully. An admin will review your
            details and assign you a role. You&apos;ll be redirected to the right
            portal automatically on your next login.
          </p>

          {/* Info rows */}
          <div className="bg-[#f8fafc] rounded-xl border border-gray-100 p-4 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#e0f2fe] rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-[#0891b2]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Full Name</p>
                <p className="text-sm font-medium text-gray-900">{user?.name ?? '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#e0f2fe] rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-3.5 h-3.5 text-[#0891b2]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900">{user?.email ?? '—'}</p>
              </div>
            </div>

            {emp && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-[#e0f2fe] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-[#0891b2]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Division</p>
                    <p className="text-sm font-medium text-gray-900">{emp.department.division.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-[#e0f2fe] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Layers className="w-3.5 h-3.5 text-[#0891b2]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Department</p>
                    <p className="text-sm font-medium text-gray-900">{emp.department.name}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-6">
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
