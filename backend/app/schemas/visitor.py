from datetime import datetime
from pydantic import BaseModel


class VisitorCreate(BaseModel):
    student_id: int
    visitor_name: str
    visitor_phone: str
    relation: str


class VisitorCheckout(BaseModel):
    check_out: datetime


class VisitorOut(BaseModel):
    id: int
    student_id: int
    visitor_name: str
    visitor_phone: str
    relation: str
    check_in: datetime
    check_out: datetime | None

    model_config = {'from_attributes': True}
