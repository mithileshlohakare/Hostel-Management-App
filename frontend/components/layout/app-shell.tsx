'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ClipboardList, DoorOpen, LayoutDashboard, LogOut, MessageSquare, UserCheck, UtensilsCrossed } from 'lucide-react';
import { type ComponentType, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { NAV_ITEMS, isRouteAllowed } from '@/lib/permissions';
import { cn } from '@/lib/utils';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  '/dashboard': LayoutDashboard,
  '/gate-pass': DoorOpen,
  '/complaints': ClipboardList,
  '/rooms': UserCheck,
  '/visitors': UserCheck,
  '/notifications': Bell,
  '/mess': UtensilsCrossed,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const currentRole = localStorage.getItem('role') || '';

    if (!token) {
      router.push('/login');
      return;
    }

    setRole(currentRole);

    if (!isRouteAllowed(pathname, currentRole as 'admin' | 'warden' | 'student')) {
      toast.error('You are not authorized to access this page');
      router.push('/dashboard');
    }
  }, [pathname, router]);

  const visibleLinks = useMemo(
    () => NAV_ITEMS.filter((item) => item.roles.includes(role as 'admin' | 'warden' | 'student')),
    [role]
  );

  const pageTitle = useMemo(
    () => NAV_ITEMS.find((link) => pathname.startsWith(link.href))?.label || 'Workspace',
    [pathname]
  );

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  return (
    <div className='page-wrap lg:grid lg:grid-cols-[260px_1fr]'>
      <aside className='border-b border-border bg-slate-950/80 px-4 py-5 backdrop-blur lg:min-h-screen lg:border-b-0 lg:border-r'>
        <div className='mb-6 flex items-center justify-between'>
          <p className='font-[var(--font-heading)] text-lg font-semibold tracking-tight text-slate-100'>HostelSync</p>
          <span className='rounded-full border border-border bg-slate-900 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-400'>
            {role || 'user'}
          </span>
        </div>

        <nav className='grid gap-1.5'>
          {visibleLinks.map((link) => {
            const Icon = iconMap[link.href] || LayoutDashboard;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-100',
                  pathname === link.href && 'bg-slate-900 text-slate-100'
                )}
              >
                <Icon className='h-4 w-4' /> {link.label}
              </Link>
            );
          })}
        </nav>

        <div className='mt-6 border-t border-border pt-4'>
          <Button className='w-full' variant='outline' onClick={logout}>
            <LogOut className='mr-2 h-4 w-4' /> Logout
          </Button>
        </div>
      </aside>

      <main className='p-4 lg:p-8'>
        <div className='mb-6 flex items-center justify-between rounded-xl border border-border bg-slate-950/70 px-4 py-3'>
          <p className='font-[var(--font-heading)] text-base font-semibold tracking-tight text-slate-100'>{pageTitle}</p>
          <div className='inline-flex items-center gap-2 rounded-lg border border-border bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-400'>
            <MessageSquare className='h-3.5 w-3.5' /> Live workspace
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

