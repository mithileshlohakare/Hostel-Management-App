import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class UserRole(str, enum.Enum):
    student = 'student'
    warden = 'warden'
    admin = 'admin'


class GatePassStatus(str, enum.Enum):
    pending = 'pending'
    approved = 'approved'
    rejected = 'rejected'
    used = 'used'


class ComplaintStatus(str, enum.Enum):
    open = 'open'
    in_progress = 'in_progress'
    resolved = 'resolved'
    breached = 'breached'


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    parent_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name='user_role', create_type=False), nullable=False, default=UserRole.student)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    allocations: Mapped[list['RoomAllocation']] = relationship(back_populates='student', foreign_keys='RoomAllocation.student_id')
    gate_passes: Mapped[list['GatePass']] = relationship(back_populates='student', foreign_keys='GatePass.student_id')
    complaints: Mapped[list['Complaint']] = relationship(back_populates='student')
    visitor_logs: Mapped[list['VisitorLog']] = relationship(back_populates='student', foreign_keys='VisitorLog.student_id')
    notifications: Mapped[list['Notification']] = relationship(back_populates='recipient')
    mess_feedback: Mapped[list['MessFeedback']] = relationship(back_populates='student')


class Room(Base):
    __tablename__ = 'rooms'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    block: Mapped[str] = mapped_column(String(50), nullable=False)
    room_number: Mapped[str] = mapped_column(String(20), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    current_occupancy: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    allocations: Mapped[list['RoomAllocation']] = relationship(back_populates='room')

    __table_args__ = (UniqueConstraint('block', 'room_number', name='uq_room_block_number'),)


class RoomAllocation(Base):
    __tablename__ = 'room_allocations'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    room_id: Mapped[int] = mapped_column(ForeignKey('rooms.id', ondelete='CASCADE'))
    allocated_by: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    allocated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    student: Mapped['User'] = relationship(foreign_keys=[student_id], back_populates='allocations')
    room: Mapped['Room'] = relationship(back_populates='allocations')


class GatePass(Base):
    __tablename__ = 'gate_passes'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    out_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    in_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[GatePassStatus] = mapped_column(Enum(GatePassStatus, name='gate_pass_status', create_type=False), default=GatePassStatus.pending)
    qr_token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    student: Mapped['User'] = relationship(back_populates='gate_passes', foreign_keys=[student_id])


class Complaint(Base):
    __tablename__ = 'complaints'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[ComplaintStatus] = mapped_column(Enum(ComplaintStatus, name='complaint_status', create_type=False), default=ComplaintStatus.open)
    priority: Mapped[str] = mapped_column(String(20), default='medium')
    sla_hours: Mapped[int] = mapped_column(Integer, default=24)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    student: Mapped['User'] = relationship(back_populates='complaints')


class VisitorLog(Base):
    __tablename__ = 'visitor_logs'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    visitor_name: Mapped[str] = mapped_column(String(120), nullable=False)
    visitor_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    relation: Mapped[str] = mapped_column(String(60), nullable=False)
    check_in: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    student: Mapped['User'] = relationship(back_populates='visitor_logs', foreign_keys=[student_id])


class Notification(Base):
    __tablename__ = 'notifications'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    recipient_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    channel: Mapped[str] = mapped_column(String(30), default='sms')
    message: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    recipient: Mapped['User'] = relationship(back_populates='notifications')


class MessFeedback(Base):
    __tablename__ = 'mess_feedback'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    student: Mapped['User'] = relationship(back_populates='mess_feedback')


