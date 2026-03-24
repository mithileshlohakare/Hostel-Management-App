'use client';

import { useEffect, useMemo, useState } from 'react';
import { BellRing, MessageSquareShare, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractApiError } from '@/lib/api';

interface Notification {
  id: number;
  channel: string;
  message: string;
  sent_at: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<Notification[]>('/notifications');
      setItems(data);
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const recentCount = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return items.filter((n) => new Date(n.sent_at).getTime() >= oneDayAgo).length;
  }, [items]);

  return (
    <AppShell>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h2 className='text-2xl font-semibold'>Parent Notifications</h2>
        <Button variant='outline' onClick={load} disabled={loading}>
          <RefreshCw className='mr-2 h-4 w-4' /> {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className='mb-5 grid gap-3 md:grid-cols-2'>
        <Card>
          <p className='text-xs text-muted'>Total Messages</p>
          <p className='mt-2 inline-flex items-center text-2xl font-semibold'><BellRing className='mr-2 h-5 w-5 text-primary' /> {items.length}</p>
        </Card>
        <Card>
          <p className='text-xs text-muted'>Last 24 Hours</p>
          <p className='mt-2 inline-flex items-center text-2xl font-semibold'><MessageSquareShare className='mr-2 h-5 w-5 text-accent' /> {recentCount}</p>
        </Card>
      </div>

      {loading ? (
        <Card>Loading notifications...</Card>
      ) : items.length === 0 ? (
        <Card>No notifications yet. Parent alerts will appear here after visitor check-ins or other events.</Card>
      ) : (
        <div className='space-y-3'>
          {items.map((n) => (
            <Card key={n.id} className='border-l-4 border-l-primary'>
              <p className='text-sm text-muted'>{new Date(n.sent_at).toLocaleString()} | {n.channel.toUpperCase()}</p>
              <p className='mt-1'>{n.message}</p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
