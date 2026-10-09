from datetime import datetime

from pydantic import BaseModel

from app.models.enums import AppointmentModality, AppointmentStatus


class AdminAppointmentResponse(BaseModel):
    id: int
    doctor_id: int
    doctor_name: str | None = None
    patient_id: int
    patient_name: str | None = None
    starts_at: datetime
    ends_at: datetime
    status: AppointmentStatus
    modality: AppointmentModality
    reason: str | None
    video_url: str | None
    cancelled_by: int | None
    cancel_reason: str | None
    created_at: datetime
