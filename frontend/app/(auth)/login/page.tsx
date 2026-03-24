'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, decodeRoleFromJWT, extractApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('role', decodeRoleFromJWT(res.access_token));
      toast.success('Welcome back');
      router.push('/dashboard');
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='page-wrap px-4 py-8 md:px-8'>
      <div className='mx-auto grid min-h-[88vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-slate-950/70 shadow-panel md:grid-cols-2'>
        <section className='relative flex flex-col justify-between border-b border-border p-8 md:border-b-0 md:border-r'>
          <div className='space-y-5'>
            <p className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary'>
              <ShieldCheck className='h-3.5 w-3.5' /> Enterprise-grade Hostel Operations
            </p>
            <h1 className='font-[var(--font-heading)] text-4xl font-semibold leading-tight text-slate-100'>
              Run your hostel with the clarity of modern SaaS.
            </h1>
            <p className='max-w-md text-sm text-slate-400'>
              HostelSync centralizes access control, complaints, room operations, visitor logs, and communication.
            </p>
          </div>
          <p className='text-xs uppercase tracking-[0.16em] text-slate-500'>Trusted by wardens, admins, and students</p>
        </section>

        <section className='flex items-center justify-center p-6 md:p-10'>
          <Card className='w-full max-w-md'>
            <h2 className='font-[var(--font-heading)] text-2xl font-semibold text-slate-100'>Sign in</h2>
            <p className='mb-6 mt-1 text-sm text-slate-400'>Use your account credentials to continue.</p>
            <form onSubmit={onSubmit} className='space-y-4'>
              <div className='space-y-1.5'>
                <label className='text-xs uppercase tracking-wider text-slate-400'>Email</label>
                <Input type='email' placeholder='you@hostelsync.com' value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className='space-y-1.5'>
                <label className='text-xs uppercase tracking-wider text-slate-400'>Password</label>
                <Input type='password' placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </form>
            <p className='mt-5 text-center text-sm text-slate-400'>
              New user? <Link href='/signup' className='text-primary hover:underline'>Create account</Link>
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
