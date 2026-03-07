'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmployeeStatus {
  employeeId: string;
  name: string;
  employeeNumber: string;
  status: string;
  dueDate: string | null;
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
  employees: EmployeeStatus[];
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

function toDateInput(iso: string | null | undefined, fallback: string): string {
  if (iso) return iso.slice(0, 10);
  if (fallback) return fallback.slice(0, 10);
  return '';
}

// ─── Employee Card ────────────────────────────────────────────────────────────

function EmployeeCard({
  emp,
  requestDueDate,
  onSave,
}: {
  emp: EmployeeStatus;
  requestDueDate: string;
  onSave: (employeeId: string, status: string, dueDate: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(emp.status);
  const [dueDate, setDueDate] = useState(toDateInput(emp.dueDate, requestDueDate));
  const [saving, setSaving] = useState(false);

  // Sync if parent refreshes
  useEffect(() => {
    setStatus(emp.status);
    setDueDate(toDateInput(emp.dueDate, requestDueDate));
  }, [emp.status, emp.dueDate, requestDueDate]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(emp.employeeId, status, dueDate);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setStatus(emp.status);
    setDueDate(toDateInput(emp.dueDate, requestDueDate));
    setEditing(false);
  }

  const displayDue = emp.dueDate ?? requestDueDate;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{emp.name}</p>
          <p className="text-sm text-[#0891b2]">{emp.employeeNumber}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[emp.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABEL[emp.status] ?? emp.status}
        </span>
      </div>

      {!editing ? (
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Due: {fmtDate(displayDue)}</span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
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
          <div>
            <Label className="text-sm">Due Date</Label>
            <Input
              type="date"
              className="mt-1"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#0f3460] hover:bg-[#0a2540] text-sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleCancel} className="text-sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.clerk.getRequestById(id) as { request: RequestDetail };
      setRequest(res.request);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load request');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveEmployee(employeeId: string, status: string, dueDate: string) {
    try {
      const res = await api.clerk.updateEmployeeStatus(id, employeeId, {
        status,
        dueDate: dueDate || null,
      }) as { request: RequestDetail };
      setRequest(res.request);
      toast.success('Employee status updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
      throw err;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Request not found.
      </div>
    );
  }

  const shortId = request.id.slice(0, 8).toUpperCase();

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
        <h1 className="text-xl font-bold text-gray-900">{request.trainingCategory.name}</h1>
        <p className="text-sm text-[#0891b2] mt-1">
          Request ID: {shortId} | Created: {fmtDate(request.createdAt)}
        </p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Manager</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{request.managerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Division</p>
            <p className="text-sm font-medium text-[#0891b2] mt-0.5">
              {request.division?.name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Department</p>
            <p className="text-sm font-medium text-[#0891b2] mt-0.5">
              {request.department?.name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Request Due Date</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{fmtDate(request.dueDate)}</p>
          </div>
        </div>
      </div>

      {/* Employee Training Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">
            Employee Training Status ({request.employees.length})
          </h2>
        </div>
        <p className="text-sm text-gray-400 mb-5">
          Update training status and due dates for each employee
        </p>

        {request.employees.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            No employees assigned to this request.
          </div>
        ) : (
          <div className="space-y-3">
            {request.employees.map((emp) => (
              <EmployeeCard
                key={emp.employeeId}
                emp={emp}
                requestDueDate={request.dueDate}
                onSave={handleSaveEmployee}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
