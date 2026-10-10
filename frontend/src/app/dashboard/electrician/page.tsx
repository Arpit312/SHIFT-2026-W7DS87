'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/utils';
import { Wrench, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ElectricianDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['electrician-inspections'],
    queryFn: () => api.getInspections(),
  });

  if (isLoading) return <Skeleton className="h-[500px] w-full" />;
  if (error) return <ErrorState message="Failed to load inspections" onRetry={() => refetch()} />;
  
  const inspections = data?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">Assigned Inspections</h1>
        <p className="text-text-muted mt-1">Review your assigned verification tasks.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-text-muted" />
            <CardTitle>Inspections Queue</CardTitle>
          </div>
          <CardDescription>
            Sites requiring professional review and sign-off.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No pending inspections"
              description="You have not been assigned any sites for verification yet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned On</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono font-medium">{req.request_number}</TableCell>
                    <TableCell>{req.owner_id}</TableCell>
                    <TableCell>
                      <StatusBadge type="request" status={req.status} />
                    </TableCell>
                    <TableCell>
                      {req.submitted_at ? formatDateTime(req.submitted_at) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Read-only view for Phase 1 */}
                      <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
