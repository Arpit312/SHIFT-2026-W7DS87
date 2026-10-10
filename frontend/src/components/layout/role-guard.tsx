'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/lib/constants';
import { ROLE_DASHBOARD_PATHS } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { profile, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!profile) {
        router.push('/login');
      } else if (!allowedRoles.includes(profile.role)) {
        router.push(ROLE_DASHBOARD_PATHS[profile.role]);
      }
    }
  }, [profile, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-transparent">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-transparent text-text-primary">
        <p className="mb-4">Checking access...</p>
        <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (!allowedRoles.includes(profile.role)) {
    return null; // Redirecting...
  }

  return <>{children}</>;
}
