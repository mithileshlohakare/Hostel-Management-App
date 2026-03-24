'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, extractApiError, getRole } from '@/lib/api';

interface Visitor {
  id: number;
  student_id: number;
  visitor_name: string;
  visitor_phone: string;
  relation: string;
  check_in: string;
  check_out?: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
}

export default function VisitorsPage() {
  const role = getRole();
  const [items, setItems] = useState<Visitor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState<number | ''>('');
  const [name, setName] = useState('Ramesh Kumar');
  const [phone, setPhone] = useState('9876543210');
  const [relation, setRelation] = useState('Father');

  const load = async () => {
    try {
      const [visitorData, studentData] = await Promise.all([
        api<Visitor[]>('/visitors'),
        role !== 'student' ? api<Student[]>('/users/students') : Promise.resolve([]),
      ]);
      setItems(visitorData);
      setStudents(studentData);
      if (!studentId && studentData.length > 0) setStudentId(studentData[0].id);
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  const checkin = async () => {
    if (!studentId) {
      toast.error('Please select a student');
      return;
    }
    try {
      await api('/visitors', { method: 'POST', body: JSON.stringify({ student_id: Number(studentId), visitor_name: name, visitor_phone: phone, relation }) });
      toast.success('Visitor checked in and phone notification sent');
      await load();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const checkout = async (id: number) => {
    try {
      await api(`/visitors/${id}/checkout`, { method: 'PATCH' });
      toast.success('Visitor checked out and phone notification sent');
      await load();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  return (
    <AppShell>
      <h2 className='mb-4 text-2xl font-semibold'>Visitor Log</h2>
      {role !== 'student' && (
        <Card className='mb-6 grid gap-3 md:grid-cols-2'>
          <select
            value={studentId}
            onChange={(e) => setStudentId(Number(e.target.value))}
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
          >
            {students.length === 0 && <option value=''>No students found</option>}
            {students.map((student) => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Visitor Name' />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder='Phone' />
          <Input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder='Relation' />
          <Button className='md:col-span-2' onClick={checkin}>Check In Visitor</Button>
        </Card>
      )}
      <div className='space-y-3'>
        {items.map((v) => (
          <Card key={v.id}>
            <p className='font-medium'>{v.visitor_name} ({v.relation})</p>
            <p className='text-sm text-muted'>In: {new Date(v.check_in).toLocaleString()}</p>
            <p className='text-sm text-muted'>Out: {v.check_out ? new Date(v.check_out).toLocaleString() : 'Active'}</p>
            {role !== 'student' && !v.check_out && <Button className='mt-3' onClick={() => checkout(v.id)}>Checkout</Button>}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
