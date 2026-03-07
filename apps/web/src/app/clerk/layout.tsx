'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { UserNav } from '@/components/ui/user-nav';
import { useRoleGuard } from '@/hooks/use-role-guard';

const navLinks = [{ href: '/clerk/dashboard', label: 'Dashboard' }];

export default function ClerkLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useRoleGuard('CLERK');

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-6 gap-4">
          <span className="text-lg font-bold text-gray-900">TMS</span>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-1.5 text-[#7c3aed]">
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm font-medium">Clerk Portal</span>
          </div>
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
          <div className="ml-auto">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="p-8">{children}</main>
    </div>
  );
}
