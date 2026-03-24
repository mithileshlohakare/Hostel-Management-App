from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.models import Room, RoomAllocation, User, UserRole
from app.schemas.room import (
    AllocationCreate,
    AllocationOut,
    AssignedStudentOut,
    MyRoomOut,
    RoomCreate,
    RoomOut,
    RoomUpdate,
)
from app.services.notification_service import send_mock_sms
from app.services.room_service import can_allocate
from app.websocket.manager import manager

router = APIRouter(prefix='/rooms', tags=['rooms'])


@router.post('', response_model=RoomOut)
async def create_room(payload: RoomCreate, db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    room = Room(block=payload.block, room_number=payload.room_number, capacity=payload.capacity, current_occupancy=0)
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room


@router.patch('/{room_id}', response_model=RoomOut)
async def update_room(room_id: int, payload: RoomUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail='Room not found')

    if payload.block is not None:
        room.block = payload.block
    if payload.room_number is not None:
        room.room_number = payload.room_number
    if payload.capacity is not None:
        if payload.capacity < room.current_occupancy:
            raise HTTPException(status_code=400, detail='Capacity cannot be less than current occupancy')
        room.capacity = payload.capacity

    await db.commit()
    await db.refresh(room)
    return room


@router.delete('/{room_id}')
async def delete_room(room_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail='Room not found')
    if room.current_occupancy > 0:
        raise HTTPException(status_code=400, detail='Cannot delete a room with active occupants')

    await db.delete(room)
    await db.commit()
    return {'message': 'Room deleted successfully'}


@router.get('', response_model=list[RoomOut])
async def list_rooms(db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.admin, UserRole.warden))):
    rooms = (await db.scalars(select(Room).order_by(Room.block, Room.room_number))).all()
    return rooms


@router.get('/my-room', response_model=MyRoomOut)
async def get_my_room(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    allocation = await db.scalar(
        select(RoomAllocation)
        .where(RoomAllocation.student_id == current_user.id, RoomAllocation.is_active.is_(True))
        .order_by(RoomAllocation.allocated_at.desc())
    )
    if not allocation:
        return MyRoomOut(room=None, allocated_at=None)

    room = await db.get(Room, allocation.room_id)
    if not room:
        return MyRoomOut(room=None, allocated_at=None)

    return MyRoomOut(room=RoomOut.model_validate(room), allocated_at=allocation.allocated_at)


@router.get('/assigned-students', response_model=list[AssignedStudentOut])
async def list_assigned_students(db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.admin, UserRole.warden))):
    allocations = (
        await db.scalars(
            select(RoomAllocation)
            .where(RoomAllocation.is_active.is_(True))
            .order_by(RoomAllocation.allocated_at.desc())
        )
    ).all()

    items: list[AssignedStudentOut] = []
    for allocation in allocations:
        student = await db.get(User, allocation.student_id)
        room = await db.get(Room, allocation.room_id)
        if not student or not room:
            continue
        items.append(
            AssignedStudentOut(
                student_id=student.id,
                student_name=student.name,
                student_email=student.email,
                room_id=room.id,
                block=room.block,
                room_number=room.room_number,
                allocated_at=allocation.allocated_at,
            )
        )

    return items


@router.post('/allocate', response_model=AllocationOut)
async def allocate_room(payload: AllocationCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(UserRole.admin))):
    student = await db.get(User, payload.student_id)
    room = await db.get(Room, payload.room_id)
    if not student or student.role != UserRole.student:
        raise HTTPException(status_code=400, detail='Invalid student')
    if not room:
        raise HTTPException(status_code=404, detail='Room not found')
    if not can_allocate(room):
        raise HTTPException(status_code=400, detail='Room is full')

    active_allocation = await db.scalar(select(RoomAllocation).where(RoomAllocation.student_id == payload.student_id, RoomAllocation.is_active.is_(True)))
    if active_allocation:
        active_allocation.is_active = False
        old_room = await db.get(Room, active_allocation.room_id)
        if old_room and old_room.current_occupancy > 0:
            old_room.current_occupancy -= 1

    allocation = RoomAllocation(student_id=payload.student_id, room_id=payload.room_id, allocated_by=current_user.id, is_active=True)
    room.current_occupancy += 1
    db.add(allocation)

    await send_mock_sms(db, student, f'Room allocation updated: {room.block}-{room.room_number}.')

    await db.commit()
    await db.refresh(allocation)
    await manager.broadcast('room.allocated', {'student_id': payload.student_id, 'room_id': payload.room_id})
    return allocation
