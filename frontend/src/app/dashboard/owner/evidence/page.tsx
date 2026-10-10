'use client';
import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatFileSize, formatDateTime } from '@/lib/utils';
import { FileImage, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function EvidenceLockerPageInner() {
  const searchParams = useSearchParams();
  const requestId = searchParams?.get('id');

  const { data: requests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['owner-requests'],
    queryFn: () => api.getRequests(),
    enabled: !requestId,
  });

  const activeId = requestId || (requests?.results?.[0]?.id);

  const { data: evidenceList, isLoading, error, refetch } = useQuery({
    queryKey: ['evidence', activeId],
    queryFn: () => api.getEvidence(activeId!),
    enabled: !!activeId,
  });

  const original = evidenceList?.results?.filter(e => !e.is_corrective) || [];
  const corrective = evidenceList?.results?.filter(e => e.is_corrective) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">Evidence Locker</h1>
        <p className="text-text-muted mt-1">Immutable record of all photos and reports submitted.</p>
      </div>

      {error ? (
        <ErrorState message="Failed to load evidence" onRetry={() => refetch()} />
      ) : isRequestsLoading || (isLoading && activeId) ? (
        <Skeleton className="h-[300px] w-full" />
      ) : !activeId ? (
        <EmptyState title="No active request" description="Start a charging request to view evidence." />
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileImage className="w-5 h-5 text-text-muted" />
                <CardTitle>Original Evidence</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {original.length === 0 ? (
                <p className="text-sm text-text-muted">No original evidence found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date Uploaded</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {original.map(ev => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-mono text-xs">{ev.evidence_id}</TableCell>
                        <TableCell className="capitalize">{ev.category.replace('_', ' ')}</TableCell>
                        <TableCell>{formatDateTime(ev.created_at)}</TableCell>
                        <TableCell>{formatFileSize(ev.file_size_bytes)}</TableCell>
                        <TableCell>
                          <a href={ev.file_url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-orange hover:underline text-sm">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {corrective.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-text-muted" />
                  <CardTitle>Corrective Evidence</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date Uploaded</TableHead>
                      <TableHead>Condition Ref</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corrective.map(ev => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-mono text-xs">{ev.evidence_id}</TableCell>
                        <TableCell className="capitalize">{ev.category.replace('_', ' ')}</TableCell>
                        <TableCell>{formatDateTime(ev.created_at)}</TableCell>
                        <TableCell>{ev.condition_addressed ? 'Linked' : 'N/A'}</TableCell>
                        <TableCell>
                          <a href={ev.file_url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-orange hover:underline text-sm">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function EvidenceLockerPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <EvidenceLockerPageInner />
    </Suspense>
  );
}
