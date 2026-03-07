'use client';

import { UserNav } from '@/components/ui/user-nav';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-6 gap-4">
          <span className="text-lg font-bold text-gray-900">TMS</span>
          <div className="ml-auto">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="p-8">{children}</main>
    </div>
  );
}
