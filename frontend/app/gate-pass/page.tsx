'use client';

import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { CheckCircle2, Clock3, QrCode, RefreshCw, XCircle } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, extractApiError, getRole } from '@/lib/api';

interface GatePass {
  id: number;
  reason: string;
  out_time: string;
  in_time: string;
  status: string;
  qr_token: string;
}

function StatusPill({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    rejected: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    used: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  };

  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${classes[status] || 'border-border text-muted'}`}>{status.toUpperCase()}</span>;
}

export default function GatePassPage() {
  const role = getRole();
  const [reason, setReason] = useState('Weekend leave');
  const [outTime, setOutTime] = useState('2026-03-25T09:00');
  const [inTime, setInTime] = useState('2026-03-25T18:00');
  const [list, setList] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<GatePass[]>('/gate-passes');
      setList(data);
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
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    if (new Date(inTime) <= new Date(outTime)) {
      toast.error('Return time must be after out time');
      return;
    }
    try {
      await api('/gate-passes', {
        method: 'POST',
        body: JSON.stringify({ reason, out_time: new Date(outTime).toISOString(), in_time: new Date(inTime).toISOString() }),
      });
      toast.success('Gate pass submitted');
      load();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const approve = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api(`/gate-passes/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success(`Gate pass ${status}`);
      load();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const approveByScan = async () => {
    if (!scanData.trim()) {
      toast.error('Paste or scan QR payload first');
      return;
    }
    try {
      await api<GatePass>('/gate-passes/scan/approve', {
        method: 'POST',
        body: JSON.stringify({ qr_data: scanData.trim() }),
      });
      toast.success('Gate pass approved via QR scan');
      setScanData('');
      load();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const stats = useMemo(() => {
    const pending = list.filter((g) => g.status === 'pending').length;
    const approved = list.filter((g) => g.status === 'approved').length;
    const rejected = list.filter((g) => g.status === 'rejected').length;
    return { pending, approved, rejected };
  }, [list]);

  return (
    <AppShell>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h2 className='text-2xl font-semibold'>Gate Pass System</h2>
        <Button variant='outline' onClick={load}>
          <RefreshCw className='mr-2 h-4 w-4' /> Refresh
        </Button>
      </div>

      <div className='mb-6 grid gap-3 md:grid-cols-3'>
        <Card><p className='text-xs text-muted'>Pending</p><p className='mt-2 inline-flex items-center text-2xl font-semibold text-amber-300'><Clock3 className='mr-2 h-5 w-5' /> {stats.pending}</p></Card>
        <Card><p className='text-xs text-muted'>Approved</p><p className='mt-2 inline-flex items-center text-2xl font-semibold text-emerald-300'><CheckCircle2 className='mr-2 h-5 w-5' /> {stats.approved}</p></Card>
        <Card><p className='text-xs text-muted'>Rejected</p><p className='mt-2 inline-flex items-center text-2xl font-semibold text-rose-300'><XCircle className='mr-2 h-5 w-5' /> {stats.rejected}</p></Card>
      </div>

      {role === 'student' && (
        <Card className='mb-6 grid gap-3 md:grid-cols-3'>
          <Input placeholder='Reason for leave' value={reason} onChange={(e) => setReason(e.target.value)} />
          <Input type='datetime-local' value={outTime} onChange={(e) => setOutTime(e.target.value)} />
          <Input type='datetime-local' value={inTime} onChange={(e) => setInTime(e.target.value)} />
          <Button onClick={submit} className='md:col-span-3'>Create Gate Pass</Button>
        </Card>
      )}

      {role !== 'student' && (
        <Card className='mb-6 grid gap-3'>
          <p className='inline-flex items-center text-sm text-muted'><QrCode className='mr-2 h-4 w-4' />QR Scan Approval</p>
          <Input
            placeholder='Paste scanned QR payload from device scanner'
            value={scanData}
            onChange={(e) => setScanData(e.target.value)}
          />
          <Button onClick={approveByScan}>Approve by QR</Button>
        </Card>
      )}

      {loading ? (
        <Card>Loading gate pass records...</Card>
      ) : list.length === 0 ? (
        <Card>No gate pass requests yet. Create one to get started.</Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2'>
          {list.map((g) => {
            const qrPayload = `HOSTELSYNC:GATEPASS:${g.id}:${g.qr_token}`;
            return (
              <Card key={g.id}>
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-muted'>Gate Pass Request</p>
                  <StatusPill status={g.status} />
                </div>
                <p className='mt-2 font-medium'>{g.reason}</p>
                <p className='mt-1 text-xs text-muted'>Out: {new Date(g.out_time).toLocaleString()}</p>
                <p className='text-xs text-muted'>Return: {new Date(g.in_time).toLocaleString()}</p>
                <div className='mt-3 inline-block rounded bg-white p-2'>
                  <QRCodeSVG value={qrPayload} size={104} />
                </div>
                
                {role !== 'student' && (
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <Button variant='outline' onClick={() => setScanData(qrPayload)}>Use for Scan Box</Button>
                    {g.status === 'pending' && <Button onClick={() => approve(g.id, 'approved')}>Approve</Button>}
                    {g.status === 'pending' && <Button variant='destructive' onClick={() => approve(g.id, 'rejected')}>Reject</Button>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}





