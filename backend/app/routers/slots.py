from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import CLINIC_TIMEZONE
from app.database import get_db
from app.dependencies import get_current_ready_user
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.doctor_availability import DoctorAvailability
from app.models.doctor_time_off import DoctorTimeOff
from app.models.enums import ACTIVE_APPOINTMENT_STATUSES
from app.models.user import User
from app.schemas.appointment import AppointmentSlotResponse
from app.services import scheduling

router = APIRouter(prefix="/doctors", tags=["Slots"])


CLINIC_TZ = ZoneInfo(CLINIC_TIMEZONE)


@router.get(
    "/{doctor_id}/slots",
    response_model=list[AppointmentSlotResponse],
)
def list_doctor_slots(
    doctor_id: int,
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Horarios libres de un medico en un rango de fechas.

    Requiere usuario autenticado y listo (sin cambio de contraseña). La lista
    publica de medicos vive en `/api/public/doctors`.
    """
    doctor = db.get(Doctor, doctor_id)

    if doctor is None or not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos ese médico.",
        )

    if from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha 'from' no puede ser posterior a 'to'.",
        )

    from_dt = scheduling.local_date_start(from_date)
    to_dt = scheduling.local_date_end(to_date)

    from_utc = scheduling.to_utc(from_dt)
    to_utc = scheduling.to_utc(to_dt)

    availability_rows = (
        db.query(DoctorAvailability)
        .filter(DoctorAvailability.doctor_id == doctor_id)
        .all()
    )

    time_off_rows = (
        db.query(DoctorTimeOff)
        .filter(
            DoctorTimeOff.doctor_id == doctor_id,
            DoctorTimeOff.ends_at > from_utc,
            DoctorTimeOff.starts_at < to_utc,
        )
        .all()
    )

    appointments_rows = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
            Appointment.ends_at > from_utc,
            Appointment.starts_at < to_utc,
        )
        .all()
    )

    slots = scheduling.generate_slots(
        doctor=doctor,
        availability_rows=availability_rows,
        time_off_rows=time_off_rows,
        appointments_rows=appointments_rows,
        from_dt=from_dt,
        to_dt=to_dt,
    )

    duration = timedelta(minutes=getattr(doctor, "consultation_minutes", 30) or 30)

    return [
        AppointmentSlotResponse(start=slot, end=slot + duration)
        for slot in slots
    ]
