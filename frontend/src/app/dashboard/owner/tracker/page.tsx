'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Timeline, type TimelineItem } from '@/components/ui/timeline';
import { MapPin, CheckCircle2, Clock, AlertTriangle, FileText, CheckSquare, Wrench } from 'lucide-react';
import { REQUEST_STATUSES, type RequestStatus } from '@/lib/constants';

export default function TrackerPage() {
  const { data: requests, isLoading, error, refetch } = useQuery({
    queryKey: ['owner-requests'],
    queryFn: () => api.getRequests(),
  });

  const activeRequest = requests?.results?.[0];

  const getTimelineItems = (currentStatus: RequestStatus, submittedAt: string): TimelineItem[] => {
    // Basic logic mapping statuses to a linear timeline
    const isPast = (s: RequestStatus) => {
      const order: RequestStatus[] = [
        REQUEST_STATUSES.DRAFT,
        REQUEST_STATUSES.SUBMITTED,
        REQUEST_STATUSES.PHOTO_CHECK_PENDING,
        REQUEST_STATUSES.REVIEW_REQUIRED,
        REQUEST_STATUSES.CORRECTIVE_ACTION_REQUIRED,
        REQUEST_STATUSES.AWAITING_VERIFICATION,
        REQUEST_STATUSES.AWAITING_RWA_DECISION,
        REQUEST_STATUSES.APPROVED,
        REQUEST_STATUSES.APPROVED_WITH_CONDITIONS,
        REQUEST_STATUSES.REJECTED,
        REQUEST_STATUSES.CLOSED,
      ];
      return order.indexOf(currentStatus) >= order.indexOf(s);
    };

    return [
      {
        id: '1',
        title: 'Request Submitted',
        description: 'Initial site photos and details provided.',
        time: submittedAt,
        active: isPast(REQUEST_STATUSES.SUBMITTED),
        icon: <FileText className="w-4 h-4" />
      },
      {
        id: '2',
        title: 'AI Photo Check',
        description: 'Automated preliminary screening of evidence.',
        active: currentStatus === REQUEST_STATUSES.PHOTO_CHECK_PENDING || isPast(REQUEST_STATUSES.REVIEW_REQUIRED),
        icon: <CheckSquare className="w-4 h-4" />
      },
      {
        id: '3',
        title: 'Condition Verification',
        description: 'Completion of any corrective actions.',
        active: currentStatus === REQUEST_STATUSES.CORRECTIVE_ACTION_REQUIRED || isPast(REQUEST_STATUSES.AWAITING_VERIFICATION),
        icon: <Wrench className="w-4 h-4" />
      },
      {
        id: '4',
        title: 'RWA Decision',
        description: 'Final review by the society RWA.',
        active: currentStatus === REQUEST_STATUSES.AWAITING_RWA_DECISION || isPast(REQUEST_STATUSES.APPROVED),
        icon: <CheckCircle2 className="w-4 h-4" />
      }
    ];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">Progress Tracker</h1>
        <p className="text-text-muted mt-1">Real-time status of your active charging permission request.</p>
      </div>

      {error ? (
        <ErrorState message="Failed to load tracker" onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton className="h-[500px] w-full" />
      ) : !activeRequest ? (
        <EmptyState
          title="No active request"
          description="Submit a new charging request to track its progress."
          icon={MapPin}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Request {activeRequest.request_number}</CardTitle>
            <CardDescription>
              Currently in status: <span className="font-semibold text-text-primary capitalize">{activeRequest.status.replace(/_/g, ' ')}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-2xl mt-4">
              <Timeline items={getTimelineItems(activeRequest.status, activeRequest.submitted_at || activeRequest.created_at)} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
