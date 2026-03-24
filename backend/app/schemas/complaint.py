from datetime import datetime
from pydantic import BaseModel

from app.models.models import ComplaintStatus


class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: str = 'medium'
    sla_hours: int = 24


class ComplaintUpdateStatus(BaseModel):
    status: ComplaintStatus


class ComplaintOut(BaseModel):
    id: int
    student_id: int
    title: str
    description: str
    category: str
    priority: str
    status: ComplaintStatus
    sla_hours: int
    due_at: datetime
    resolved_at: datetime | None
    created_at: datetime

    model_config = {'from_attributes': True}
