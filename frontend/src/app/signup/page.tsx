'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  societyName: z.string().min(2, 'Please enter your society name'),
  flatNumber: z.string().min(1, 'Flat number is required'),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: societiesRes, isLoading: isLoadingSocieties } = useQuery({
    queryKey: ['societies'],
    queryFn: () => api.getSocieties(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupValues) => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // 1. Create user in Supabase Auth
      // Pass metadata so Django can create the Profile via a webhook/trigger,
      // or we can wait for Django to catch up. Actually, our backend requires
      // the profile to exist. Supabase trigger is standard, but since we 
      // are creating this, we can also have the client call a Django endpoint,
      // or let Django handle it via Postgres triggers. 
      // Based on architecture docs: "Django maps the Supabase user.id to a Profile".
      // We will pass user_metadata so the DB trigger can use it.
      const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            society_name: data.societyName,
            flat_number: data.flatNumber,
            role: 'ev_owner', // Backend should verify and only allow ev_owner for self-signup
          },
        },
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Account created!',
        message: 'You have been registered successfully.',
      });
      
      router.push('/dashboard/owner');
      router.refresh();
    } catch (e: unknown) {
      toast({
        type: 'error',
        title: 'Signup failed',
        message: (e as any).message || 'Could not create account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8 text-brand-orange">
          <ShieldCheck className="w-10 h-10" />
          <span className="font-heading font-bold text-3xl tracking-tight text-text-primary">ChargeNOC</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Sign up as an EV Owner to request charging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                {...register('fullName')}
                error={errors.fullName?.message}
                disabled={isLoading}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 98765 43210"
                {...register('phone')}
                error={errors.phone?.message}
                disabled={isLoading}
              />
              <Input
                label="Password"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                disabled={isLoading}
              />
              <Input
                label="Society Name"
                placeholder="e.g. Green Valley Apartments"
                {...register('societyName')}
                error={errors.societyName?.message}
                disabled={isLoading}
              />
              <Input
                label="Flat Number"
                placeholder="e.g. A-101"
                {...register('flatNumber')}
                error={errors.flatNumber?.message}
                disabled={isLoading}
              />
              
              <Button type="submit" className="w-full mt-4" loading={isLoading}>
                Create Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center text-sm border-t border-cn-border/50 pt-6">
            <div className="text-text-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-orange hover:text-brand-orange-hover font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
