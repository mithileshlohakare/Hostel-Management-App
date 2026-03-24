from datetime import datetime
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    recipient_id: int
    channel: str
    message: str
    sent_at: datetime

    model_config = {'from_attributes': True}
