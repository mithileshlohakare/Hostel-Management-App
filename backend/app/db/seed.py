from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.models import User, UserRole, Room


async def seed_data(db: AsyncSession) -> None:
    user_count = await db.scalar(select(func.count()).select_from(User))
    if user_count and user_count > 0:
        return

    admin = User(name='Admin User', email='admin@hostelsync.com', phone='9999999991', hashed_password=get_password_hash('Admin@123'), role=UserRole.admin)
    warden = User(name='Warden User', email='warden@hostelsync.com', phone='9999999992', hashed_password=get_password_hash('Warden@123'), role=UserRole.warden)
    student = User(name='Student User', email='student@hostelsync.com', phone='9999999993', parent_phone='8888888888', hashed_password=get_password_hash('Student@123'), role=UserRole.student)

    db.add_all([admin, warden, student])
    db.add_all([
        Room(block='A', room_number='101', capacity=2),
        Room(block='A', room_number='102', capacity=3),
        Room(block='B', room_number='201', capacity=2),
    ])
    await db.commit()
