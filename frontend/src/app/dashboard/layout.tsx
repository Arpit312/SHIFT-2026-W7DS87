'use client';

import { useState } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile, isLoading, error } = useAuth();

  // Always render {children} so Next.js can validate instant navigation segments.
  // When auth is still loading or profile is unavailable, show a loading shell
  // around the sidebar but keep {children} in the tree.
  if (isLoading || !profile) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden lg:block w-64 shrink-0 bg-surface border-r border-cn-border">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin">
            <div className="max-w-6xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar role={profile.role} />
      </div>
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        role={profile.role}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
