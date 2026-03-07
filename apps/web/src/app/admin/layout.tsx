'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/divisions', label: 'Divisions' },
  { href: '/admin/employees', label: 'Employees' },
  { href: '/admin/trainings', label: 'Trainings' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/analytics', label: 'Analytics' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-6 gap-4">
          {/* Logo */}
          <span className="text-lg font-bold text-gray-900">TMS</span>
          <div className="w-px h-6 bg-gray-200" />
          {/* Portal badge */}
          <div className="flex items-center gap-1.5 text-[#6366f1]">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Portal</span>
          </div>
          {/* Nav links */}
          <nav className="flex items-center gap-6 ml-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  isActive(link.href)
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {/* Right side */}
          <div className="ml-auto flex items-center gap-5">
            {user && (
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                <span>{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
      {/* Page content */}
      <main className="p-8">{children}</main>
    </div>
  );
}
