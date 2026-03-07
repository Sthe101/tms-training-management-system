'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, TrendingUp, FileText, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Department {
  id: string;
  name: string;
}

interface Division {
  id: string;
  name: string;
}

interface TrainingCategory {
  id: string;
  name: string;
}

interface RequestItem {
  id: string;
  trainingCategory: TrainingCategory;
  managerName: string;
  department: Department | null;
  division: Division | null;
  employeeCount: number;
  dueDate: string;
  status: string;
}

interface DashboardData {
  stats: {
    requiredCount: number;
    inProgressCount: number;
    completedCount: number;
  };
  recentRequests: RequestItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </div>
      <Icon className={`w-5 h-5 mt-1 ${iconColor}`} />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ClerkDashboard() {
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.clerk.getDashboard() as DashboardData;
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    );
  }

  const { stats, recentRequests } = data ?? {
    stats: { requiredCount: 0, inProgressCount: 0, completedCount: 0 },
    recentRequests: [],
  };

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clerk Portal</h1>
        <p className="text-sm text-[#0891b2] mt-1">
          Process training requests and manage employee training assignments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Required"
          value={stats.requiredCount}
          sub="Awaiting assignment"
          icon={ClipboardList}
          iconColor="text-gray-400"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgressCount}
          sub="Currently underway"
          icon={TrendingUp}
          iconColor="text-[#0891b2]"
        />
        <StatCard
          label="Completed"
          value={stats.completedCount}
          sub="Successfully finished"
          icon={FileText}
          iconColor="text-gray-400"
        />
      </div>

      {/* Incoming Requests */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Incoming Requests</h2>
        <Button
          onClick={() => router.push('/clerk/requests')}
          className="bg-[#0f3460] hover:bg-[#0a2540] text-sm"
        >
          View All
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900">New Training Requests</h3>
          <p className="text-sm text-gray-400 mt-0.5">Requests awaiting your assignment</p>
        </div>

        {recentRequests.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            No pending requests at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {recentRequests.map((req, idx) => (
              <div
                key={req.id}
                className={`flex items-center justify-between py-3 ${
                  idx !== recentRequests.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {req.trainingCategory.name}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                      Required
                    </span>
                  </div>
                  {req.division && req.department && (
                    <p className="text-sm text-[#0891b2]">
                      {req.division.name}
                      <ChevronRight className="w-3 h-3 inline-block mx-0.5" />
                      {req.department.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Manager: {req.managerName} | {req.employeeCount} employee{req.employeeCount !== 1 ? 's' : ''} | Due: {fmtDate(req.dueDate)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="text-sm shrink-0 ml-4"
                  onClick={() => router.push(`/clerk/requests/${req.id}`)}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
