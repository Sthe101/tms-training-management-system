'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  GraduationCap,
  Users,
  UserCog,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
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
import { sanitize, onSanitizedKeyDown } from '@/lib/validation';

interface Department { id: string; name: string; divisionId: string }
interface TrainingCategory { id: string; name: string }
interface DivisionTraining { trainingCategoryId: string; trainingCategory: TrainingCategory }
interface Employee {
  id: string; name: string; employeeNumber: string; email?: string;
  status: 'ACTIVE' | 'INACTIVE'; role: 'EMPLOYEE' | 'MANAGER';
  department: { id: string; name: string };
}
interface ManagerAssignment {
  id: string;
  employeeId: string;
  departmentId: string;
  employee: Employee;
  department: Department;
}
interface DivisionDetail {
  id: string; name: string;
  departments: Department[];
  trainings: DivisionTraining[];
  managers: ManagerAssignment[];
  employees: Employee[];
}
interface TrainingListResponse { data: TrainingCategory[] }
interface DivisionResponse { data: DivisionDetail }

export default function DivisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [division, setDivision] = useState<DivisionDetail | null>(null);
  const [allTrainings, setAllTrainings] = useState<TrainingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddDept, setShowAddDept] = useState(false);
  const [showEditDept, setShowEditDept] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [showAssignTraining, setShowAssignTraining] = useState(false);
  const [showAddManager, setShowAddManager] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; type: string } | null>(null);

  // Form state
  const [deptName, setDeptName] = useState('');
  const [deptNameError, setDeptNameError] = useState('');
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptNameError, setEditDeptNameError] = useState('');
  const [selectedTrainingId, setSelectedTrainingId] = useState('');
  const [managerForm, setManagerForm] = useState({ employeeId: '', departmentId: '' });
  const [addEmpForm, setAddEmpForm] = useState({ name: '', email: '', employeeNumber: '', departmentId: '' });
  const [addEmpErrors, setAddEmpErrors] = useState({ name: '', email: '', employeeNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submittingEmp, setSubmittingEmp] = useState(false);

  function validateOrgName(v: string) {
    if (!v.trim()) return 'Name is required';
    if (v.trim().length < 2) return 'Must be at least 2 characters';
    if (v.trim().length > 100) return 'Must not exceed 100 characters';
    if (!rules.orgName.test(v.trim())) return messages.orgName;
    return '';
  }
  const fetchDivision = useCallback(async () => {
    try {
      const res = await (api.divisions.getById(id) as Promise<DivisionResponse>);
      setDivision(res.data);
    } catch {
      toast.error('Failed to load division details.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTrainings = useCallback(async () => {
    try {
      const res = await (api.trainings.getAll() as Promise<TrainingListResponse>);
      setAllTrainings(res.data || []);
    } catch { /* non-critical */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchDivision(); fetchTrainings(); }, [fetchDivision, fetchTrainings]);

  // Trainings not yet assigned to this division
  const assignedIds = new Set(division?.trainings.map((t) => t.trainingCategoryId) ?? []);
  const unassignedTrainings = allTrainings.filter((t) => !assignedIds.has(t.id));

  // Handlers
  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateOrgName(deptName);
    if (err) { setDeptNameError(err); return; }
    setSubmitting(true);
    try {
      await api.divisions.addDepartment(id, { name: deptName.trim() });
      toast.success(`Department "${deptName.trim()}" added.`);
      setDeptName(''); setDeptNameError(''); setShowAddDept(false);
      fetchDivision();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add department');
    } finally { setSubmitting(false); }
  };

  const handleEditDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDept) return;
    const err = validateOrgName(editDeptName);
    if (err) { setEditDeptNameError(err); return; }
    setSubmitting(true);
    try {
      await api.divisions.updateDepartment(id, editDept.id, { name: editDeptName.trim() });
      toast.success('Department renamed.');
      setShowEditDept(false); setEditDept(null); setEditDeptNameError('');
      fetchDivision();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update department');
    } finally { setSubmitting(false); }
  };

  const handleAssignTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainingId) return;
    setSubmitting(true);
    try {
      await api.divisions.assignTraining(id, { trainingCategoryId: selectedTrainingId });
      const name = allTrainings.find((t) => t.id === selectedTrainingId)?.name;
      toast.success(`"${name}" assigned to this division.`);
      setSelectedTrainingId(''); setShowAssignTraining(false);
      fetchDivision();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign training');
    } finally { setSubmitting(false); }
  };

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerForm.employeeId || !managerForm.departmentId) return;
    setSubmitting(true);
    try {
      await api.divisions.addManager(id, {
        employeeId: managerForm.employeeId,
        departmentId: managerForm.departmentId,
      });
      const empName = division?.employees.find((e) => e.id === managerForm.employeeId)?.name;
      toast.success(`${empName} promoted to manager.`);
      setManagerForm({ employeeId: '', departmentId: '' });
      setShowAddManager(false);
      fetchDivision();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add manager');
    } finally { setSubmitting(false); }
  };

  const openAddEmployee = () => {
    setAddEmpForm({ name: '', email: '', employeeNumber: '', departmentId: division?.departments[0]?.id ?? '' });
    setAddEmpErrors({ name: '', email: '', employeeNumber: '' });
    setShowAddEmployee(true);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = { name: '', email: '', employeeNumber: '' };
    if (!addEmpForm.name.trim()) errs.name = 'Name is required';
    if (!addEmpForm.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmpForm.email.trim())) errs.email = 'Invalid email address';
    if (Object.values(errs).some(Boolean)) { setAddEmpErrors(errs); return; }
    if (!addEmpForm.departmentId) return;

    setSubmittingEmp(true);
    try {
      const body: { name: string; email: string; departmentId: string; employeeNumber?: string } = {
        name: addEmpForm.name.trim(),
        email: addEmpForm.email.trim().toLowerCase(),
        departmentId: addEmpForm.departmentId,
      };
      if (addEmpForm.employeeNumber.trim()) body.employeeNumber = addEmpForm.employeeNumber.trim().toUpperCase();
      await api.employees.create(body);
      toast.success(`"${addEmpForm.name.trim()}" added to the division.`);
      setShowAddEmployee(false);
      fetchDivision();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add employee');
    } finally {
      setSubmittingEmp(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'department') {
        await api.divisions.deleteDepartment(id, confirmDelete.id);
        toast.success(`Department "${confirmDelete.name}" deleted.`);
      } else if (confirmDelete.type === 'training') {
        await api.divisions.unassignTraining(id, confirmDelete.id);
        toast.success(`"${confirmDelete.name}" removed from this division.`);
      } else if (confirmDelete.type === 'manager') {
        await api.divisions.removeManager(id, confirmDelete.id);
        toast.success(`"${confirmDelete.name}" demoted to employee.`);
      } else if (confirmDelete.type === 'employee') {
        await api.employees.delete(confirmDelete.id);
        toast.success(`"${confirmDelete.name}" removed.`);
      }
      fetchDivision();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally { setConfirmDelete(null); }
  };

  if (loading) {
    return <p className="text-sm text-gray-400">Loading...</p>;
  }
  if (!division) {
    return <p className="text-sm text-red-500">Division not found.</p>;
  }

  const managerCount = division.managers.length;
  const employeeCount = division.employees.length;

  return (
    <>
      {/* Back link */}
      <Link href="/admin/divisions" className="inline-flex items-center gap-1 text-sm text-[#0891b2] hover:underline mb-5">
        <ArrowLeft className="w-4 h-4" />
        Back to Divisions
      </Link>

      {/* Division header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-[#e0f2fe] rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-[#0891b2]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{division.name}</h1>
          <p className="text-sm text-gray-500">
            {division.departments.length} department{division.departments.length !== 1 ? 's' : ''} · {managerCount} manager{managerCount !== 1 ? 's' : ''} · {employeeCount} employee{employeeCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Departments */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Departments</h2>
            </div>
            <Button size="sm" className="bg-[#0f3460] hover:bg-[#0a2540] text-white h-8 text-xs" onClick={() => setShowAddDept(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Department
            </Button>
          </div>
          <div className="space-y-2">
            {division.departments.length === 0 ? (
              <p className="text-sm text-gray-400">No departments yet.</p>
            ) : division.departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-800">{dept.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditDept(dept); setEditDeptName(dept.name); setShowEditDept(true); }}
                    className="text-gray-400 hover:text-[#0891b2] p-1 transition-colors"
                    title="Rename"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ id: dept.id, name: dept.name, type: 'department' })}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applicable Trainings */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Applicable Trainings</h2>
            </div>
            <Button size="sm" className="bg-[#0f3460] hover:bg-[#0a2540] text-white h-8 text-xs" onClick={() => setShowAssignTraining(true)} disabled={unassignedTrainings.length === 0}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Assign
            </Button>
          </div>
          <div className="space-y-2">
            {division.trainings.length === 0 ? (
              <p className="text-sm text-gray-400">No trainings assigned yet.</p>
            ) : division.trainings.map((t) => (
              <div key={t.trainingCategoryId} className="flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-800">{t.trainingCategory.name}</span>
                <button
                  onClick={() => setConfirmDelete({ id: t.trainingCategoryId, name: t.trainingCategory.name, type: 'training' })}
                  className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Managers */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Managers</h2>
            </div>
            <Button size="sm" className="bg-[#0f3460] hover:bg-[#0a2540] text-white h-8 text-xs" onClick={() => setShowAddManager(true)} disabled={division.employees.length === 0}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Manager
            </Button>
          </div>
          <div className="space-y-2">
            {division.managers.length === 0 ? (
              <p className="text-sm text-gray-400">No managers assigned yet.</p>
            ) : division.managers.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{assignment.employee.name}</p>
                  <p className="text-xs text-gray-500">
                    {assignment.employee.email ? `${assignment.employee.email} · ` : ''}
                    Managing: {assignment.department.name}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmDelete({ id: assignment.employeeId, name: assignment.employee.name, type: 'manager' })}
                  className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                  title="Demote to employee"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Employees */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Employees</h2>
            </div>
            <Button size="sm" className="bg-[#0f3460] hover:bg-[#0a2540] text-white h-8 text-xs" onClick={openAddEmployee} disabled={division.departments.length === 0}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Employee
            </Button>
          </div>
          <div className="space-y-2">
            {division.employees.length === 0 ? (
              <p className="text-sm text-gray-400">No employees in this division yet.</p>
            ) : division.employees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                  <p className="text-xs text-[#0891b2]">#{emp.employeeNumber} · {emp.department.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {emp.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => setConfirmDelete({ id: emp.id, name: emp.name, type: 'employee' })}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      <Modal open={showAddDept} onClose={() => { setShowAddDept(false); setDeptName(''); setDeptNameError(''); }} title="Add New Department" subtitle="Create a new department within a division.">
        <form onSubmit={handleAddDept} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="deptName">Department Name</Label>
            <Input
              id="deptName"
              placeholder="e.g. Production"
              value={deptName}
              onChange={(e) => { const v = sanitize(e.target.value); setDeptName(v); if (deptNameError) setDeptNameError(validateOrgName(v)); }}
              onKeyDown={onSanitizedKeyDown}
              maxLength={100}
              autoFocus
            />
            {deptNameError && <p className="text-xs text-red-500">{deptNameError}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowAddDept(false); setDeptName(''); setDeptNameError(''); }}>Cancel</Button>
            <Button type="submit" className="bg-[#0f3460] hover:bg-[#0a2540]" disabled={submitting}>{submitting ? 'Creating...' : 'Create Department'}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal open={showEditDept} onClose={() => { setShowEditDept(false); setEditDept(null); setEditDeptNameError(''); }} title="Rename Department" subtitle="Update the department name.">
        <form onSubmit={handleEditDept} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="editDeptName">Department Name</Label>
            <Input
              id="editDeptName"
              value={editDeptName}
              onChange={(e) => { const v = sanitize(e.target.value); setEditDeptName(v); if (editDeptNameError) setEditDeptNameError(validateOrgName(v)); }}
              onKeyDown={onSanitizedKeyDown}
              maxLength={100}
              autoFocus
            />
            {editDeptNameError && <p className="text-xs text-red-500">{editDeptNameError}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowEditDept(false); setEditDept(null); setEditDeptNameError(''); }}>Cancel</Button>
            <Button type="submit" className="bg-[#0f3460] hover:bg-[#0a2540]" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Training Modal */}
      <Modal open={showAssignTraining} onClose={() => { setShowAssignTraining(false); setSelectedTrainingId(''); }} title="Assign Training" subtitle="Select a training category to make applicable to this division.">
        <form onSubmit={handleAssignTraining} className="space-y-4">
          <div className="space-y-2">
            <Label>Training Category</Label>
            <Select value={selectedTrainingId} onValueChange={setSelectedTrainingId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a training" />
              </SelectTrigger>
              <SelectContent>
                {unassignedTrainings.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowAssignTraining(false); setSelectedTrainingId(''); }}>Cancel</Button>
            <Button type="submit" className="bg-[#0f3460] hover:bg-[#0a2540]" disabled={submitting || !selectedTrainingId}>{submitting ? 'Assigning...' : 'Assign Training'}</Button>
          </div>
        </form>
      </Modal>

      {/* Add Manager Modal */}
      <Modal
        open={showAddManager}
        onClose={() => { setShowAddManager(false); setManagerForm({ employeeId: '', departmentId: '' }); }}
        title="Add Manager"
        subtitle="Promote an employee in this division to manager and assign their department."
      >
        <form onSubmit={handleAddManager} className="space-y-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={managerForm.employeeId} onValueChange={(v) => setManagerForm({ ...managerForm, employeeId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {division.employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} — {emp.department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {division.employees.length === 0 && (
              <p className="text-xs text-amber-600">No employees in this division to promote.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Department They Will Manage</Label>
            <Select value={managerForm.departmentId} onValueChange={(v) => setManagerForm({ ...managerForm, departmentId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {division.departments
                  .filter((d) => !division.managers.some((m) => m.departmentId === d.id))
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowAddManager(false); setManagerForm({ employeeId: '', departmentId: '' }); }}>Cancel</Button>
            <Button type="submit" className="bg-[#0f3460] hover:bg-[#0a2540]" disabled={submitting || !managerForm.employeeId || !managerForm.departmentId}>
              {submitting ? 'Assigning...' : 'Add Manager'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        open={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        title="Add Employee"
        subtitle="Add an employee to this division. If they sign up with the same email, their account links automatically."
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="empName">Full Name</Label>
            <Input
              id="empName"
              placeholder="e.g. John Smith"
              value={addEmpForm.name}
              onChange={(e) => { const v = sanitize(e.target.value); setAddEmpForm({ ...addEmpForm, name: v }); setAddEmpErrors({ ...addEmpErrors, name: '' }); }}
              onKeyDown={onSanitizedKeyDown}
              maxLength={100}
              autoFocus
            />
            {addEmpErrors.name && <p className="text-xs text-red-500">{addEmpErrors.name}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="empEmail">Email</Label>
            <Input
              id="empEmail"
              type="email"
              placeholder="employee@company.com"
              value={addEmpForm.email}
              onChange={(e) => { setAddEmpForm({ ...addEmpForm, email: e.target.value }); setAddEmpErrors({ ...addEmpErrors, email: '' }); }}
              maxLength={254}
            />
            {addEmpErrors.email && <p className="text-xs text-red-500">{addEmpErrors.email}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="empNumber">Employee Number <span className="text-gray-400 font-normal">(optional — auto-generated if blank)</span></Label>
            <Input
              id="empNumber"
              placeholder="e.g. EMP-2025-001"
              value={addEmpForm.employeeNumber}
              onChange={(e) => { const v = sanitize(e.target.value).toUpperCase(); setAddEmpForm({ ...addEmpForm, employeeNumber: v }); setAddEmpErrors({ ...addEmpErrors, employeeNumber: '' }); }}
              onKeyDown={onSanitizedKeyDown}
              maxLength={20}
            />
            {addEmpErrors.employeeNumber && <p className="text-xs text-red-500">{addEmpErrors.employeeNumber}</p>}
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select
              value={addEmpForm.departmentId}
              onValueChange={(v) => setAddEmpForm({ ...addEmpForm, departmentId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {division.departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddEmployee(false)}>Cancel</Button>
            <Button
              type="submit"
              className="bg-[#0f3460] hover:bg-[#0a2540]"
              disabled={submittingEmp || !addEmpForm.departmentId}
            >
              {submittingEmp ? 'Adding...' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        title={
          confirmDelete?.type === 'manager' ? 'Remove Manager' :
          confirmDelete?.type === 'department' ? 'Delete Department' :
          confirmDelete?.type === 'training' ? 'Remove Training' : 'Remove Employee'
        }
        message={
          confirmDelete?.type === 'manager'
            ? `"${confirmDelete?.name}" will be demoted back to employee. They will remain in the directory.`
            : `"${confirmDelete?.name}" will be permanently removed. This cannot be undone.`
        }
        confirmLabel={confirmDelete?.type === 'manager' ? 'Demote' : 'Remove'}
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}
