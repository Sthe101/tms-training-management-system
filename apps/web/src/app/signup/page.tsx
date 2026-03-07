'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { api, tokenStore } from '@/lib/api';

interface Department { id: string; name: string }
interface Division { id: string; name: string; departments: Department[] }

// ── Signup Page ──────────────────────────────────────────────────────────────

const REDIRECT: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  CLERK: '/clerk/dashboard',
  EMPLOYEE: '/employee/pending',
};

export default function SignupPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (api.auth.getDivisions() as Promise<{ divisions: Division[] }>)
      .then((res) => setDivisions(res.divisions ?? []))
      .catch(() => {/* non-critical on load */});
  }, []);

  const departments = selectedDivision?.departments ?? [];

  const handleDivisionSelect = (div: { id: string; name: string }) => {
    const full = divisions.find((d) => d.id === div.id) ?? null;
    setSelectedDivision(full);
    setSelectedDepartment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!selectedDivision) { setError('Please select your division'); return; }
    if (!selectedDepartment) { setError('Please select your department'); return; }

    setLoading(true);
    try {
      const result = await api.auth.register({
        name,
        email,
        password,
        divisionId: selectedDivision.id,
        departmentId: selectedDepartment.id,
      }) as any;
      if (result.token) tokenStore.set(result.token);
      window.location.href = REDIRECT[result.user?.role] || '/employee/pending';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#e8f4fc] px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 bg-[#0891b2] rounded-lg flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">TMS</h1>
        <p className="text-[#0891b2]">Training Management System</p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create an account</h2>
            <p className="text-sm text-[#0891b2]">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@tms.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters, upper, lower, number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Division</Label>
              <SearchableSelect
                placeholder="Search and select your division..."
                items={divisions}
                selected={selectedDivision}
                onSelect={handleDivisionSelect}
              />
              {divisions.length === 0 && (
                <p className="text-xs text-gray-400">No divisions available yet — contact your admin.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <SearchableSelect
                placeholder={selectedDivision ? 'Search and select your department...' : 'Select a division first'}
                items={departments}
                selected={selectedDepartment}
                onSelect={(d) => setSelectedDepartment(d as Department)}
                disabled={!selectedDivision}
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-[#0066a1] hover:bg-[#005080]"
              disabled={loading}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-[#0066a1] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
