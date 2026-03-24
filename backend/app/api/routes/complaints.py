from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.models import Complaint, ComplaintStatus, User, UserRole
from app.schemas.complaint import ComplaintCreate, ComplaintOut, ComplaintUpdateStatus
from app.services.notification_service import send_mock_sms
from app.services.sla_service import build_due_at, derive_complaint_status
from app.websocket.manager import manager

router = APIRouter(prefix='/complaints', tags=['complaints'])


@router.post('', response_model=ComplaintOut)
async def create_complaint(payload: ComplaintCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    complaint = Complaint(
        student_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        priority=payload.priority,
        sla_hours=payload.sla_hours,
        due_at=build_due_at(payload.sla_hours),
        status=ComplaintStatus.open,
    )
    db.add(complaint)
    await db.commit()
    await db.refresh(complaint)
    await manager.broadcast('complaint.created', {'id': complaint.id, 'title': complaint.title, 'status': complaint.status.value})
    return complaint


@router.get('', response_model=list[ComplaintOut])
async def list_complaints(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Complaint)
    if current_user.role == UserRole.student:
        stmt = stmt.where(Complaint.student_id == current_user.id)

    complaints = (await db.scalars(stmt.order_by(Complaint.created_at.desc()))).all()
    updated: list[Complaint] = []
    for complaint in complaints:
        derived = derive_complaint_status(complaint)
        if derived != complaint.status:
            complaint.status = derived
            updated.append(complaint)

    if updated:
        await db.commit()

    return complaints


@router.patch('/{complaint_id}', response_model=ComplaintOut)
async def update_complaint_status(complaint_id: int, payload: ComplaintUpdateStatus, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(UserRole.warden, UserRole.admin))):
    complaint = await db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail='Complaint not found')

    complaint.status = payload.status
    if payload.status == ComplaintStatus.resolved:
        from datetime import datetime, timezone

        complaint.resolved_at = datetime.now(timezone.utc)
        student = await db.get(User, complaint.student_id)
        if student:
            await send_mock_sms(db, student, f'Your complaint "{complaint.title}" has been resolved.')

    await db.commit()
    await db.refresh(complaint)
    await manager.broadcast('complaint.updated', {'id': complaint.id, 'status': complaint.status.value})
    return complaint
