from datetime import datetime, timedelta, timezone

from app.models.models import Complaint, ComplaintStatus


def build_due_at(sla_hours: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=sla_hours)


def derive_complaint_status(complaint: Complaint) -> ComplaintStatus:
    if complaint.status == ComplaintStatus.resolved:
        return ComplaintStatus.resolved
    if complaint.due_at < datetime.now(timezone.utc):
        return ComplaintStatus.breached
    return complaint.status
