from sqlalchemy import select, func
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import MessFeedback, User, UserRole
from app.schemas.mess import FeedbackCreate, FeedbackOut
from app.websocket.manager import manager

router = APIRouter(prefix='/mess-feedback', tags=['mess-feedback'])


@router.post('', response_model=FeedbackOut)
async def submit_feedback(payload: FeedbackCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    feedback = MessFeedback(student_id=current_user.id, meal_type=payload.meal_type, rating=payload.rating, comment=payload.comment)
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    await manager.broadcast('mess.feedback', {'rating': feedback.rating, 'meal_type': feedback.meal_type})
    return feedback


@router.get('', response_model=list[FeedbackOut])
async def list_feedback(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(MessFeedback).order_by(MessFeedback.submitted_at.desc())
    if current_user.role == UserRole.student:
        stmt = stmt.where(MessFeedback.student_id == current_user.id)
    return (await db.scalars(stmt)).all()


@router.get('/summary')
async def feedback_summary(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    avg_rating = await db.scalar(select(func.coalesce(func.avg(MessFeedback.rating), 0)))
    total = await db.scalar(select(func.count()).select_from(MessFeedback))
    return {'average_rating': round(float(avg_rating or 0), 2), 'total_feedback': total or 0}
