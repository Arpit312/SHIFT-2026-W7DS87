'use client';
import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, Zap } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { DemoDataBanner } from '@/components/ui/demo-data-banner';

function SlotsPageInner() {
  const searchParams = useSearchParams();
  const requestId = searchParams?.get('id');

  const { data: requests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['owner-requests'],
    queryFn: () => api.getRequests(),
    enabled: !requestId,
  });

  const activeId = requestId || (requests?.results?.[0]?.id);

  const { data: slots, isLoading, error, refetch } = useQuery({
    queryKey: ['slots', activeId],
    queryFn: () => api.getSlots(activeId!),
    enabled: !!activeId,
  });

  const slotList = slots?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">My Charging Slots</h1>
        <p className="text-text-muted mt-1">View your allocated charging times and durations.</p>
      </div>

      <DemoDataBanner />

      {error ? (
        <ErrorState message="Failed to load slots" onRetry={() => refetch()} />
      ) : isRequestsLoading || (isLoading && activeId) ? (
        <Skeleton className="h-[300px] w-full" />
      ) : !activeId ? (
        <EmptyState title="No active request" description="You must have an active request to view slots." />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-text-muted" />
              <CardTitle>Schedule</CardTitle>
            </div>
            <CardDescription>
              Note: We do not control your physical charger. This is a load-management schedule provided by your RWA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slotList.length === 0 ? (
              <EmptyState title="No slots scheduled" description="You do not have any scheduled charging slots at this time." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Power</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slotList.map(slot => (
                    <TableRow key={slot.id}>
                      <TableCell>{slot.date}</TableCell>
                      <TableCell className="font-mono">
                        {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                      </TableCell>
                      <TableCell>{slot.duration_minutes} min</TableCell>
                      <TableCell>{slot.charger_power_kw} kW</TableCell>
                      <TableCell>{slot.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SlotsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <SlotsPageInner />
    </Suspense>
  );
}
