'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, UserX, Pencil, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import { sanitize, onSanitizedKeyDown, rules, messages } from '@/lib/validation';

interface Department {
  id: string;
  name: string;
  divisionId: string;
  division: { id: string; name: string };
}

interface Division {
  id: string;
  name: string;
  departments: Department[];
}

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  role: 'EMPLOYEE' | 'MANAGER';
  department: {
    id: string;
    name: string;
    division: { id: string; name: string };
  };
}

interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
}

interface EmployeesResponse {
  success: boolean;
  employees: Employee[];
  stats: EmployeeStats;
}

interface DivisionsResponse {
  data: Division[];
}

const emptyErrors = { name: '', employeeNumber: '' };

function validateName(value: string) {
  if (!value.trim()) return 'Name is required';
  if (value.trim().length < 2) return 'Must be at least 2 characters';
  if (value.trim().length > 100) return 'Must not exceed 100 characters';
  if (!rules.name.test(value.trim())) return messages.name;
  return '';
}

function validateEmpNum(value: string) {
  const upper = value.trim().toUpperCase();
  if (!upper) return 'Employee number is required';
  if (upper.length < 2) return 'Must be at least 2 characters';
  if (upper.length > 20) return 'Must not exceed 20 characters';
  if (!rules.employeeNumber.test(upper)) return messages.employeeNumber;
  return '';
}

export default function EmployeesPage() {
  const toast = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats>({ total: 0, active: 0, inactive: 0 });
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  // Add form
  const [addForm, setAddForm] = useState({ name: '', email: '', employeeNumber: '', divisionId: '', departmentId: '' });
  const [addErrors, setAddErrors] = useState({ name: '', email: '', employeeNumber: '' });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({ name: '', employeeNumber: '', divisionId: '', departmentId: '', status: 'ACTIVE' });
  const [editErrors, setEditErrors] = useState(emptyErrors);
  const [submitting, setSubmitting] = useState(false);

  const filteredDepts = (divisionId: string) =>
    divisions.find((d) => d.id === divisionId)?.departments ?? [];

  const fetchEmployees = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterDivision && filterDivision !== 'all') params.divisionId = filterDivision;
      if (filterDepartment && filterDepartment !== 'all') params.departmentId = filterDepartment;
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
      const res = await (api.employees.getAll(params) as Promise<EmployeesResponse>);
      setEmployees(res.employees || []);
      setStats(res.stats || { total: 0, active: 0, inactive: 0 });
    } catch {
      toast.error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterDivision, filterDepartment, filterStatus]);

  const fetchDivisions = useCallback(async () => {
    try {
      const res = await (api.divisions.getAll() as Promise<DivisionsResponse>);
      setDivisions(res.data || []);
    } catch {
      // non-critical
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchDivisions(); }, [fetchDivisions]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // When division filter changes, reset department filter
  useEffect(() => { setFilterDepartment(''); }, [filterDivision]);

  const openEdit = (emp: Employee) => {
    setEditTarget(emp);
    setEditForm({
      name: emp.name,
      employeeNumber: emp.employeeNumber,
      divisionId: emp.department.division.id,
      departmentId: emp.department.id,
      status: emp.status,
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const nameErr = validateName(editForm.name);
    const empErr = validateEmpNum(editForm.employeeNumber);
    if (nameErr || empErr) {
      setEditErrors({ name: nameErr, employeeNumber: empErr });
      return;
    }
    setSubmitting(true);
    try {
      await api.employees.update(editTarget.id, {
        name: editForm.name.trim(),
        employeeNumber: editForm.employeeNumber.trim().toUpperCase(),
        departmentId: editForm.departmentId,
        status: editForm.status,
      });
      toast.success(`Employee "${editForm.name.trim()}" updated.`);
      setShowEdit(false);
      setEditTarget(null);
      setEditErrors(emptyErrors);
      fetchEmployees();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.employees.delete(confirmDelete.id);
      toast.success(`Employee "${confirmDelete.name}" removed.`);
      fetchEmployees();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete employee');
    } finally {
      setConfirmDelete(null);
    }
  };

  const filterDivisionDepts = filteredDepts(filterDivision);
  const addFormDepts = filteredDepts(addForm.divisionId);
  const editFormDepts = filteredDepts(editForm.divisionId);

  const openAdd = () => {
    setAddForm({ name: '', email: '', employeeNumber: '', divisionId: '', departmentId: '' });
    setAddErrors({ name: '', email: '', employeeNumber: '' });
    setShowAdd(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = { name: '', email: '', employeeNumber: '' };
    if (!addForm.name.trim()) errs.name = 'Name is required';
    else if (!rules.name.test(addForm.name.trim())) errs.name = messages.name;
    if (!addForm.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email.trim())) errs.email = 'Invalid email address';
    if (Object.values(errs).some(Boolean) || !addForm.departmentId) { setAddErrors(errs); return; }

    setSubmittingAdd(true);
    try {
      const body: { name: string; email: string; departmentId: string; employeeNumber?: string } = {
        name: addForm.name.trim(),
        email: addForm.email.trim().toLowerCase(),
        departmentId: addForm.departmentId,
      };
      if (addForm.employeeNumber.trim()) body.employeeNumber = addForm.employeeNumber.trim().toUpperCase();
      await api.employees.create(body);
      toast.success(`Employee "${addForm.name.trim()}" added.`);
      setShowAdd(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add employee');
    } finally {
      setSubmittingAdd(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the workforce directory</p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2 bg-[#0f3460] hover:bg-[#0a2540]">
          <UserPlus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#e0f2fe] rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-[#0891b2]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <UserX className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search by name or employee #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select value={filterDivision} onValueChange={setFilterDivision}>
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
          <Select value={filterDepartment} onValueChange={setFilterDepartment} disabled={!filterDivision || filterDivision === 'all'}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {filterDivisionDepts.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Division</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No employees found.</td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-4 py-3 text-[#0891b2] font-mono">{emp.employeeNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.department.division.name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.department.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        emp.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {emp.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(emp)}
                        className="text-gray-400 hover:text-[#0891b2] transition-colors"
                        title="Edit employee"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: emp.id, name: emp.name })}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Employee"
        subtitle="Pre-add an employee. If they sign up with the same email, their account links automatically."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="addName">Full Name</Label>
            <Input
              id="addName"
              placeholder="e.g. John Smith"
              value={addForm.name}
              onChange={(e) => { const v = sanitize(e.target.value); setAddForm({ ...addForm, name: v }); setAddErrors({ ...addErrors, name: '' }); }}
              onKeyDown={onSanitizedKeyDown}
              maxLength={100}
              autoFocus
            />
            {addErrors.name && <p className="text-xs text-red-500">{addErrors.name}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="addEmail">Email</Label>
            <Input
              id="addEmail"
              type="email"
              placeholder="employee@company.com"
              value={addForm.email}
              onChange={(e) => { setAddForm({ ...addForm, email: e.target.value }); setAddErrors({ ...addErrors, email: '' }); }}
              maxLength={254}
            />
            {addErrors.email && <p className="text-xs text-red-500">{addErrors.email}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="addEmpNum">Employee Number <span className="text-gray-400 font-normal">(optional)</span></Label>
            <Input
              id="addEmpNum"
              placeholder="e.g. EMP-2025-001 — auto-generated if blank"
              value={addForm.employeeNumber}
              onChange={(e) => { const v = sanitize(e.target.value).toUpperCase(); setAddForm({ ...addForm, employeeNumber: v }); setAddErrors({ ...addErrors, employeeNumber: '' }); }}
              onKeyDown={onSanitizedKeyDown}
              maxLength={20}
            />
            {addErrors.employeeNumber && <p className="text-xs text-red-500">{addErrors.employeeNumber}</p>}
          </div>
          <div className="space-y-2">
            <Label>Division</Label>
            <Select value={addForm.divisionId} onValueChange={(v) => setAddForm({ ...addForm, divisionId: v, departmentId: '' })}>
              <SelectTrigger><SelectValue placeholder="Select a division" /></SelectTrigger>
              <SelectContent>
                {divisions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={addForm.departmentId} onValueChange={(v) => setAddForm({ ...addForm, departmentId: v })} disabled={!addForm.divisionId}>
              <SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
              <SelectContent>
                {addFormDepts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#0f3460] hover:bg-[#0a2540]" disabled={submittingAdd || !addForm.departmentId}>
              {submittingAdd ? 'Adding...' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        open={showEdit}
        onClose={() => { setShowEdit(false); setEditTarget(null); setEditErrors(emptyErrors); }}
        title="Edit Employee"
        subtitle="Update employee details."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="editName">Full Name</Label>
            <Input
              id="editName"
              value={editForm.name}
              onChange={(e) => {
                const v = sanitize(e.target.value);
                setEditForm({ ...editForm, name: v });
                if (editErrors.name) setEditErrors({ ...editErrors, name: validateName(v) });
              }}
              onKeyDown={onSanitizedKeyDown}
              maxLength={100}
              autoFocus
            />
            {editErrors.name && <p className="text-xs text-red-500">{editErrors.name}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="editEmpNum">Employee Number</Label>
            <Input
              id="editEmpNum"
              value={editForm.employeeNumber}
              onChange={(e) => {
                const v = sanitize(e.target.value).toUpperCase();
                setEditForm({ ...editForm, employeeNumber: v });
                if (editErrors.employeeNumber) setEditErrors({ ...editErrors, employeeNumber: validateEmpNum(v) });
              }}
              onKeyDown={onSanitizedKeyDown}
              maxLength={20}
            />
            {editErrors.employeeNumber && <p className="text-xs text-red-500">{editErrors.employeeNumber}</p>}
          </div>
          <div className="space-y-2">
            <Label>Division</Label>
            <Select
              value={editForm.divisionId}
              onValueChange={(v) => setEditForm({ ...editForm, divisionId: v, departmentId: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select
              value={editForm.departmentId}
              onValueChange={(v) => setEditForm({ ...editForm, departmentId: v })}
              disabled={!editForm.divisionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {editFormDepts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={editForm.status}
              onValueChange={(v) => setEditForm({ ...editForm, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowEdit(false); setEditTarget(null); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0f3460] hover:bg-[#0a2540]"
              disabled={submitting || !editForm.departmentId}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove Employee"
        message={`"${confirmDelete?.name}" will be permanently removed from the directory. This cannot be undone.`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}
