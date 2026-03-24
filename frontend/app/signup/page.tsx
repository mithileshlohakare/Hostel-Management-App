'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, extractApiError } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          parent_phone: parentPhone || null,
          password,
        }),
      });
      toast.success('Account created. Please sign in.');
      router.push('/login');
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='page-wrap px-4 py-8 md:px-8'>
      <div className='mx-auto flex min-h-[88vh] w-full max-w-4xl items-center justify-center'>
        <Card className='w-full max-w-2xl'>
          <h2 className='font-[var(--font-heading)] text-2xl font-semibold text-slate-100'>Create your account</h2>
          <p className='mb-6 mt-1 text-sm text-slate-400'>Student onboarding takes less than a minute.</p>
          <form onSubmit={onSubmit} className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1.5 md:col-span-2'>
              <label className='text-xs uppercase tracking-wider text-slate-400'>Full Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Full name' />
            </div>
            <div className='space-y-1.5 md:col-span-2'>
              <label className='text-xs uppercase tracking-wider text-slate-400'>Email</label>
              <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='you@hostelsync.com' />
            </div>
            <div className='space-y-1.5'>
              <label className='text-xs uppercase tracking-wider text-slate-400'>Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder='Primary contact' />
            </div>
            <div className='space-y-1.5'>
              <label className='text-xs uppercase tracking-wider text-slate-400'>Parent Phone</label>
              <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder='Guardian contact' />
            </div>
            <div className='space-y-1.5'>
              <label className='text-xs uppercase tracking-wider text-slate-400'>Password</label>
              <Input type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Minimum 8 characters' />
            </div>
            <div className='space-y-1.5'>
              <label className='text-xs uppercase tracking-wider text-slate-400'>Confirm Password</label>
              <Input type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder='Re-enter password' />
            </div>
            <Button type='submit' className='md:col-span-2' disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'} <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </form>
          <p className='mt-5 text-center text-sm text-slate-400'>
            Already have access? <Link href='/login' className='text-primary hover:underline'>Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
