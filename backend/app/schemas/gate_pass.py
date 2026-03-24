from datetime import datetime
from pydantic import BaseModel

from app.models.models import GatePassStatus


class GatePassCreate(BaseModel):
    reason: str
    out_time: datetime
    in_time: datetime


class GatePassUpdateStatus(BaseModel):
    status: GatePassStatus


class GatePassScanApproveIn(BaseModel):
    qr_data: str


class GatePassOut(BaseModel):
    id: int
    student_id: int
    reason: str
    out_time: datetime
    in_time: datetime
    status: GatePassStatus
    qr_token: str
    created_at: datetime

    model_config = {'from_attributes': True}
