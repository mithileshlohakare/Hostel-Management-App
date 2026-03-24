from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.models import User, UserRole
from app.schemas.auth import UserOut

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/students', response_model=list[UserOut])
async def list_students(db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.warden, UserRole.admin))):
    rows = (
        await db.scalars(
            select(User)
            .where(User.role == UserRole.student, User.is_active.is_(True))
            .order_by(User.name.asc())
        )
    ).all()
    return rows


@router.get('/wardens', response_model=list[UserOut])
async def list_wardens(db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    rows = (
        await db.scalars(
            select(User)
            .where(User.role == UserRole.warden, User.is_active.is_(True))
            .order_by(User.name.asc())
        )
    ).all()
    return rows


@router.get('', response_model=list[UserOut])
async def list_all_users(db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    rows = (await db.scalars(select(User).where(User.is_active.is_(True)).order_by(User.created_at.desc()))).all()
    return rows
