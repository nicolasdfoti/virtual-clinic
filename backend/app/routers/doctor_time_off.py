from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.doctor_time_off import DoctorTimeOff
from app.models.enums import ACTIVE_APPOINTMENT_STATUSES
from app.schemas.time_off import DoctorTimeOffCreate, DoctorTimeOffResponse
from app.services import scheduling

router = APIRouter(prefix="/doctor/time-off", tags=["Doctor time-off"])


@router.get("", response_model=list[DoctorTimeOffResponse])
def list_time_off(
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(DoctorTimeOff)
        .filter(DoctorTimeOff.doctor_id == doctor.id)
        .order_by(DoctorTimeOff.starts_at)
        .all()
    )

    return rows


@router.post(
    "",
    response_model=DoctorTimeOffResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_time_off(
    payload: DoctorTimeOffCreate,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El fin del bloque debe ser posterior al inicio.",
        )

    # Un bloqueo que pisa turnos agendados dejaría turnos vivos dentro de una
    # franja cerrada. Se avisa con 409 y el conteo para que el medico los
    # cancele o reprograme primero.
    starts_utc = scheduling.to_utc(payload.starts_at)
    ends_utc = scheduling.to_utc(payload.ends_at)

    overlapping = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
            Appointment.starts_at < ends_utc,
            Appointment.ends_at > starts_utc,
        )
        .count()
    )

    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Hay {overlapping} turno(s) agendado(s) en ese rango. "
                "Cancelalos o reprogramalos antes de crear el bloqueo."
            ),
        )

    row = DoctorTimeOff(
        doctor_id=doctor.id,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        reason=payload.reason,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return row


@router.delete(
    "/{time_off_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_time_off(
    time_off_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    row = (
        db.query(DoctorTimeOff)
        .filter(
            DoctorTimeOff.id == time_off_id,
            DoctorTimeOff.doctor_id == doctor.id,
        )
        .first()
    )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos ese bloqueo de tiempo.",
        )

    db.delete(row)
    db.commit()

    return None
