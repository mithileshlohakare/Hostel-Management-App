'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, extractApiError } from '@/lib/api';

interface Feedback { id: number; meal_type: string; rating: number; comment?: string; submitted_at: string }
interface Summary { average_rating: number; total_feedback: number }

export default function MessPage() {
  const [mealType, setMealType] = useState('lunch');
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('Quality was good, but chapati can be softer.');
  const [items, setItems] = useState<Feedback[]>([]);
  const [summary, setSummary] = useState<Summary>({ average_rating: 0, total_feedback: 0 });

  const load = async () => {
    try {
      const [feedback, stats] = await Promise.all([api<Feedback[]>('/mess-feedback'), api<Summary>('/mess-feedback/summary')]);
      setItems(feedback);
      setSummary(stats);
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    try {
      await api('/mess-feedback', { method: 'POST', body: JSON.stringify({ meal_type: mealType, rating: Number(rating), comment }) });
      toast.success('Feedback submitted');
      load();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  return (
    <AppShell>
      <h2 className='mb-4 text-2xl font-semibold'>Mess Feedback</h2>
      <Card className='mb-4 grid gap-3 md:grid-cols-3'>
        <Input value={mealType} onChange={(e) => setMealType(e.target.value)} placeholder='Meal type' />
        <Input type='number' min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} placeholder='Rating' />
        <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder='Comment' />
        <Button className='md:col-span-3' onClick={submit}>Submit</Button>
      </Card>
      <div className='mb-4 grid gap-4 md:grid-cols-2'>
        <Card><p className='text-sm text-muted'>Average Rating</p><p className='text-2xl font-semibold'>{summary.average_rating}</p></Card>
        <Card><p className='text-sm text-muted'>Total Feedback</p><p className='text-2xl font-semibold'>{summary.total_feedback}</p></Card>
      </div>
      <div className='space-y-3'>
        {items.map((f) => (
          <Card key={f.id}>
            <p className='font-medium'>{f.meal_type} | {f.rating}/5</p>
            <p className='text-sm text-muted'>{new Date(f.submitted_at).toLocaleString()}</p>
            {f.comment && <p className='mt-2 text-sm'>{f.comment}</p>}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
