from sqlalchemy import select, func
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Complaint, ComplaintStatus, GatePass, GatePassStatus, Room, User, VisitorLog

router = APIRouter(prefix='/dashboard', tags=['dashboard'])


@router.get('/stats')
async def dashboard_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    complaints_open = await db.scalar(select(func.count()).select_from(Complaint).where(Complaint.status.in_([ComplaintStatus.open, ComplaintStatus.in_progress, ComplaintStatus.breached])))
    passes_pending = await db.scalar(select(func.count()).select_from(GatePass).where(GatePass.status == GatePassStatus.pending))
    active_visitors = await db.scalar(select(func.count()).select_from(VisitorLog).where(VisitorLog.check_out.is_(None)))
    total_rooms = await db.scalar(select(func.count()).select_from(Room))

    return {
        'role': current_user.role.value,
        'complaints_open': complaints_open or 0,
        'passes_pending': passes_pending or 0,
        'active_visitors': active_visitors or 0,
        'total_rooms': total_rooms or 0,
    }
