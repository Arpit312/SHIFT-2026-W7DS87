'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Building2, Users, FileText, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.getAdminOverview(),
  });

  if (isLoading) return <Skeleton className="h-[500px] w-full" />;
  if (error) return <ErrorState message="Failed to load platform stats" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">Platform Overview</h1>
        <p className="text-text-muted mt-1">Global statistics and administration.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Societies</CardTitle>
            <Building2 className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">{data?.societies_count || 0}</div>
            <p className="text-xs text-text-muted mt-1">Onboarded platforms</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">{data?.users_count || 0}</div>
            <p className="text-xs text-text-muted mt-1">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">{data?.requests_count || 0}</div>
            <p className="text-xs text-text-muted mt-1">Processed applications</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Administration</CardTitle>
          <CardDescription>
            Super admin controls are managed via Django admin in Phase 1.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-cn-border rounded-lg bg-surface flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-text-muted" />
              <div>
                <p className="font-medium text-text-primary">Django Administration</p>
                <p className="text-sm text-text-muted">Manage roles, create societies, and edit raw data.</p>
              </div>
            </div>
            <a 
              href={process.env.NEXT_PUBLIC_API_BASE_URL + '/admin/'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm bg-elevated hover:bg-surface border border-cn-border px-4 py-2 rounded-md font-medium transition-colors"
            >
              Open Django Admin
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
