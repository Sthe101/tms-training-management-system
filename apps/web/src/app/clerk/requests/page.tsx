'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Department {
  id: string;
  name: string;
}

interface Division {
  id: string;
  name: string;
  departments: Department[];
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Required',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-red-100 text-red-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-600',
  COMPLETED: 'bg-green-100 text-green-700',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ClerkRequestsPage() {
  const router = useRouter();
  const toast = useToast();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const filtersInitialized = useRef(false);

  // Filters
  const [search, setSearch] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');

  const availableDepartments = divisionId
    ? (divisions.find((d) => d.id === divisionId)?.departments ?? [])
    : [];

  // Initial load — fetches divisions (static) + first request list together
  const loadInitial = useCallback(async () => {
    try {
      const res = await api.clerk.getRequests({}) as { requests: RequestItem[]; divisions: Division[] };
      setDivisions(res.divisions);
      setRequests(res.requests);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
      filtersInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter changes — only re-fetch requests (divisions already in state)
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (divisionId) params.divisionId = divisionId;
      if (departmentId) params.departmentId = departmentId;
      if (status) params.status = status;

      const res = await api.clerk.getRequests(params) as { requests: RequestItem[]; divisions: Division[] };
      setRequests(res.requests);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, divisionId, departmentId, status]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => {
    if (!filtersInitialized.current) return;
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, divisionId, departmentId, status]);

  function handleDivisionChange(val: string) {
    setDivisionId(val === 'all' ? '' : val);
    setDepartmentId('');
  }

  function handleDepartmentChange(val: string) {
    setDepartmentId(val === 'all' ? '' : val);
  }

  function handleStatusChange(val: string) {
    setStatus(val === 'all' ? '' : val);
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Training Requests</h1>
        <p className="text-sm text-[#0891b2] mt-1">
          View and manage all training requests from managers
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Filters</h2>
        <p className="text-xs text-gray-400 mb-4">Filter requests by division, department, or status</p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search training or manager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={divisionId || 'all'} onValueChange={handleDivisionChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={departmentId || 'all'}
            onValueChange={handleDepartmentChange}
            disabled={!divisionId}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {availableDepartments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Required</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            All Requests {!loading && `(${requests.length})`}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            No requests found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">
                  Training Type
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">
                  Division
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">
                  Department
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">
                  Manager
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">
                  Employees
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">
                  Due Date
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, idx) => (
                <tr
                  key={req.id}
                  className={idx !== requests.length - 1 ? 'border-b border-gray-50' : ''}
                >
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {req.trainingCategory.name}
                  </td>
                  <td className="px-5 py-4 text-[#0891b2]">
                    {req.division?.name ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-[#0891b2]">
                    {req.department?.name ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-gray-700">{req.managerName}</td>
                  <td className="px-5 py-4 text-gray-700">{req.employeeCount}</td>
                  <td className="px-5 py-4 text-gray-700">{fmtDate(req.dueDate)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[req.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_LABEL[req.status] ?? req.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => router.push(`/clerk/requests/${req.id}`)}
                      className="text-sm border border-gray-200 rounded-md px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
