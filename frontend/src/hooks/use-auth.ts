'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

export function useAuth() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
    retry: false,
  });

  const logout = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
    onError: (err) => {
      toast({
        type: 'error',
        title: 'Logout failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    },
  });

  return {
    profile,
    isLoading,
    error,
    logout: () => logout.mutate(),
    isLoggingOut: logout.isPending,
  };
}
