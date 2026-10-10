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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (error) { 
    return <div className='p-8 text-danger bg-background h-screen'>
      <h1 className="text-2xl font-bold mb-4">Error loading profile</h1>
      <pre className="bg-surface p-4 rounded text-sm whitespace-pre-wrap">{String(error)}</pre>
      <button onClick={() => window.location.href='/login'} className="mt-4 px-4 py-2 bg-brand-orange text-white rounded">Go to Login</button>
    </div>; 
  }

  if (!profile) {
    return (
      <div className='p-8 text-danger bg-background h-screen'>
        <h1 className="text-2xl font-bold mb-4">No Profile Found</h1>
        <p>Your profile data is empty. Please try logging in again.</p>
        <button onClick={() => window.location.href='/login'} className="mt-4 px-4 py-2 bg-brand-orange text-white rounded">Go to Login</button>
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
