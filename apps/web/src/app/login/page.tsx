'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Redirect based on role
      const redirectMap: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        MANAGER: '/manager/dashboard',
        CLERK: '/clerk/dashboard',
      };

      router.push(redirectMap[role] || '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#e8f4fc] px-4">
      {/* Logo and Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 bg-[#0891b2] rounded-lg flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">TMS</h1>
        <p className="text-[#0891b2]">Training Management System</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Sign in to your account
            </h2>
            <p className="text-sm text-[#0891b2]">
              Select your role and enter your credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Select */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="CLERK">Clerk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#0066a1] hover:bg-[#005080]"
              disabled={loading || !role}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sign Up Link */}
      <p className="mt-6 text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[#0066a1] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
