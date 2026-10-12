from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import CLINIC_TIMEZONE
from app.database import get_db
from app.dependencies import get_current_doctor, get_current_ready_user, require_roles
from app.models.appointment import Appointment
from app.models.care_relationship import CareRelationship
from app.models.doctor import Doctor
from app.models.doctor_availability import DoctorAvailability
from app.models.doctor_time_off import DoctorTimeOff
from app.models.enums import (
    ACTIVE_APPOINTMENT_STATUSES,
    AppointmentModality,
    AppointmentStatus,
    CareRelationshipStatus,
    Role,
)
from app.models.patient_profile import PatientProfile
from app.models.user import User
from app.schemas.appointment import (
    AppointmentBookRequest,
    AppointmentCancelRequest,
    AppointmentPatientResponse,
    AppointmentUpdateResponse,
)
from app.services import notifications, scheduling

router = APIRouter(tags=["Appointments"])

CLINIC_TZ = ZoneInfo(CLINIC_TIMEZONE)
CANCEL_HOURS_BEFORE = 24


def _is_profile_complete(profile: PatientProfile | None) -> bool:
    if profile is None:
        return False
    return profile.is_complete


def _format_name(user: User | None) -> str | None:
    if user is None:
        return None
    name = f"{user.first_name} {user.last_name}".strip()
    return name or None


def _ensure_within_schedule(
    db: Session,
    doctor: Doctor,
    *,
    starts_local: datetime,
    ends_local: datetime,
    starts_utc: datetime,
    ends_utc: datetime,
) -> None:
    """Rechaza turnos fuera de la agenda del medico o dentro de un bloqueo.

    El frontend solo ofrece slots generados a partir de la agenda, pero la API
    es publica para el paciente y no se puede confiar en que mande un slot
    valido: la validacion real vive aca.
    """
    time_off = (
        db.query(DoctorTimeOff)
        .filter(
            DoctorTimeOff.doctor_id == doctor.id,
            DoctorTimeOff.starts_at < ends_utc,
            DoctorTimeOff.ends_at > starts_utc,
        )
        .first()
    )

    if time_off is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El médico no atiende en ese horario.",
        )

    weekday = starts_local.weekday()
    start_clock = starts_local.time()
    end_clock = ends_local.time()

    availability_rows = (
        db.query(DoctorAvailability)
        .filter(
            DoctorAvailability.doctor_id == doctor.id,
            DoctorAvailability.weekday == weekday,
        )
        .all()
    )

    for availability in availability_rows:
        if availability.start_time <= start_clock and end_clock <= availability.end_time:
            return

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Ese horario no está dentro de la agenda del médico.",
    )


@router.post(
    "/appointments",
    response_model=AppointmentPatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def book_appointment(
    payload: AppointmentBookRequest,
    request: Request,
    current_user: User = Depends(require_roles(Role.PATIENT)),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(PatientProfile)
        .filter(PatientProfile.user_id == current_user.id)
        .first()
    )

    if not _is_profile_complete(profile):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completá tu perfil antes de sacar un turno.",
        )

    doctor = db.get(Doctor, payload.doctor_id)

    if doctor is None or not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos ese médico.",
        )

    starts_at = payload.starts_at
    if starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=CLINIC_TZ)

    starts_utc = scheduling.to_utc(starts_at)

    duration = timedelta(minutes=getattr(doctor, "consultation_minutes", 30) or 30)
    ends_utc = starts_utc + duration

    now_utc = datetime.now(ZoneInfo("UTC"))
    if starts_utc < now_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El horario seleccionado ya no está disponible.",
        )

    _ensure_within_schedule(
        db,
        doctor,
        starts_local=starts_at,
        ends_local=starts_at + duration,
        starts_utc=starts_utc,
        ends_utc=ends_utc,
    )

    overlap = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
            Appointment.starts_at < ends_utc,
            Appointment.ends_at > starts_utc,
        )
        .first()
    )

    if overlap is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese horario ya fue reservado.",
        )

    rel = (
        db.query(CareRelationship)
        .filter(
            CareRelationship.doctor_id == doctor.id,
            CareRelationship.patient_id == current_user.id,
        )
        .first()
    )
    if rel is None:
        rel = CareRelationship(
            doctor_id=doctor.id,
            patient_id=current_user.id,
            status=CareRelationshipStatus.ACTIVE,
        )
        db.add(rel)
    elif rel.status == CareRelationshipStatus.ENDED:
        rel.status = CareRelationshipStatus.ACTIVE

    appt = Appointment(
        patient_id=current_user.id,
        doctor_id=doctor.id,
        starts_at=starts_utc,
        ends_at=ends_utc,
        status=AppointmentStatus.SCHEDULED,
        reason=payload.reason,
        modality=payload.modality,
        video_url=None,
    )

    db.add(appt)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese horario ya fue reservado.",
        )
    db.refresh(appt)

    notifications.notify_appointment_booked(
        db,
        appointment_id=appt.id,
        doctor_user_id=doctor.user_id,
        patient_name=_format_name(current_user),
        starts_at=appt.starts_at,
    )

    return AppointmentPatientResponse(
        id=appt.id,
        doctor_id=appt.doctor_id,
        doctor_user_id=doctor.user_id if doctor else None,
        doctor_name=_format_name(doctor.user) if hasattr(doctor, "user") else None,
        doctor_photo=doctor.user.photo if hasattr(doctor, "user") and doctor.user else None,
        patient_id=appt.patient_id,
        patient_user_id=current_user.id,
        patient_name=_format_name(current_user),
        patient_photo=current_user.photo,
        starts_at=appt.starts_at,
        ends_at=appt.ends_at,
        status=appt.status,
        reason=appt.reason,
        modality=appt.modality,
        video_url=appt.video_url,
        cancelled_by=appt.cancelled_by,
        cancel_reason=appt.cancel_reason,
        created_at=appt.created_at,
    )


@router.get(
    "/appointments/mine",
    response_model=list[AppointmentPatientResponse],
)
def list_my_appointments(
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    query = db.query(Appointment)

    if current_user.role == Role.DOCTOR:
        doctor = (
            db.query(Doctor)
            .filter(Doctor.user_id == current_user.id)
            .first()
        )
        if doctor is None:
            return []
        query = query.filter(Appointment.doctor_id == doctor.id)
    else:
        query = query.filter(Appointment.patient_id == current_user.id)

    appointments = query.order_by(Appointment.starts_at.desc()).all()

    results: list[AppointmentPatientResponse] = []
    for appt in appointments:
        doctor = db.get(Doctor, appt.doctor_id)
        patient = db.get(User, appt.patient_id)
        doc_name = _format_name(doctor.user) if doctor is not None and hasattr(doctor, "user") else None
        pat_name = _format_name(patient)
        results.append(
            AppointmentPatientResponse(
                id=appt.id,
                doctor_id=appt.doctor_id,
                doctor_user_id=doctor.user_id if doctor else None,
                doctor_name=doc_name,
                doctor_photo=doctor.user.photo if doctor is not None and doctor.user else None,
                patient_id=appt.patient_id,
                patient_user_id=patient.id if patient else None,
                patient_name=pat_name,
                patient_photo=patient.photo if patient is not None else None,
                starts_at=appt.starts_at,
                ends_at=appt.ends_at,
                status=appt.status,
                reason=appt.reason,
                modality=appt.modality,
                video_url=appt.video_url,
                cancelled_by=appt.cancelled_by,
                cancel_reason=appt.cancel_reason,
                created_at=appt.created_at,
            )
        )

    return results
