from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Notification, User
from app.schemas.notification import NotificationOut

router = APIRouter(prefix='/notifications', tags=['notifications'])


@router.get('', response_model=list[NotificationOut])
async def list_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (await db.scalars(select(Notification).where(Notification.recipient_id == current_user.id).order_by(Notification.sent_at.desc()))).all()
    return rows
