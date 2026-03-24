from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.models import User, UserRole, VisitorLog
from app.schemas.visitor import VisitorCreate, VisitorOut
from app.services.notification_service import send_mock_sms
from app.websocket.manager import manager

router = APIRouter(prefix='/visitors', tags=['visitors'])


@router.post('', response_model=VisitorOut)
async def create_visitor_log(payload: VisitorCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(UserRole.warden, UserRole.admin))):
    student = await db.get(User, payload.student_id)
    if not student or student.role != UserRole.student:
        raise HTTPException(status_code=400, detail='Invalid student')

    visitor = VisitorLog(
        student_id=payload.student_id,
        visitor_name=payload.visitor_name,
        visitor_phone=payload.visitor_phone,
        relation=payload.relation,
        approved_by=current_user.id,
    )
    db.add(visitor)
    await send_mock_sms(db, student, f'Visitor {payload.visitor_name} checked in for {student.name}.')
    await db.commit()
    await db.refresh(visitor)
    await manager.broadcast('visitor.checkin', {'visitor_name': visitor.visitor_name, 'student_id': visitor.student_id})
    return visitor


@router.patch('/{visitor_id}/checkout', response_model=VisitorOut)
async def checkout_visitor(visitor_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.warden, UserRole.admin))):
    visitor = await db.get(VisitorLog, visitor_id)
    if not visitor:
        raise HTTPException(status_code=404, detail='Visitor not found')

    visitor.check_out = datetime.now(timezone.utc)

    student = await db.get(User, visitor.student_id)
    if student:
        await send_mock_sms(db, student, f'Visitor {visitor.visitor_name} checked out.')

    await db.commit()
    await db.refresh(visitor)
    await manager.broadcast('visitor.checkout', {'visitor_id': visitor.id})
    return visitor


@router.get('', response_model=list[VisitorOut])
async def list_visitors(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(VisitorLog)
    if current_user.role == UserRole.student:
        stmt = stmt.where(VisitorLog.student_id == current_user.id)
    visitors = (await db.scalars(stmt.order_by(VisitorLog.check_in.desc()))).all()
    return visitors
