from datetime import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.doctor import Doctor
from app.models.doctor_availability import DoctorAvailability
from app.schemas.availability import (
    DoctorAvailabilityCreate,
    DoctorAvailabilityResponse,
    DoctorAvailabilityUpdate,
)

router = APIRouter(prefix="/doctor/availability", tags=["Doctor availability"])


def _validate_times(start: time, end: time) -> None:
    if end <= start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El horario de fin debe ser posterior al de inicio.",
        )


@router.get("", response_model=list[DoctorAvailabilityResponse])
def list_availability(
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(DoctorAvailability)
        .filter(DoctorAvailability.doctor_id == doctor.id)
        .order_by(DoctorAvailability.weekday, DoctorAvailability.start_time)
        .all()
    )

    return rows


@router.post(
    "",
    response_model=DoctorAvailabilityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_availability(
    payload: DoctorAvailabilityCreate,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    _validate_times(payload.start_time, payload.end_time)

    existing = (
        db.query(DoctorAvailability)
        .filter(
            DoctorAvailability.doctor_id == doctor.id,
            DoctorAvailability.weekday == payload.weekday,
            DoctorAvailability.start_time == payload.start_time,
        )
        .first()
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una franja para ese día y horario.",
        )

    row = DoctorAvailability(
        doctor_id=doctor.id,
        weekday=payload.weekday,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return row
