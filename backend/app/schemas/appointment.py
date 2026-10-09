from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import AppointmentModality, AppointmentStatus


class AppointmentSlotResponse(BaseModel):
    start: datetime
    end: datetime


class AppointmentBookRequest(BaseModel):
    doctor_id: int
    starts_at: datetime
    reason: str | None = Field(default=None, max_length=500)
    modality: AppointmentModality = AppointmentModality.VIDEO


class AppointmentPatientResponse(BaseModel):
    id: int
    doctor_id: int
    doctor_name: str | None = None
    patient_id: int
    patient_name: str | None = None
    starts_at: datetime
    ends_at: datetime
    status: AppointmentStatus
    reason: str | None
    modality: AppointmentModality
    video_url: str | None
    cancelled_by: int | None
    cancel_reason: str | None
    created_at: datetime


class AppointmentCancelRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class AppointmentUpdateResponse(BaseModel):
    id: int
    status: AppointmentStatus
