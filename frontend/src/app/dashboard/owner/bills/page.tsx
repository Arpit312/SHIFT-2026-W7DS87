'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Receipt, AlertCircle } from 'lucide-react';
import { DemoDataBanner } from '@/components/ui/demo-data-banner';
import { formatDateTime } from '@/lib/utils';
import { Suspense } from 'react';

function BillsPageInner() {
  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.getInvoices(),
  });

  const invoiceList = invoices?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">My Bills</h1>
        <p className="text-text-muted mt-1">Reconciliation and billing estimates for your charging sessions.</p>
      </div>

      <DemoDataBanner message="Billing and payments are simulated in Phase 1." />

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <ErrorState message="Failed to load bills" onRetry={() => refetch()} />
          ) : isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : invoiceList.length === 0 ? (
            <EmptyState title="No bills found" description="You have no outstanding or past invoices." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceList.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.id.substring(0,8)}</TableCell>
                    <TableCell>{formatDateTime(inv.created_at)}</TableCell>
                    <TableCell>₹{inv.total_amount}</TableCell>
                    <TableCell>{inv.status}</TableCell>
                    <TableCell>
                      <Button variant="secondary" size="sm">View</Button>
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

export default function BillsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <BillsPageInner />
    </Suspense>
  );
}
