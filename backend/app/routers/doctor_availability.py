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


def _get_own_availability(
    availability_id: int,
    doctor: Doctor,
    db: Session,
) -> DoctorAvailability:
    """Devuelve la franja del medico o 404.

    Se filtra por doctor_id: una franja de otro medico se trata como inexistente
    para no filtrar la existencia de recursos ajenos.
    """
    row = (
        db.query(DoctorAvailability)
        .filter(
            DoctorAvailability.id == availability_id,
            DoctorAvailability.doctor_id == doctor.id,
        )
        .first()
    )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos esa franja de disponibilidad.",
        )

    return row


@router.put(
    "/{availability_id}",
    response_model=DoctorAvailabilityResponse,
)
def update_availability(
    availability_id: int,
    payload: DoctorAvailabilityUpdate,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    row = _get_own_availability(availability_id, doctor, db)

    new_start = (
        payload.start_time if payload.start_time is not None else row.start_time
    )
    new_end = payload.end_time if payload.end_time is not None else row.end_time

    _validate_times(new_start, new_end)

    conflict = (
        db.query(DoctorAvailability)
        .filter(
            DoctorAvailability.doctor_id == doctor.id,
            DoctorAvailability.weekday == row.weekday,
            DoctorAvailability.start_time == new_start,
            DoctorAvailability.id != row.id,
        )
        .first()
    )

    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una franja para ese día y horario.",
        )

    row.start_time = new_start
    row.end_time = new_end
    db.commit()
    db.refresh(row)

    return row


@router.delete(
    "/{availability_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_availability(
    availability_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    row = _get_own_availability(availability_id, doctor, db)

    db.delete(row)
    db.commit()

    return None
