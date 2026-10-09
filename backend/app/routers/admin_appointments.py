from datetime import date, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import CLINIC_TIMEZONE
from app.database import get_db
from app.dependencies import require_roles
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.enums import AppointmentStatus, Role
from app.models.user import User
from app.schemas.admin_appointments import AdminAppointmentResponse
from app.services import scheduling

router = APIRouter(prefix="/admin/appointments", tags=["Admin appointments"])


CLINIC_TZ = ZoneInfo(CLINIC_TIMEZONE)


@router.get("", response_model=list[AdminAppointmentResponse])
def list_admin_appointments(
    doctor_id: int | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    status: AppointmentStatus | None = Query(default=None),
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    q: str | None = Query(default=None),
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    query = db.query(Appointment)

    if doctor_id is not None:
        query = query.filter(Appointment.doctor_id == doctor_id)

    if patient_id is not None:
        query = query.filter(Appointment.patient_id == patient_id)

    if status is not None:
        query = query.filter(Appointment.status == status)

    if from_date is not None:
        query = query.filter(
            Appointment.starts_at >= scheduling.to_utc(scheduling.local_date_start(from_date))
        )

    if to_date is not None:
        to_end_of_day = scheduling.local_date_end(to_date) + timedelta(days=1)
        query = query.filter(
            Appointment.starts_at < scheduling.to_utc(to_end_of_day)
        )

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.join(Doctor, Doctor.id == Appointment.doctor_id).join(
            User, User.id == Appointment.patient_id
        )
        query = query.filter(
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                Doctor.license_number.ilike(pattern),
            )
        )

    rows = query.order_by(Appointment.starts_at.desc()).all()

    results: list[AdminAppointmentResponse] = []
    for appt in rows:
        doctor = db.get(Doctor, appt.doctor_id)
        patient = db.get(User, appt.patient_id)
        doc_name = None
        if doctor is not None:
            if hasattr(doctor, "user"):
                doc_name = f"{doctor.user.first_name} {doctor.user.last_name}".strip()
        pat_name = f"{patient.first_name} {patient.last_name}".strip() if patient else None
        results.append(
            AdminAppointmentResponse(
                id=appt.id,
                doctor_id=appt.doctor_id,
                doctor_name=doc_name,
                patient_id=appt.patient_id,
                patient_name=pat_name,
                starts_at=appt.starts_at,
                ends_at=appt.ends_at,
                status=appt.status,
                modality=appt.modality,
                reason=appt.reason,
                video_url=appt.video_url,
                cancelled_by=appt.cancelled_by,
                cancel_reason=appt.cancel_reason,
                created_at=appt.created_at,
            )
        )

    return results
