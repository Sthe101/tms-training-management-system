'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmployeeItem {
  employeeId: string;
  name: string;
  employeeNumber: string;
}

interface RequestDetail {
  id: string;
  trainingCategory: { id: string; name: string };
  managerName: string;
  department: { id: string; name: string } | null;
  division: { id: string; name: string } | null;
  dueDate: string;
  status: string;
  createdAt: string;
  employees: EmployeeItem[];
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

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.clerk.getRequestById(id) as { request: RequestDetail };
      setRequest(res.request);
      setStatus(res.request.status);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load request');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleSaveStatus() {
    if (!request || status === request.status) return;
    setSaving(true);
    try {
      const res = await api.clerk.updateRequestStatus(id, status) as { request: RequestDetail };
      setRequest(res.request);
      toast.success('Status updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  }

  if (!request) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Request not found.</div>;
  }

  const shortId = request.id.slice(0, 8).toUpperCase();
  const statusChanged = status !== request.status;

  return (
    <>
      {/* Back nav */}
      <button
        onClick={() => router.push('/clerk/requests')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Requests
      </button>

      {/* Request header card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{request.trainingCategory.name}</h1>
            <p className="text-sm text-[#0891b2] mt-1">
              Request ID: {shortId} | Created: {fmtDate(request.createdAt)}
            </p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[request.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[request.status] ?? request.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Manager</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{request.managerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Division</p>
            <p className="text-sm font-medium text-[#0891b2] mt-0.5">{request.division?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Department</p>
            <p className="text-sm font-medium text-[#0891b2] mt-0.5">{request.department?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Request Due Date</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{fmtDate(request.dueDate)}</p>
          </div>
        </div>
      </div>

      {/* Update Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">Update Status</h2>
        <p className="text-sm text-gray-400 mb-4">Change the training request status</p>
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Label className="text-sm">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Required</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSaveStatus}
            disabled={saving || !statusChanged}
            className="bg-[#0f3460] hover:bg-[#0a2540]"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Assigned Employees */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">
            Assigned Employees ({request.employees.length})
          </h2>
        </div>
        <p className="text-sm text-gray-400 mb-5">Employees included in this training request</p>

        {request.employees.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">No employees assigned.</div>
        ) : (
          <div className="space-y-2">
            {request.employees.map((emp) => (
              <div key={emp.employeeId} className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                  <p className="text-xs text-[#0891b2]">{emp.employeeNumber}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
