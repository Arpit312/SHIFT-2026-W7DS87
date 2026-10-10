'use client';
import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DemoDataBanner } from '@/components/ui/demo-data-banner';
import { formatDateTime } from '@/lib/utils';
import {
  ShieldAlert,
  CheckCircle2,
  Info,
  AlertTriangle,
  Clock,
  RefreshCw,
  XCircle,
  MapPin,
} from 'lucide-react';
import {
  VERDICT_LABELS,
  ASSESSMENT_STATUSES,
  type Verdict,
  type AssessmentTaskStatus,
} from '@/lib/constants';
import type { Assessment, Finding } from '@/types';

// ── Verdict icon ──────────────────────────────────────────────────────────────

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  switch (verdict) {
    case 'yes':
      return <CheckCircle2 className="w-6 h-6 text-success" />;
    case 'yes_with_conditions':
      return <AlertTriangle className="w-6 h-6 text-warning" />;
    case 'electrician_first':
      return <ShieldAlert className="w-6 h-6 text-danger" />;
    case 'needs_review':
      return <Info className="w-6 h-6 text-info" />;
    default:
      return null;
  }
}

// ── Assessment task status badge ──────────────────────────────────────────────

function AssessmentStatusBadge({ status }: { status: AssessmentTaskStatus }) {
  switch (status) {
    case ASSESSMENT_STATUSES.PENDING:
    case ASSESSMENT_STATUSES.RUNNING:
      return (
        <Badge variant="info" className="gap-1">
          <Clock className="w-3 h-3" />
          {status === ASSESSMENT_STATUSES.RUNNING ? 'Analysing…' : 'Pending'}
        </Badge>
      );
    case ASSESSMENT_STATUSES.FAILED:
      return (
        <Badge variant="danger" className="gap-1">
          <XCircle className="w-3 h-3" />
          Analysis failed
        </Badge>
      );
    case ASSESSMENT_STATUSES.COMPLETED:
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </Badge>
      );
    default:
      return null;
  }
}

// ── Finding card ──────────────────────────────────────────────────────────────

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className="p-4 border border-cn-border rounded-lg bg-surface space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h5 className="font-semibold text-sm">{finding.title}</h5>
          <p className="text-sm text-text-muted mt-1">{finding.explanation}</p>
        </div>
        <SeverityBadge severity={finding.severity} />
      </div>

      <div className="text-sm">
        <span className="font-medium text-brand-orange">Recommended action: </span>
        {finding.recommended_action}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-text-muted pt-1 border-t border-cn-border">
        {finding.source_photo_id && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Photo: {finding.source_photo_id}
          </span>
        )}
        {finding.confidence != null && (
          <span>Confidence: {Math.round(finding.confidence * 100)}%</span>
        )}
        {(finding as any).analyzer && (
          <span>Analyser: {(finding as any).analyzer}</span>
        )}
      </div>
    </div>
  );
}

// ── Main inner component ──────────────────────────────────────────────────────

function PhotoCheckPageInner() {
  const searchParams = useSearchParams();
  const requestId = searchParams?.get('id');
  const queryClient = useQueryClient();

  const { data: requests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['owner-requests'],
    queryFn: () => api.getRequests(),
    enabled: !requestId,
  });

  const activeId = requestId ?? requests?.results?.[0]?.id;

  const {
    data: assessments,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assessments', activeId],
    queryFn: () => api.getAssessments(activeId!),
    enabled: !!activeId,
    // Poll while assessment is pending/running
    refetchInterval: (query) => {
      const latest = query.state.data?.results?.[0] as (Assessment & { status?: string }) | undefined;
      if (
        latest?.status === ASSESSMENT_STATUSES.PENDING ||
        latest?.status === ASSESSMENT_STATUSES.RUNNING
      ) {
        return 5000;
      }
      return false;
    },
  });

  const latest = assessments?.results?.[0] as
    | (Assessment & { status?: AssessmentTaskStatus; error_message?: string; service_name?: string })
    | undefined;

  const handleRetry = async () => {
    if (!activeId) return;
    try {
      await api.triggerPhotoCheck(activeId);
      queryClient.invalidateQueries({ queryKey: ['assessments', activeId] });
    } catch {
      // error toast handled by api-client
    }
  };

  // ── Pending / running state ──────────────────────────────────────────────
  const isPendingOrRunning =
    latest?.status === ASSESSMENT_STATUSES.PENDING ||
    latest?.status === ASSESSMENT_STATUSES.RUNNING;

  // ── Failed state ─────────────────────────────────────────────────────────
  const isFailed = latest?.status === ASSESSMENT_STATUSES.FAILED;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary">
            Preliminary Screening Report
          </h1>
          <p className="text-text-muted mt-1">
            AI-assisted visible-risk screening. Not a safety certification or approval.
          </p>
        </div>
      </div>

      {/* Demo banner — only shown when is_demo is true */}
      {latest?.is_demo && (
        <DemoDataBanner message="This report was generated by the mock AI service. Results do not reflect real photo analysis." />
      )}

      {error ? (
        <ErrorState message="Failed to load screening report" onRetry={() => refetch()} />
      ) : isRequestsLoading || (isLoading && activeId) ? (
        <Skeleton className="h-[300px] w-full" />
      ) : !activeId ? (
        <EmptyState
          title="No active request"
          description="You need an active charging request to view a screening report."
        />
      ) : !latest ? (
        <EmptyState
          title="Report pending"
          description="Your photos are being analysed. Please check back shortly."
        />
      ) : isPendingOrRunning ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <Clock className="w-10 h-10 text-info animate-pulse" />
            <h3 className="font-semibold text-lg">Analysis in progress</h3>
            <p className="text-sm text-text-muted max-w-sm">
              Your photos are being screened. This usually takes 10–30 seconds.
              The page will refresh automatically.
            </p>
            <AssessmentStatusBadge status={latest.status!} />
          </CardContent>
        </Card>
      ) : isFailed ? (
        <Card className="border-danger">
          <CardContent className="py-8 flex flex-col items-center gap-4 text-center">
            <XCircle className="w-10 h-10 text-danger" />
            <h3 className="font-semibold text-lg">Analysis failed</h3>
            <p className="text-sm text-text-muted max-w-sm">
              {latest.error_message
                ? `Error: ${latest.error_message}`
                : 'The screening service could not process your photos. Please retry.'}
            </p>
            <Button onClick={handleRetry} variant="secondary" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Overall verdict ────────────────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Screening Outcome</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-cn-border">
                  <VerdictIcon verdict={latest.overall_verdict} />
                  <div>
                    <h3 className="font-bold text-lg">
                      {VERDICT_LABELS[latest.overall_verdict] ?? latest.overall_verdict}
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      This is a preliminary screening result only. An electrician must
                      inspect the site before any installation decision.
                    </p>
                  </div>
                </div>

                {/* ── Findings ──────────────────────────────────────────── */}
                {latest.findings && latest.findings.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">
                      Visible Issues Found ({latest.findings.length})
                    </h4>
                    <div className="space-y-3">
                      {latest.findings.map((f: Finding) => (
                        <FindingCard key={f.finding_id} finding={f} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Missing information ───────────────────────────────── */}
                {latest.missing_information && latest.missing_information.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-warning">
                      Missing or Unclear Information
                    </h4>
                    <ul className="space-y-1">
                      {latest.missing_information.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-text-muted flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Sidebar ──────────────────────────────────────────────── */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-text-muted">
                    Report Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-text-muted">Date Screened</p>
                    <p className="text-sm font-medium">
                      {formatDateTime(latest.assessed_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Version</p>
                    <p className="text-sm font-medium">v{latest.assessment_version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Status</p>
                    <AssessmentStatusBadge status={(latest.status ?? 'completed') as AssessmentTaskStatus} />
                  </div>
                  {latest.service_name && !latest.is_demo && (
                    <div>
                      <p className="text-xs text-text-muted">Analyser</p>
                      <p className="text-sm font-medium font-mono">{latest.service_name}</p>
                    </div>
                  )}
                  {latest.requires_human_review && (
                    <div className="mt-4 p-3 bg-warning/10 text-warning rounded-lg text-sm flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>Flagged for mandatory electrician inspection.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Limitations ───────────────────────────────────────── */}
              {latest.limitations && latest.limitations.length > 0 && (
                <Card className="bg-surface/50 border-dashed">
                  <CardContent className="p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                      Limitations of This Screening
                    </h4>
                    <ul className="text-xs text-text-muted space-y-1 list-disc pl-3">
                      {latest.limitations.map((lim: string, i: number) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* ── Suggested conditions ────────────────────────────────────── */}
          {latest.conditions && latest.conditions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Corrective Actions</CardTitle>
                <CardDescription>
                  These are preliminary suggestions. The RWA may specify different
                  or additional requirements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latest.conditions.map((cond: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 border border-cn-border rounded-lg bg-surface"
                    >
                      <h4 className="font-semibold text-sm">{cond.title}</h4>
                      <p className="text-sm text-text-muted mt-1">{cond.explanation}</p>
                      <div className="mt-3 text-sm">
                        <span className="font-medium text-brand-orange">
                          Required action:{' '}
                        </span>
                        {cond.required_action}
                      </div>
                      {cond.required_evidence && (
                        <div className="mt-2 text-xs text-text-muted">
                          <span className="font-medium">Proof needed:</span>{' '}
                          {cond.required_evidence}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function PhotoCheckPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <PhotoCheckPageInner />
    </Suspense>
  );
}
