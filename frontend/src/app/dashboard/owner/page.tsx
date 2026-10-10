'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { formatDateTime } from '@/lib/utils';
import { FilePlus, ArrowRight, ShieldCheck, Download, Activity } from 'lucide-react';
import Link from 'next/link';
import { DemoDataBanner } from '@/components/ui/demo-data-banner';

export default function OwnerOverviewPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['owner-overview'],
    queryFn: () => api.getOwnerOverview(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-heading">Dashboard Overview</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        message="Failed to load dashboard overview. Please try again." 
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) return null;

  const activeRequest = data.active_requests?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold font-heading text-text-primary">Dashboard Overview</h1>
        {!activeRequest && (
          <Link href="/dashboard/owner/new-request">
            <Button icon={<FilePlus className="w-4 h-4" />}>New Request</Button>
          </Link>
        )}
      </div>

      {/* Demo Banner if needed based on API, but let's assume standard banner for slots/bills later */}
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Status Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle>Current Charging Request</CardTitle>
            <CardDescription>Status of your active EV charging application</CardDescription>
          </CardHeader>
          <CardContent>
            {activeRequest ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-elevated rounded-lg border border-cn-border">
                  <div>
                    <p className="text-sm text-text-muted mb-1">Request ID</p>
                    <p className="font-mono font-medium">{activeRequest.request_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-muted mb-1">Status</p>
                    <StatusBadge type="request" status={activeRequest.status} />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Link href="/dashboard/owner/tracker" className="flex-1">
                    <Button variant="secondary" className="w-full">View Tracker</Button>
                  </Link>
                  <Link href={`/dashboard/owner/photo-check?id=${activeRequest.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">Safety Report</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-elevated rounded-full flex items-center justify-center mx-auto mb-3">
                  <FilePlus className="w-6 h-6 text-text-muted" />
                </div>
                <p className="text-text-primary font-medium mb-1">No active requests</p>
                <p className="text-sm text-text-muted mb-4">Start by creating a new charging request for your RWA.</p>
                <Link href="/dashboard/owner/new-request">
                  <Button>Start Request</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            {data.pending_conditions_count > 0 ? (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="font-medium text-warning mb-2">
                  {data.pending_conditions_count} Action(s) Required
                </p>
                <p className="text-sm text-warning/80 mb-4">
                  You have pending conditions to resolve before your request can proceed.
                </p>
                <Link href="/dashboard/owner/conditions">
                  <Button variant="secondary" size="sm" className="w-full">View Conditions</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 text-text-muted">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">You&apos;re all caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Slot */}
        <Card>
          <CardHeader className="pb-4 border-b border-cn-border mb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Next Charging Slot</CardTitle>
              <Link href="/dashboard/owner/slots" className="text-brand-orange hover:text-brand-orange-hover text-sm font-medium flex items-center">
                All Slots <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.next_slot ? (
              <div>
                <p className="text-sm text-text-muted mb-1">Date & Time</p>
                <p className="font-medium mb-3">{formatDateTime(`${data.next_slot.date}T${data.next_slot.start_time}`)}</p>
                
                <p className="text-sm text-text-muted mb-1">Duration</p>
                <p className="font-medium">{data.next_slot.duration_minutes} minutes</p>
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-4">No confirmed slots scheduled.</p>
            )}
          </CardContent>
        </Card>

        {/* Latest Bill */}
        <Card>
          <CardHeader className="pb-4 border-b border-cn-border mb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Latest Bill</CardTitle>
              <Link href="/dashboard/owner/bills" className="text-brand-orange hover:text-brand-orange-hover text-sm font-medium flex items-center">
                All Bills <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.latest_invoice ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-text-muted">Amount</p>
                  <span className="font-medium">₹{data.latest_invoice.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-text-muted">Status</p>
                  <span className="text-sm px-2 py-1 bg-surface border border-cn-border rounded uppercase tracking-wider">{data.latest_invoice.status}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-4">No bills generated yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Haan Packet */}
        <Card>
          <CardHeader className="pb-4 border-b border-cn-border mb-4">
            <CardTitle>Haan Packet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-2">
              <p className="text-sm text-text-muted mb-4">Download your official request and decision packet.</p>
              <Link href="/dashboard/owner/packet">
                <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
                  Access Documents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline snippet */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-text-muted" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {data.recent_activity?.length > 0 ? (
            <div className="space-y-4">
              {data.recent_activity.map((event) => (
                <div key={event.id} className="flex gap-4 text-sm">
                  <div className="w-32 shrink-0 text-text-muted">
                    {formatDateTime(event.created_at).split(', ')[0]}
                  </div>
                  <div>
                    <span className="font-medium text-text-primary mr-2">{event.actor_name}</span>
                    <span className="text-text-muted">{event.description}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-4">No recent activity.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
