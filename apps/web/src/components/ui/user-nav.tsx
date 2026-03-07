'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, UserCircle, Pencil, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, SelectOption } from '@/components/ui/searchable-select';
import { api } from '@/lib/api';

interface Division extends SelectOption {
  departments: SelectOption[];
}

interface ProfileData {
  employee: {
    department: { id: string; name: string; division: { id: string; name: string } };
  } | null;
}

export function UserNav() {
  const { user, logout } = useAuth();
  const toast = useToast();

  // Dropdown
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<SelectOption | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<SelectOption | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const departments = selectedDivision
    ? (divisions.find((d) => d.id === selectedDivision.id)?.departments ?? [])
    : [];

  const loadProfileData = useCallback(async () => {
    try {
      const [profileRes, divsRes] = await Promise.all([
        api.auth.getProfile() as Promise<ProfileData>,
        api.auth.getDivisions() as Promise<{ divisions: Division[] }>,
      ]);

      setDivisions(divsRes.divisions ?? []);

      if (profileRes.employee) {
        const div = profileRes.employee.department.division;
        const dept = profileRes.employee.department;
        setSelectedDivision({ id: div.id, name: div.name });
        setSelectedDepartment({ id: dept.id, name: dept.name });
      }
    } catch {
      // non-critical — form still works without pre-fill
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openModal() {
    setDropOpen(false);
    setName(user?.name ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setSelectedDivision(null);
    setSelectedDepartment(null);
    setModalOpen(true);
    loadProfileData();
  }

  function handleDivisionSelect(div: SelectOption) {
    setSelectedDivision(div);
    setSelectedDepartment(null);
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (newPassword && !currentPassword) errs.currentPassword = 'Enter your current password to change it';
    if (newPassword && newPassword.length < 8) errs.newPassword = 'Min. 8 characters';
    if (newPassword && newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const body: Record<string, string> = {};
    if (name.trim() !== user?.name) body.name = name.trim();
    if (selectedDepartment) body.departmentId = selectedDepartment.id;
    if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }

    if (Object.keys(body).length === 0) { setModalOpen(false); return; }

    setSubmitting(true);
    try {
      await api.auth.updateProfile(body);
      toast.success('Profile updated.');
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <>
      {/* Dropdown trigger */}
      <div ref={dropRef} className="relative">
        <button
          onClick={() => setDropOpen((o) => !o)}
          className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          <UserCircle className="w-4 h-4 text-gray-400" />
          <span>{user.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropOpen && (
          <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            <button
              onClick={openModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
              Edit Profile
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => { setDropOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Profile"
        subtitle="Update your name, location, or password"
        className="max-w-lg"
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label>Full Name</Label>
            <Input
              className="mt-1"
              value={name}
              maxLength={100}
              onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: '' })); }}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Division + Department */}
          <div>
            <Label>Division</Label>
            <div className="mt-1">
              <SearchableSelect
                placeholder="Search your division..."
                items={divisions}
                selected={selectedDivision}
                onSelect={handleDivisionSelect}
              />
            </div>
          </div>
          <div>
            <Label>Department</Label>
            <div className="mt-1">
              <SearchableSelect
                placeholder={selectedDivision ? 'Search your department...' : 'Select a division first'}
                items={departments}
                selected={selectedDepartment}
                onSelect={setSelectedDepartment}
                disabled={!selectedDivision}
              />
            </div>
          </div>

          {/* Password section */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Leave blank to keep your current password</p>
            <div className="space-y-3">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  className="mt-1"
                  placeholder="Required to set a new password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setErrors((er) => ({ ...er, currentPassword: '' })); }}
                />
                {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword}</p>}
              </div>
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  className="mt-1"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrors((er) => ({ ...er, newPassword: '' })); }}
                />
                {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  className="mt-1"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((er) => ({ ...er, confirmPassword: '' })); }}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting} className="bg-[#0f3460] hover:bg-[#0a2540]">
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
