from datetime import time

from pydantic import BaseModel, field_validator


def _validate_time_range(start: time, end: time) -> None:
    if end <= start:
        raise ValueError("El horario de fin debe ser posterior al de inicio.")


class DoctorAvailabilityCreate(BaseModel):
    weekday: int
    start_time: time
    end_time: time

    @field_validator("weekday")
    @classmethod
    def weekday_range(cls, value: int) -> int:
        if value < 0 or value > 6:
            raise ValueError("weekday debe estar entre 0 (lunes) y 6 (domingo).")

        return value


class DoctorAvailabilityUpdate(BaseModel):
    start_time: time | None = None
    end_time: time | None = None


class DoctorAvailabilityResponse(BaseModel):
    id: int
    doctor_id: int
    weekday: int
    start_time: time
    end_time: time
