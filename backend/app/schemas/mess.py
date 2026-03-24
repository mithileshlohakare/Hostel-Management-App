from datetime import datetime
from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    meal_type: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class FeedbackOut(BaseModel):
    id: int
    student_id: int
    meal_type: str
    rating: int
    comment: str | None
    submitted_at: datetime

    model_config = {'from_attributes': True}
