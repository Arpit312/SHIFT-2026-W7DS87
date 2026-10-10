'use client';
import { Suspense } from 'react';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useQueryClient } from '@tanstack/react-query';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/dashboard/owner'; // Will be guarded anyway
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      queryClient.clear(); // Clear any stale profile data
      
      toast({
        type: 'success',
        title: 'Logged in successfully',
      });
      
      router.push(redirect);
      router.refresh(); // Refresh to trigger middleware
    } catch (e: unknown) {
      toast({
        type: 'error',
        title: 'Login failed',
        message: (e as any).message || 'Invalid email or password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8 text-brand-orange">
          <ShieldCheck className="w-10 h-10" />
          <span className="font-heading font-bold text-3xl tracking-tight text-text-primary">ChargeNOC</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
              />
              <Input
                label="Password"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                disabled={isLoading}
              />
              <Button type="submit" className="w-full mt-2" loading={isLoading}>
                Sign in
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center text-sm border-t border-cn-border/50 pt-6">
            <Link 
              href="/forgot-password" 
              className="text-text-muted hover:text-brand-orange transition-colors"
            >
              Forgot your password?
            </Link>
            <div className="text-text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-brand-orange hover:text-brand-orange-hover font-medium">
                Sign up as an EV Owner
              </Link>
            </div>
            <p className="text-xs text-text-muted/60 mt-4">
              RWA Admins and Electricians are provisioned by the system administrator.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}

