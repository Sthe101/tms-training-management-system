'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle,
  Calendar,
  Pencil,
  Trash2,
  UserPlus,
  Plus,
  BookOpen,
  BadgeCheck,
} from 'lucide-react';
import { apiRequest, api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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

interface CompletedTraining {
  id: string;
  trainingName: string;
  completedDate: string;
}

interface TrainingCategory {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface RequestEmployee {
  employeeId: string;
  employee: Employee;
}

interface TrainingRequest {
  id: string;
  trainingCategory: TrainingCategory;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  employees: RequestEmployee[];
}

interface TeamMember {
  id: string;
  name: string;
  employeeNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  completedCount: number;
  currentTraining: TrainingRequest | null;
}

interface DashboardData {
  stats: {
    totalEmployees: number;
    activeRequests: number;
    completedRequests: number;
    completionRate: number;
  };
  requests: TrainingRequest[];
  team: TeamMember[];
  profile: { departmentId: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

const EMPLOYEE_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-yellow-100 text-yellow-700',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const toast = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<TrainingCategory[]>([]);

  // New Request modal
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [reqCategory, setReqCategory] = useState('');
  const [reqDueDate, setReqDueDate] = useState('');
  const [reqEmployees, setReqEmployees] = useState<string[]>([]);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Edit Request modal
  const [editRequest, setEditRequest] = useState<TrainingRequest | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editEmployees, setEditEmployees] = useState<string[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Request
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);

  // Add Employee modal
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empNumber, setEmpNumber] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [submittingEmp, setSubmittingEmp] = useState(false);

  // Delete Employee
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);

  // Edit Employee modal
  const [editEmployee, setEditEmployee] = useState<TeamMember | null>(null);
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpNumber, setEditEmpNumber] = useState('');
  const [editEmpStatus, setEditEmpStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [submittingEditEmp, setSubmittingEditEmp] = useState(false);
  const [editEmpErrors, setEditEmpErrors] = useState<Record<string, string>>({});

  // Completed Trainings modal
  const [completedEmployee, setCompletedEmployee] = useState<TeamMember | null>(null);
  const [completedTrainings, setCompletedTrainings] = useState<CompletedTraining[]>([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);

  // Validation errors
  const [reqErrors, setReqErrors] = useState<Record<string, string>>({});
  const [empErrors, setEmpErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await apiRequest<DashboardData>('/manager/dashboard');
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiRequest<{ categories: TrainingCategory[] }>(
        '/manager/training-categories',
      );
      setCategories(res.categories);
    } catch {
      // silently ignore — categories load separately
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    loadCategories();
  }, [load, loadCategories]);

  // ── New Request ──────────────────────────────────────────────────────────

  function openNewRequest() {
    setReqCategory('');
    setReqDueDate('');
    setReqEmployees([]);
    setReqErrors({});
    setShowNewRequest(true);
  }

  function toggleReqEmployee(id: string) {
    setReqEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  function validateRequest(category: string, dueDate: string, employees: string[]) {
    const errs: Record<string, string> = {};
    if (!category) errs.category = 'Select a training category';
    if (!dueDate) errs.dueDate = 'Select a due date';
    if (employees.length === 0) errs.employees = 'Select at least one employee';
    return errs;
  }

  async function submitNewRequest() {
    const errs = validateRequest(reqCategory, reqDueDate, reqEmployees);
    if (Object.keys(errs).length) { setReqErrors(errs); return; }

    setSubmittingRequest(true);
    try {
      await apiRequest('/manager/requests', {
        method: 'POST',
        body: JSON.stringify({
          trainingCategoryId: reqCategory,
          dueDate: reqDueDate,
          employeeIds: reqEmployees,
        }),
      });
      toast.success('Training request created');
      setShowNewRequest(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create request');
    } finally {
      setSubmittingRequest(false);
    }
  }

  // ── Edit Request ─────────────────────────────────────────────────────────

  function openEdit(req: TrainingRequest) {
    setEditRequest(req);
    setEditStatus(req.status);
    setEditDueDate(req.dueDate.slice(0, 10));
    setEditEmployees(req.employees.map((e) => e.employeeId));
    setReqErrors({});
  }

  function toggleEditEmployee(id: string) {
    setEditEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  async function submitEdit() {
    if (!editRequest) return;
    const errs: Record<string, string> = {};
    if (!editDueDate) errs.dueDate = 'Select a due date';
    if (editEmployees.length === 0) errs.employees = 'Select at least one employee';
    if (Object.keys(errs).length) { setReqErrors(errs); return; }

    setSubmittingEdit(true);
    try {
      await apiRequest(`/manager/requests/${editRequest.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: editStatus,
          dueDate: editDueDate,
          employeeIds: editEmployees,
        }),
      });
      toast.success('Request updated');
      setEditRequest(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update request');
    } finally {
      setSubmittingEdit(false);
    }
  }

  // ── Delete Request ───────────────────────────────────────────────────────

  async function confirmDeleteRequest() {
    if (!deleteRequestId) return;
    try {
      await apiRequest(`/manager/requests/${deleteRequestId}`, { method: 'DELETE' });
      toast.success('Request deleted');
      setDeleteRequestId(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete request');
    }
  }

  // ── Add Employee ─────────────────────────────────────────────────────────

  function openAddEmployee() {
    setEmpName('');
    setEmpNumber('');
    setEmpEmail('');
    setEmpErrors({});
    setShowAddEmployee(true);
  }

  async function submitAddEmployee() {
    const errs: Record<string, string> = {};
    if (!empName.trim()) errs.name = 'Name is required';
    if (!empEmail.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empEmail.trim())) errs.email = 'Invalid email address';
    if (Object.keys(errs).length) { setEmpErrors(errs); return; }

    setSubmittingEmp(true);
    try {
      const body: { name: string; email: string; employeeNumber?: string } = {
        name: empName.trim(),
        email: empEmail.trim().toLowerCase(),
      };
      if (empNumber.trim()) body.employeeNumber = empNumber.trim();
      await apiRequest('/manager/employees', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast.success('Employee added');
      setShowAddEmployee(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add employee');
    } finally {
      setSubmittingEmp(false);
    }
  }

  // ── Edit Employee ────────────────────────────────────────────────────────

  function openEditEmployee(member: TeamMember) {
    setEditEmployee(member);
    setEditEmpName(member.name);
    setEditEmpNumber(member.employeeNumber);
    setEditEmpStatus(member.status);
    setEditEmpErrors({});
  }

  async function submitEditEmployee() {
    if (!editEmployee) return;
    const errs: Record<string, string> = {};
    if (!editEmpName.trim()) errs.name = 'Name is required';
    if (!editEmpNumber.trim()) errs.number = 'Employee number is required';
    if (Object.keys(errs).length) { setEditEmpErrors(errs); return; }

    setSubmittingEditEmp(true);
    try {
      await api.manager.updateEmployee(editEmployee.id, {
        name: editEmpName.trim(),
        employeeNumber: editEmpNumber.trim(),
        status: editEmpStatus,
      });
      toast.success('Employee updated');
      setEditEmployee(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update employee');
    } finally {
      setSubmittingEditEmp(false);
    }
  }

  // ── Completed Trainings ──────────────────────────────────────────────────

  async function openCompletedTrainings(member: TeamMember) {
    setCompletedEmployee(member);
    setCompletedTrainings([]);
    setLoadingCompleted(true);
    try {
      const res = await api.manager.getCompletedTrainings(member.id) as { trainings: CompletedTraining[] };
      setCompletedTrainings(res.trainings);
    } catch {
      // non-critical — show empty state
    } finally {
      setLoadingCompleted(false);
    }
  }

  // ── Delete Employee ──────────────────────────────────────────────────────

  async function confirmDeleteEmployee() {
    if (!deleteEmployeeId) return;
    try {
      await apiRequest(`/manager/employees/${deleteEmployeeId}`, { method: 'DELETE' });
      toast.success('Employee removed');
      setDeleteEmployeeId(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove employee');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    );
  }

  const { stats, requests, team } = data ?? {
    stats: { totalEmployees: 0, activeRequests: 0, completedRequests: 0, completionRate: 0 },
    requests: [],
    team: [],
  };

  const teamEmployees: Employee[] = team.map((m) => ({
    id: m.id,
    name: m.name,
    employeeNumber: m.employeeNumber,
    status: m.status,
  }));

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Portal</h1>
          <p className="text-sm text-[#0891b2] mt-1">
            Manage your team&apos;s training requirements and progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={openAddEmployee} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Employee
          </Button>
          <Button onClick={openNewRequest} className="flex items-center gap-2 bg-[#0f3460] hover:bg-[#0a2540]">
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Employees" value={stats.totalEmployees} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatCard label="Active Requests" value={stats.activeRequests} icon={Clock} iconBg="bg-yellow-50" iconColor="text-yellow-500" />
        <StatCard label="Completed Requests" value={stats.completedRequests} icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-500" />
      </div>

      {/* Training Requests */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Requests</h2>
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 mb-8">
          No training requests yet. Click &quot;+ New Request&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{req.trainingCategory.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[req.status]}`}>
                    {STATUS_LABEL[req.status]}
                  </span>
                  <button
                    onClick={() => openEdit(req)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteRequestId(req.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Due Date:</span>
                  <span className="font-medium text-gray-700 ml-auto">{fmt(req.dueDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Submitted:</span>
                  <span className="font-medium text-gray-700 ml-auto">{fmt(req.createdAt)}</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Assigned Employees ({req.employees.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {req.employees.map((re) => (
                    <span
                      key={re.employeeId}
                      className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full"
                    >
                      {re.employee.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Training Status */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Training Status</h2>
      {team.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
          {data?.profile
            ? 'No employees in your department yet.'
            : 'No manager profile configured. Contact an admin to link your account to a department.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">Employee</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">Unique Number</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">Completed</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">Current Training</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">Employee Status</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member, idx) => (
                <tr
                  key={member.id}
                  className={idx !== team.length - 1 ? 'border-b border-gray-50' : ''}
                >
                  <td className="px-5 py-4 font-medium text-gray-900">{member.name}</td>
                  <td className="px-5 py-4 text-[#0891b2]">{member.employeeNumber}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => member.completedCount > 0 && openCompletedTrainings(member)}
                      className={`flex items-center gap-1.5 text-gray-700 ${member.completedCount > 0 ? 'hover:text-[#0891b2] transition-colors cursor-pointer' : 'cursor-default'}`}
                      title={member.completedCount > 0 ? 'View completed trainings' : undefined}
                    >
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className={member.completedCount > 0 ? 'underline underline-offset-2 decoration-dotted' : ''}>{member.completedCount}</span>
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    {member.currentTraining ? (
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-gray-800">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span>{member.currentTraining.trainingCategory.name}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Due: {fmt(member.currentTraining.dueDate)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not in training</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${EMPLOYEE_STATUS_STYLES[member.status]}`}>
                      {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditEmployee(member)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteEmployeeId(member.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── New Request Modal ── */}
      <Modal open={showNewRequest} onClose={() => setShowNewRequest(false)} title="New Training Request" subtitle="Create a training request for your team">
        <div className="space-y-4">
          <div>
            <Label>Training Category</Label>
            <Select value={reqCategory} onValueChange={(v) => { setReqCategory(v); setReqErrors((e) => ({ ...e, category: '' })); }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select training..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reqErrors.category && <p className="text-xs text-red-500 mt-1">{reqErrors.category}</p>}
          </div>
          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              className="mt-1"
              value={reqDueDate}
              onChange={(e) => { setReqDueDate(e.target.value); setReqErrors((e2) => ({ ...e2, dueDate: '' })); }}
            />
            {reqErrors.dueDate && <p className="text-xs text-red-500 mt-1">{reqErrors.dueDate}</p>}
          </div>
          {teamEmployees.length > 0 && (
            <div>
              <Label>Assign Employees</Label>
              <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                {teamEmployees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={reqEmployees.includes(emp.id)}
                      onChange={() => { toggleReqEmployee(emp.id); setReqErrors((e) => ({ ...e, employees: '' })); }}
                      className="w-4 h-4 rounded border-gray-300 text-[#0f3460]"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.employeeNumber}</p>
                    </div>
                  </label>
                ))}
              </div>
              {reqErrors.employees && <p className="text-xs text-red-500 mt-1">{reqErrors.employees}</p>}
            </div>
          )}
          {teamEmployees.length === 0 && (
            <p className="text-sm text-gray-400">No employees in your team yet.</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
            <Button
              onClick={submitNewRequest}
              disabled={submittingRequest}
              className="bg-[#0f3460] hover:bg-[#0a2540]"
            >
              {submittingRequest ? 'Creating...' : 'Create Request'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Request Modal ── */}
      <Modal open={!!editRequest} onClose={() => setEditRequest(null)} title="Edit Training Request" subtitle="Update the training request details and manage assigned employees.">
        {editRequest && (
          <div className="space-y-4">
            <div>
              <Label>Training Type</Label>
              <div className="mt-1 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-700">
                {editRequest.trainingCategory.name}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                className="mt-1"
                value={editDueDate}
                onChange={(e) => { setEditDueDate(e.target.value); setReqErrors((e2) => ({ ...e2, dueDate: '' })); }}
              />
              {reqErrors.dueDate && <p className="text-xs text-red-500 mt-1">{reqErrors.dueDate}</p>}
            </div>
            {teamEmployees.length > 0 && (
              <div>
                <Label>Assigned Employees</Label>
                <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                  {teamEmployees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={editEmployees.includes(emp.id)}
                        onChange={() => { toggleEditEmployee(emp.id); setReqErrors((e) => ({ ...e, employees: '' })); }}
                        className="w-4 h-4 rounded border-gray-300 text-[#0f3460]"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.employeeNumber}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {reqErrors.employees && <p className="text-xs text-red-500 mt-1">{reqErrors.employees}</p>}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditRequest(null)}>Cancel</Button>
              <Button
                onClick={submitEdit}
                disabled={submittingEdit}
                className="bg-[#0f3460] hover:bg-[#0a2540]"
              >
                {submittingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add Employee Modal ── */}
      <Modal open={showAddEmployee} onClose={() => setShowAddEmployee(false)} title="Add New Employee" subtitle="Add a new employee to the team training list.">
        <div className="space-y-4">
          <div>
            <Label>Employee Name</Label>
            <Input
              className="mt-1"
              placeholder="Enter employee name"
              value={empName}
              maxLength={100}
              onChange={(e) => { setEmpName(e.target.value); setEmpErrors((er) => ({ ...er, name: '' })); }}
            />
            {empErrors.name && <p className="text-xs text-red-500 mt-1">{empErrors.name}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              className="mt-1"
              placeholder="employee@company.com"
              value={empEmail}
              maxLength={254}
              onChange={(e) => { setEmpEmail(e.target.value); setEmpErrors((er) => ({ ...er, email: '' })); }}
            />
            {empErrors.email && <p className="text-xs text-red-500 mt-1">{empErrors.email}</p>}
          </div>
          <div>
            <Label>Unique Number <span className="text-gray-400 font-normal">(optional)</span></Label>
            <Input
              className="mt-1"
              placeholder="e.g. DUV-2024-001"
              value={empNumber}
              maxLength={20}
              onChange={(e) => { setEmpNumber(e.target.value.toUpperCase()); setEmpErrors((er) => ({ ...er, number: '' })); }}
            />
            {empErrors.number && <p className="text-xs text-red-500 mt-1">{empErrors.number}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddEmployee(false)}>Cancel</Button>
            <Button
              onClick={submitAddEmployee}
              disabled={submittingEmp}
              className="bg-[#0f3460] hover:bg-[#0a2540]"
            >
              {submittingEmp ? 'Adding...' : 'Add Employee'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Delete Request ── */}
      <ConfirmDialog
        open={!!deleteRequestId}
        title="Delete Training Request"
        message="This will permanently delete the training request and all its employee assignments."
        confirmLabel="Delete"
        onConfirm={confirmDeleteRequest}
        onClose={() => setDeleteRequestId(null)}
      />

      {/* ── Confirm Delete Employee ── */}
      <ConfirmDialog
        open={!!deleteEmployeeId}
        title="Remove Employee"
        message="This will remove the employee from your team. This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={confirmDeleteEmployee}
        onClose={() => setDeleteEmployeeId(null)}
      />

      {/* ── Edit Employee Modal ── */}
      <Modal
        open={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        title="Edit Employee"
        subtitle="Update the employee details below."
        className="max-w-md"
      >
        {editEmployee && (
          <div className="space-y-4">
            <div>
              <Label>Employee Name</Label>
              <Input
                className="mt-1"
                value={editEmpName}
                maxLength={100}
                onChange={(e) => { setEditEmpName(e.target.value); setEditEmpErrors((er) => ({ ...er, name: '' })); }}
              />
              {editEmpErrors.name && <p className="text-xs text-red-500 mt-1">{editEmpErrors.name}</p>}
            </div>
            <div>
              <Label>Unique Number</Label>
              <Input
                className="mt-1"
                value={editEmpNumber}
                maxLength={20}
                onChange={(e) => { setEditEmpNumber(e.target.value.toUpperCase()); setEditEmpErrors((er) => ({ ...er, number: '' })); }}
              />
              {editEmpErrors.number && <p className="text-xs text-red-500 mt-1">{editEmpErrors.number}</p>}
            </div>
            <div>
              <Label>Employee Status</Label>
              <Select value={editEmpStatus} onValueChange={(v) => setEditEmpStatus(v as 'ACTIVE' | 'INACTIVE')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditEmployee(null)}>Cancel</Button>
              <Button
                onClick={submitEditEmployee}
                disabled={submittingEditEmp}
                className="bg-[#0f3460] hover:bg-[#0a2540]"
              >
                {submittingEditEmp ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Completed Trainings Modal ── */}
      <Modal
        open={!!completedEmployee}
        onClose={() => setCompletedEmployee(null)}
        title="Completed Trainings"
        subtitle={completedEmployee ? `Training history for ${completedEmployee.name}` : ''}
        className="max-w-lg"
      >
        <div>
          {loadingCompleted ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
          ) : completedTrainings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No completed trainings yet.</p>
          ) : (
            <div className="space-y-2">
              {completedTrainings.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.trainingName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-400">Completed: {fmt(t.completedDate)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    Done
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setCompletedEmployee(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
