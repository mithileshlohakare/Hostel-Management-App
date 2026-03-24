from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.models.models import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    parent_phone: str | None = None
    password: str
    role: UserRole = UserRole.student


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    phone: str | None = None
    parent_phone: str | None = None
    created_at: datetime

    model_config = {'from_attributes': True}


class LoginInput(BaseModel):
    email: EmailStr
    password: str
