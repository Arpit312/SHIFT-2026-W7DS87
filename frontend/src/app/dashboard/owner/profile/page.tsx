'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { User, Car, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function ProfilePage() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const { data: vehicles, isLoading: isVehiclesLoading, error, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.getVehicles(),
  });

  const handleDeletionRequest = async () => {
    try {
      await api.requestDeletion({ reason: 'User requested via profile' });
      toast({ type: 'success', title: 'Request submitted', message: 'Your data deletion request has been submitted to the administration.' });
    } catch (e: unknown) {
      toast({ type: 'error', title: 'Failed', message: (e as any).message || 'Could not submit request.' });
    }
  };

  const vehicleList = vehicles?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">Profile & Vehicle</h1>
        <p className="text-text-muted mt-1">Manage your personal information and registered EVs.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-text-muted" />
              <CardTitle>Personal Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile ? (
              <>
                <div>
                  <p className="text-sm text-text-muted">Full Name</p>
                  <p className="font-medium">{profile.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Phone Number</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Society</p>
                  <p className="font-medium">{profile.society_name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Flat / Unit</p>
                  <p className="font-medium">{profile.flat_number}</p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-text-muted" />
              <CardTitle>Registered Vehicles</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <ErrorState message="Failed to load vehicles" onRetry={() => refetch()} />
            ) : isVehiclesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : vehicleList.length === 0 ? (
              <p className="text-sm text-text-muted">No vehicles registered.</p>
            ) : (
              <div className="space-y-4">
                {vehicleList.map(v => (
                  <div key={v.id} className="p-4 border border-cn-border rounded-lg bg-surface">
                    <p className="font-semibold text-lg">{v.manufacturer} {v.model}</p>
                    <div className="flex gap-4 mt-2 text-sm text-text-muted">
                      <span>{v.charger_power_kw} kW Charger</span>
                      {v.battery_capacity_kwh && <span>{v.battery_capacity_kwh} kWh Battery</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-danger/20 bg-danger/5">
          <CardHeader>
            <CardTitle className="text-danger flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </CardTitle>
            <CardDescription>Actions related to data privacy and account deletion.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-text-primary max-w-xl">
                Request deletion of your photos and personal data. This will notify the RWA admin and platform administrators. Note that some data may be retained for legal compliance if your request was approved.
              </p>
              <Button variant="danger" onClick={handleDeletionRequest}>
                Request Data Deletion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
