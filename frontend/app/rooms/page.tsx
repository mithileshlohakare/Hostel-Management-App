'use client';

import { useEffect, useMemo, useState } from 'react';
import { BedDouble, Building2, RefreshCw, UserRoundCheck, Users } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, extractApiError, getRole } from '@/lib/api';
import { canAllocateRoom, canCreateRoom, canViewAllRooms, canViewAssignedStudents } from '@/lib/permissions';

interface Room {
  id: number;
  block: string;
  room_number: string;
  capacity: number;
  current_occupancy: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface MyRoom {
  room: Room | null;
  allocated_at: string | null;
}

interface AssignedStudent {
  student_id: number;
  student_name: string;
  student_email: string;
  room_id: number;
  block: string;
  room_number: string;
  allocated_at: string;
}

export default function RoomsPage() {
  const role = getRole();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [myRoom, setMyRoom] = useState<MyRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [block, setBlock] = useState('C');
  const [roomNumber, setRoomNumber] = useState('301');
  const [capacity, setCapacity] = useState(2);
  const [studentId, setStudentId] = useState<number | ''>('');
  const [roomId, setRoomId] = useState<number | ''>('');

  const load = async () => {
    setLoading(true);
    try {
      if (role === 'student') {
        const mine = await api<MyRoom>('/rooms/my-room');
        setMyRoom(mine);
        setRooms([]);
        setStudents([]);
        setAssignedStudents([]);
      } else {
        const [roomData, studentData, assigned] = await Promise.all([
          canViewAllRooms(role) ? api<Room[]>('/rooms') : Promise.resolve([]),
          canAllocateRoom(role) ? api<Student[]>('/users/students') : Promise.resolve([]),
          canViewAssignedStudents(role) ? api<AssignedStudent[]>('/rooms/assigned-students') : Promise.resolve([]),
        ]);

        setRooms(roomData);
        setStudents(studentData);
        setAssignedStudents(assigned);
        setMyRoom(null);

        if (!roomId && roomData.length > 0) setRoomId(roomData[0].id);
        if (!studentId && studentData.length > 0) setStudentId(studentData[0].id);
      }
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  const createRoom = async () => {
    if (!canCreateRoom(role)) {
      toast.error('Only admin can create rooms');
      return;
    }

    setSaving(true);
    try {
      await api('/rooms', { method: 'POST', body: JSON.stringify({ block, room_number: roomNumber, capacity }) });
      toast.success('Room created');
      await load();
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const allocate = async () => {
    if (!canAllocateRoom(role)) {
      toast.error('Only admin can allocate rooms');
      return;
    }
    if (!studentId || !roomId) {
      toast.error('Select a student and a room');
      return;
    }

    setSaving(true);
    try {
      await api('/rooms/allocate', { method: 'POST', body: JSON.stringify({ student_id: Number(studentId), room_id: Number(roomId) }) });
      toast.success('Room allocated successfully');
      await load();
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const occupiedBeds = rooms.reduce((sum, room) => sum + room.current_occupancy, 0);
    const availableBeds = totalBeds - occupiedBeds;
    return { totalRooms, totalBeds, occupiedBeds, availableBeds };
  }, [rooms]);

  if (role === 'student') {
    return (
      <AppShell>
        <h2 className='mb-4 text-2xl font-semibold tracking-tight'>My Room</h2>
        {loading ? (
          <Card>Loading your room assignment...</Card>
        ) : myRoom?.room ? (
          <Card>
            <p className='inline-flex items-center font-medium'>
              <BedDouble className='mr-2 h-4 w-4 text-muted' /> {myRoom.room.block}-{myRoom.room.room_number}
            </p>
            <p className='mt-2 text-sm text-muted'>Capacity: {myRoom.room.capacity}</p>
            <p className='text-sm text-muted'>Current Occupancy: {myRoom.room.current_occupancy}</p>
            <p className='mt-2 text-sm text-muted'>Allocated At: {myRoom.allocated_at ? new Date(myRoom.allocated_at).toLocaleString() : 'N/A'}</p>
          </Card>
        ) : (
          <Card>
            <p className='font-medium'>No room assigned yet</p>
            <p className='mt-1 text-sm text-muted'>Please contact your hostel administration to request allocation.</p>
          </Card>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='text-2xl font-semibold tracking-tight'>Room Management</h2>
        <Button variant='outline' onClick={load} disabled={loading}>
          <RefreshCw className='mr-2 h-4 w-4' /> {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className='mb-6 grid gap-3 md:grid-cols-4'>
        <Card><p className='text-xs text-muted'>Total Rooms</p><p className='mt-2 text-2xl font-semibold'>{stats.totalRooms}</p></Card>
        <Card><p className='text-xs text-muted'>Total Beds</p><p className='mt-2 text-2xl font-semibold'>{stats.totalBeds}</p></Card>
        <Card><p className='text-xs text-muted'>Occupied Beds</p><p className='mt-2 text-2xl font-semibold'>{stats.occupiedBeds}</p></Card>
        <Card><p className='text-xs text-muted'>Available Beds</p><p className='mt-2 text-2xl font-semibold text-primary'>{stats.availableBeds}</p></Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='space-y-3'>
          <h3 className='inline-flex items-center font-medium'><Building2 className='mr-2 h-4 w-4 text-muted' /> Create Room (Admin)</h3>
          <div className='grid gap-3 md:grid-cols-3'>
            <Input value={block} onChange={(e) => setBlock(e.target.value.toUpperCase())} placeholder='Block' disabled={!canCreateRoom(role) || saving} />
            <Input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder='Room Number' disabled={!canCreateRoom(role) || saving} />
            <Input type='number' value={capacity} min={1} onChange={(e) => setCapacity(Number(e.target.value))} placeholder='Capacity' disabled={!canCreateRoom(role) || saving} />
          </div>
          <Button onClick={createRoom} disabled={!canCreateRoom(role) || saving}>Save Room</Button>
          {!canCreateRoom(role) && <p className='text-xs text-muted'>Only admin can create rooms.</p>}
        </Card>

        <Card className='space-y-3'>
          <h3 className='inline-flex items-center font-medium'><UserRoundCheck className='mr-2 h-4 w-4 text-muted' /> Allocate Room (Admin)</h3>
          <p className='text-xs text-muted'>Students available: {students.length}</p>
          <div className='grid gap-3'>
            <select
              value={studentId}
              onChange={(e) => setStudentId(Number(e.target.value))}
              className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
              disabled={!canAllocateRoom(role) || saving}
            >
              {students.length === 0 && <option value=''>No students found</option>}
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.name} - {student.email}</option>
              ))}
            </select>
            <select
              value={roomId}
              onChange={(e) => setRoomId(Number(e.target.value))}
              className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
              disabled={!canAllocateRoom(role) || saving}
            >
              {rooms.map((room) => {
                const freeBeds = room.capacity - room.current_occupancy;
                return (
                  <option key={room.id} value={room.id} disabled={freeBeds <= 0}>
                    {room.block}-{room.room_number} | Free beds: {freeBeds}
                  </option>
                );
              })}
            </select>
          </div>
          <Button onClick={allocate} disabled={!canAllocateRoom(role) || saving}>Allocate Room</Button>
          {!canAllocateRoom(role) && <p className='text-xs text-muted'>Only admin can allocate rooms.</p>}
        </Card>
      </div>

      {canViewAssignedStudents(role) && (
        <Card className='mt-4'>
          <h3 className='inline-flex items-center font-medium'><Users className='mr-2 h-4 w-4 text-muted' /> Assigned Students</h3>
          <p className='mt-1 text-xs text-muted'>Warden and Admin monitoring view.</p>
          <div className='mt-3 max-h-56 overflow-auto rounded-lg border border-border'>
            {assignedStudents.length === 0 ? (
              <p className='p-3 text-sm text-muted'>No assigned students yet.</p>
            ) : (
              <div className='divide-y divide-border'>
                {assignedStudents.map((item) => (
                  <div key={`${item.student_id}-${item.room_id}-${item.allocated_at}`} className='grid gap-1 px-3 py-2 text-sm md:grid-cols-[1fr_1fr_180px]'>
                    <span>{item.student_name}</span>
                    <span className='text-muted'>{item.student_email}</span>
                    <span className='text-muted'>{item.block}-{item.room_number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      <div className='mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
        {loading ? (
          <Card>Loading rooms...</Card>
        ) : rooms.length === 0 ? (
          <Card>No rooms configured yet.</Card>
        ) : (
          rooms.map((room) => {
            const freeBeds = room.capacity - room.current_occupancy;
            return (
              <Card key={room.id}>
                <p className='inline-flex items-center font-medium'><BedDouble className='mr-2 h-4 w-4 text-muted' /> {room.block}-{room.room_number}</p>
                <p className='mt-1 text-sm text-muted'>Occupancy: {room.current_occupancy}/{room.capacity}</p>
                <p className='mt-2 text-sm'>Available beds: <span className={freeBeds > 0 ? 'text-primary' : 'text-red-400'}>{freeBeds}</span></p>
              </Card>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
