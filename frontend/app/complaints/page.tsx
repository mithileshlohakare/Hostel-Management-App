'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, extractApiError, getRole } from '@/lib/api';

interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'breached';
  due_at: string;
}

export default function ComplaintsPage() {
  const role = getRole();
  const [title, setTitle] = useState('Water leakage in washroom');
  const [description, setDescription] = useState('Continuous leakage since morning near sink area.');
  const [category, setCategory] = useState('Maintenance');
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<Complaint[]>('/complaints');
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

  const submit = async () => {
    try {
      await api('/complaints', { method: 'POST', body: JSON.stringify({ title, description, category, sla_hours: 24 }) });
      toast.success('Complaint filed');
      load();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success('Complaint status updated');
      load();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  return (
    <AppShell>
      <h2 className='mb-4 text-2xl font-semibold'>Complaint SLA Tracker</h2>
      {role === 'student' && (
        <Card className='mb-6 grid gap-3'>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Title' />
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder='Category' />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Description' />
          <Button onClick={submit}>Submit Complaint</Button>
        </Card>
      )}

      {loading ? (
        <Card>Loading complaints...</Card>
      ) : (
        <div className='space-y-3'>
          {items.map((c) => (
            <Card key={c.id}>
              <p className='font-medium'>{c.title}</p>
              <p className='text-sm text-muted'>{c.category} | Due: {new Date(c.due_at).toLocaleString()}</p>
              <p className='mt-2 text-sm'>{c.description}</p>
              <p className='mt-2 text-sm'>Status: <span className='text-accent'>{c.status}</span></p>
              {role !== 'student' && c.status !== 'resolved' && (
                <div className='mt-3 flex gap-2'>
                  <Button variant='outline' onClick={() => updateStatus(c.id, 'in_progress')}>In Progress</Button>
                  <Button onClick={() => updateStatus(c.id, 'resolved')}>Resolve</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
