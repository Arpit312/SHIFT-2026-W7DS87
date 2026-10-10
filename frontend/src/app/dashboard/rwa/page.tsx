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
import { Inbox, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RwaDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['rwa-requests'],
    queryFn: () => api.getRwaRequests(),
  });

  if (isLoading) return <Skeleton className="h-[500px] w-full" />;
  if (error) return <ErrorState message="Failed to load requests" onRetry={() => refetch()} />;
  
  const requests = data?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">Requests Inbox</h1>
        <p className="text-text-muted mt-1">Manage charging requests from your society members.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-text-muted" />
            <CardTitle>Incoming Requests</CardTitle>
          </div>
          <CardDescription>
            Review applications and make evidence-based decisions (Actions arrive in Phase 2).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <EmptyState
              title="No requests found"
              description="Your society currently has no EV charging requests."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono font-medium">{req.request_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{req.owner_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.vehicle.manufacturer} {req.vehicle.model}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="request" status={req.status} />
                    </TableCell>
                    <TableCell>
                      {req.submitted_at ? formatDateTime(req.submitted_at) : 'Not submitted'}
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
