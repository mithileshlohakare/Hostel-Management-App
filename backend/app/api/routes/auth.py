from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.models import User, UserRole
from app.schemas.auth import LoginInput, Token, UserCreate, UserOut

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=UserOut)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        parent_phone=payload.parent_phone,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.student,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post('/login', response_model=Token)
async def login(payload: LoginInput, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail='Invalid credentials')

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(access_token=token)
