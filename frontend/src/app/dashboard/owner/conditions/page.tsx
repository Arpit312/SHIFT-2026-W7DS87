'use client';
import { Suspense, useState } from 'react';

import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { useToast } from '@/components/ui/toast';
import { CheckSquare, UploadCloud, Timeline as TimelineIcon } from 'lucide-react';
import { CONDITION_STATUSES } from '@/lib/constants';
import { Timeline } from '@/components/ui/timeline';
import { formatDateTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

function ConditionsPageInner() {
  const searchParams = useSearchParams();
  const requestId = searchParams?.get('id');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploadingConditionId, setUploadingConditionId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: requests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['owner-requests'],
    queryFn: () => api.getRequests(),
    enabled: !requestId,
  });

  const activeId = requestId || (requests?.results?.[0]?.id);

  const { data: conditions, isLoading, error, refetch } = useQuery({
    queryKey: ['conditions', activeId],
    queryFn: () => api.getConditions(activeId!),
    enabled: !!activeId,
  });

  const handleUploadProof = async (conditionId: string) => {
    if (!proofFile) {
      toast({ type: 'error', title: 'Error', message: 'Please select a file first.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `proof/${conditionId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chargenoc-evidence')
        .upload(filePath, proofFile);
        
      if (uploadError) throw uploadError;
      
      await api.submitConditionProof(conditionId, {
        evidence_ids: [filePath],
      });
      
      toast({ type: 'success', title: 'Proof uploaded', message: 'The verification team will review your proof shortly.' });
      setUploadingConditionId(null);
      setProofFile(null);
      queryClient.invalidateQueries({ queryKey: ['conditions', activeId] });
      
    } catch (err: any) {
      toast({ type: 'error', title: 'Upload failed', message: err.message || 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const conds = conditions?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">Conditions & Fixes</h1>
        <p className="text-text-muted mt-1">Address corrective actions required by the AI screener or electrician.</p>
      </div>

      {error ? (
        <ErrorState message="Failed to load conditions" onRetry={() => refetch()} />
      ) : isRequestsLoading || (isLoading && activeId) ? (
        <Skeleton className="h-[300px] w-full" />
      ) : !activeId ? (
        <EmptyState title="No active request" description="You don't have any active conditions." />
      ) : conds.length === 0 ? (
        <EmptyState 
          title="All clear!" 
          description="There are no pending conditions for your active request." 
          icon={CheckSquare}
        />
      ) : (
        <div className="space-y-6">
          {conds.map(c => (
            <Card key={c.id} className={c.status === CONDITION_STATUSES.REWORK_REQUIRED ? 'border-warning' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{c.title}</CardTitle>
                    <p className="text-sm text-text-muted mt-1">{c.explanation}</p>
                  </div>
                  <StatusBadge status={c.status} type="condition" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-surface p-4 rounded-lg">
                  <p className="font-semibold text-sm">Required Action:</p>
                  <p className="text-sm mt-1">{c.required_action}</p>
                  {c.required_evidence && (
                    <div className="mt-3 text-sm text-text-muted">
                      <strong>Proof needed:</strong> {c.required_evidence}
                    </div>
                  )}
                </div>

                {(c.status === CONDITION_STATUSES.PENDING || c.status === CONDITION_STATUSES.REWORK_REQUIRED) && (
                  <div className="space-y-4 pt-4 border-t border-cn-border">
                    <h4 className="font-semibold text-sm">Submit Proof of Completion</h4>
                    <FileDropzone
                      selectedFile={proofFile}
                      onFileSelect={setProofFile}
                      onClear={() => setProofFile(null)}
                      accept="image/*,application/pdf"
                    />
                    <div className="flex justify-end">
                      <Button 
                        disabled={!proofFile || isSubmitting}
                        onClick={() => handleUploadProof(c.id)}
                      >
                        {isSubmitting ? 'Uploading...' : 'Submit Proof'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConditionsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <ConditionsPageInner />
    </Suspense>
  );
}
