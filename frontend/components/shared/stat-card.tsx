'use client';

import { Card } from '@/components/ui/card';

export function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card className='bg-gradient-to-b from-slate-900/70 to-slate-950/50'>
      <p className='text-[11px] uppercase tracking-[0.16em] text-slate-400'>{title}</p>
      <p className='mt-3 text-3xl font-semibold font-[var(--font-heading)] text-slate-100'>{value}</p>
    </Card>
  );
}
