'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Trash2, ChevronRight, Plus } from 'lucide-react';
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
}

interface Division {
  id: string;
  name: string;
  departments: Department[];
}

export default function DivisionsPage() {
  const toast = useToast();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddDivision, setShowAddDivision] = useState(false);
  const [showAddDepartment, setShowAddDepartment] = useState(false);

  const [divisionName, setDivisionName] = useState('');
  const [divisionNameError, setDivisionNameError] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptNameError, setDeptNameError] = useState('');
  const [deptDivisionId, setDeptDivisionId] = useState('');

  const [submitting, setSubmitting] = useState(false);

  function validateOrgName(value: string) {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < 2) return 'Must be at least 2 characters';
    if (value.trim().length > 100) return 'Must not exceed 100 characters';
    if (!rules.orgName.test(value.trim())) return messages.orgName;
    return '';
  }

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchDivisions = useCallback(async () => {
    try {
      const res = await (api.divisions.getAll() as Promise<{ data: Division[] }>);
      setDivisions(res.data || []);
    } catch {
      toast.error('Failed to load divisions. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  const handleCreateDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateOrgName(divisionName);
    if (err) { setDivisionNameError(err); return; }
    setSubmitting(true);
    try {
      await api.divisions.create({ name: divisionName.trim() });
      setDivisionName('');
      setDivisionNameError('');
      setShowAddDivision(false);
      toast.success(`Division "${divisionName.trim()}" created successfully.`);
      fetchDivisions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create division');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateOrgName(deptName);
    if (err) { setDeptNameError(err); return; }
    setSubmitting(true);
    try {
      await api.divisions.addDepartment(deptDivisionId, { name: deptName.trim() });
      const divName = divisions.find((d) => d.id === deptDivisionId)?.name;
      setDeptName('');
      setDeptNameError('');
      setDeptDivisionId('');
      setShowAddDepartment(false);
      toast.success(`Department added to ${divName}.`);
      fetchDivisions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDivision = async () => {
    if (!confirmDelete) return;
    try {
      await api.divisions.delete(confirmDelete.id);
      toast.success(`Division "${confirmDelete.name}" deleted.`);
      fetchDivisions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete division');
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Divisions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage divisions and their departments
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAddDivision(true)}
            className="bg-[#0f3460] hover:bg-[#0a2540] text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Division
          </Button>
          <Button
            onClick={() => setShowAddDepartment(true)}
            className="bg-[#0f3460] hover:bg-[#0a2540] text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Division Cards */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : divisions.length === 0 ? (
        <p className="text-sm text-gray-400">
          No divisions yet. Add one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {divisions.map((division) => (
            <div
              key={division.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#e0f2fe] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#0891b2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {division.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {division.departments.length} departments
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setConfirmDelete({ id: division.id, name: division.name })}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    title="Delete division"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="View details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {division.departments.length > 0 && (
                <div className="mt-3 space-y-1">
                  {division.departments.map((dept) => (
                    <p key={dept.id} className="text-sm text-[#0891b2]">
                      {dept.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Division Modal */}
      <Modal
        open={showAddDivision}
        onClose={() => { setShowAddDivision(false); setDivisionName(''); setDivisionNameError(''); }}
        title="Add New Division"
        subtitle="Create a new organizational division."
      >
        <form onSubmit={handleCreateDivision} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="divisionName">Division Name</Label>
            <Input
              id="divisionName"
              placeholder="e.g. Operations"
              value={divisionName}
              onChange={(e) => {
                const v = sanitize(e.target.value);
                setDivisionName(v);
                if (divisionNameError) setDivisionNameError(validateOrgName(v));
              }}
              onKeyDown={onSanitizedKeyDown}
              maxLength={100}
              autoFocus
            />
            {divisionNameError && <p className="text-xs text-red-500">{divisionNameError}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDivision(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0f3460] hover:bg-[#0a2540]"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Division'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Department Modal */}
      <Modal
        open={showAddDepartment}
        onClose={() => { setShowAddDepartment(false); setDeptName(''); setDeptNameError(''); setDeptDivisionId(''); }}
        title="Add New Department"
        subtitle="Create a new department within a division."
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deptDivision">Division</Label>
            <Select value={deptDivisionId} onValueChange={setDeptDivisionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="deptName">Department Name</Label>
            <Input
              id="deptName"
              placeholder="e.g. Production"
              value={deptName}
              onChange={(e) => {
                const v = sanitize(e.target.value);
                setDeptName(v);
                if (deptNameError) setDeptNameError(validateOrgName(v));
              }}
              onKeyDown={onSanitizedKeyDown}
              maxLength={100}
            />
            {deptNameError && <p className="text-xs text-red-500">{deptNameError}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDepartment(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0f3460] hover:bg-[#0a2540]"
              disabled={submitting || !deptDivisionId}
            >
              {submitting ? 'Creating...' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Division"
        message={`"${confirmDelete?.name}" and all its departments will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteDivision}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}
