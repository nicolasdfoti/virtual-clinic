from datetime import datetime

from pydantic import BaseModel, field_validator


class DoctorTimeOffCreate(BaseModel):
    starts_at: datetime
    ends_at: datetime
    reason: str | None = None

    @field_validator("ends_at")
    @classmethod
    def ends_after_start(cls, value: datetime, info) -> datetime:
        starts = info.data.get("starts_at")
        if starts is not None and value <= starts:
            raise ValueError("El fin del bloque debe ser posterior al inicio.")

        return value


class DoctorTimeOffResponse(BaseModel):
    id: int
    doctor_id: int
    starts_at: datetime
    ends_at: datetime
    reason: str | None
    created_at: datetime
