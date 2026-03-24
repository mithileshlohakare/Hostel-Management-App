'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { StatCard } from '@/components/shared/stat-card';
import { api } from '@/lib/api';
import { connectRealtime } from '@/lib/realtime';

interface Stats {
  role: string;
  complaints_open: number;
  passes_pending: number;
  active_visitors: number;
  total_rooms: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>('/dashboard/stats').then(setStats).catch(() => toast.error('Failed to load dashboard'));
    const socket = connectRealtime();
    return () => socket.close();
  }, []);

  return (
    <AppShell>
      <h2 className='mb-6 text-2xl font-semibold'>Operational Dashboard</h2>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <StatCard title='Open Complaints' value={stats?.complaints_open ?? 0} />
        <StatCard title='Pending Gate Passes' value={stats?.passes_pending ?? 0} />
        <StatCard title='Active Visitors' value={stats?.active_visitors ?? 0} />
        <StatCard title='Total Rooms' value={stats?.total_rooms ?? 0} />
      </div>
    </AppShell>
  );
}
