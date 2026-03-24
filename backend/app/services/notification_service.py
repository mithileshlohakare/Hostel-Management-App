from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Notification, User
from app.websocket.manager import manager


def resolve_target_phone(recipient: User) -> str:
    return recipient.parent_phone or recipient.phone or 'N/A'


async def send_mock_sms(db: AsyncSession, recipient: User, message: str) -> Notification:
    target_phone = resolve_target_phone(recipient)
    notification = Notification(recipient_id=recipient.id, channel='sms', message=message)
    db.add(notification)

    print(f'[MOCK-SMS] to={target_phone}: {message}')
    await manager.broadcast('notification.sent', {'recipient_id': recipient.id, 'phone': target_phone, 'message': message})
    return notification
