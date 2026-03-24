from datetime import datetime
from pydantic import BaseModel


class RoomCreate(BaseModel):
    block: str
    room_number: str
    capacity: int


class RoomUpdate(BaseModel):
    block: str | None = None
    room_number: str | None = None
    capacity: int | None = None


class AllocationCreate(BaseModel):
    student_id: int
    room_id: int


class RoomOut(BaseModel):
    id: int
    block: str
    room_number: str
    capacity: int
    current_occupancy: int

    model_config = {'from_attributes': True}


class AllocationOut(BaseModel):
    id: int
    student_id: int
    room_id: int
    allocated_at: datetime
    is_active: bool

    model_config = {'from_attributes': True}


class MyRoomOut(BaseModel):
    room: RoomOut | None
    allocated_at: datetime | None


class AssignedStudentOut(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    room_id: int
    block: str
    room_number: str
    allocated_at: datetime
