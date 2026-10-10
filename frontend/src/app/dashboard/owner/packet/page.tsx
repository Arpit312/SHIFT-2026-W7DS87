'use client';
import { Suspense, useState } from 'react';

import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { FileText, Download, ShieldCheck } from 'lucide-react';
import { HAAN_PACKET_DISCLAIMER } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

function PacketPageInner() {
  const searchParams = useSearchParams();
  const requestId = searchParams?.get('id');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: requests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['owner-requests'],
    queryFn: () => api.getRequests(),
    enabled: !requestId,
  });

  const activeId = requestId || (requests?.results?.[0]?.id);

  const { data: packets, isLoading, error, refetch } = useQuery({
    queryKey: ['packets', activeId],
    queryFn: () => api.getPackets(activeId!),
    enabled: !!activeId,
  });

  const handleGenerate = async () => {
    if (!activeId) return;
    setIsGenerating(true);
    try {
      await api.generatePacket(activeId);
      toast({ type: 'success', title: 'Success', message: 'Haan Packet generated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['packets', activeId] });
    } catch (e: unknown) {
      toast({ type: 'error', title: 'Generation failed', message: (e as any).message || 'Could not generate packet.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const packetList = packets?.results || [];
  const latestPacket = packetList[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">Haan Packet</h1>
        <p className="text-text-muted mt-1">Download the verified evidence and decision report.</p>
      </div>

      {error ? (
        <ErrorState message="Failed to load packets" onRetry={() => refetch()} />
      ) : isRequestsLoading || (isLoading && activeId) ? (
        <Skeleton className="h-[300px] w-full" />
      ) : !activeId ? (
        <EmptyState title="No active request" description="You don't have an active request to generate a packet for." />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-orange" />
                  <CardTitle>Decision Record</CardTitle>
                </div>
                <CardDescription>
                  This packet contains your request details, AI screening results, condition verifications, and the final RWA decision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-warning shrink-0" />
                  <p className="text-sm text-text-primary leading-relaxed">
                    {HAAN_PACKET_DISCLAIMER}
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Latest Packet'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {packetList.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Packet History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {packetList.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-cn-border">
                        <div>
                          <p className="font-medium text-sm">Version {p.version}</p>
                          <p className="text-xs text-text-muted">{formatDateTime(p.created_at)}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={p.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" /> Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="bg-surface/50">
              <CardHeader>
                <CardTitle className="text-lg">What is included?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-text-muted list-disc pl-4">
                  <li>Original installation photos</li>
                  <li>AI Photo Check findings</li>
                  <li>Electrician verification (if applicable)</li>
                  <li>Corrective action proofs</li>
                  <li>RWA formal decision</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PacketPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <PacketPageInner />
    </Suspense>
  );
}
