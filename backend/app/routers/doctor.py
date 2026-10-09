from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.care_relationship import CareRelationship
from app.models.doctor import Doctor
from app.models.enums import CareRelationshipStatus, Role
from app.models.patient_profile import PatientProfile
from app.models.user import User
from app.schemas.doctor_patient import (
    DoctorAppointmentDetail,
    DoctorNextAppointment,
    DoctorPatientDetail,
    DoctorPatientListItem,
    DoctorPatientListResponse,
    LinkPatientRequest,
)
from app.services import audit


router = APIRouter(
    prefix="/doctor",
    tags=["Doctor"],
)

PATIENT_NOT_FOUND_DETAIL = "No encontramos ese paciente."
PATIENT_ALREADY_LINKED_DETAIL = "Ya tenés vinculado a ese paciente."


def _find_patient(db: Session, payload: LinkPatientRequest) -> User | None:
    """Busca un usuario con rol PATIENT por email o por DNI del perfil."""
    if payload.email:
        return (
            db.query(User)
            .filter(User.email == payload.email, User.role == Role.PATIENT)
            .first()
        )

    profile = (
        db.query(PatientProfile)
        .filter(PatientProfile.dni == payload.dni)
        .first()
    )

    if profile is None:
        return None

    user = db.get(User, profile.user_id)

    return user if user is not None and user.role == Role.PATIENT else None


def _active_relationship(
    db: Session,
    doctor_id: int,
    patient_id: int,
) -> CareRelationship | None:
    return (
        db.query(CareRelationship)
        .filter(
            CareRelationship.doctor_id == doctor_id,
            CareRelationship.patient_id == patient_id,
            CareRelationship.status == CareRelationshipStatus.ACTIVE,
        )
        .first()
    )


def _list_item(
    user: User, profile: PatientProfile | None, next_appt: DoctorNextAppointment | None
) -> DoctorPatientListItem:
    return DoctorPatientListItem(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        dni=profile.dni if profile is not None else None,
        insurance_provider=(
            profile.insurance_provider if profile is not None else None
        ),
        next_appointment=next_appt,
    )


def _get_next_appointments_for_patients(
    db: Session, doctor_id: int, patient_ids: list[int]
) -> dict[int, DoctorNextAppointment]:
    """Obtiene el proximo turno (SCHEDULED/CONFIRMED) para cada paciente."""
    if not patient_ids:
        return {}
    from datetime import datetime
    from zoneinfo import ZoneInfo
    from app.models.appointment import Appointment
    from app.models.enums import AppointmentStatus

    rows = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.patient_id.in_(patient_ids),
            Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]),
            Appointment.starts_at >= datetime.now(ZoneInfo("UTC")),
        )
        .order_by(Appointment.patient_id, Appointment.starts_at.asc())
        .all()
    )

    result: dict[int, DoctorNextAppointment] = {}
    for appt in rows:
        if appt.patient_id not in result:
            result[appt.patient_id] = DoctorNextAppointment(
                id=appt.id,
                starts_at=appt.starts_at,
                ends_at=appt.ends_at,
                modality=appt.modality.value,
                status=appt.status.value,
                reason=appt.reason,
            )
    return result


@router.get(
    "/patients",
    response_model=DoctorPatientListResponse,
)
def list_my_patients(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None),
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Pacientes con relacion ACTIVE del medico autenticado."""
    query = (
        db.query(User, PatientProfile)
        .join(CareRelationship, CareRelationship.patient_id == User.id)
        .outerjoin(PatientProfile, PatientProfile.user_id == User.id)
        .filter(
            CareRelationship.doctor_id == doctor.id,
            CareRelationship.status == CareRelationshipStatus.ACTIVE,
            User.role == Role.PATIENT,
        )
    )

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                PatientProfile.dni.ilike(pattern),
            )
        )

    total = query.count()

    rows = (
        query.order_by(User.last_name, User.first_name, User.id)
        .offset(offset)
        .limit(limit)
        .all()
    )

    patient_ids = [user.id for user, _ in rows]
    next_appts = _get_next_appointments_for_patients(db, doctor.id, patient_ids)

    return DoctorPatientListResponse(
        items=[
            _list_item(user, profile, next_appts.get(user.id))
            for user, profile in rows
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/patients/{patient_id}",
    response_model=DoctorPatientDetail,
)
def get_my_patient(
    patient_id: int,
    request: Request,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Perfil en solo lectura. Sin relacion activa es 404 (aunque el paciente
    exista): no se filtra si el paciente es de otro medico o no existe."""
    if _active_relationship(db, doctor.id, patient_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PATIENT_NOT_FOUND_DETAIL,
        )

    row = (
        db.query(User, PatientProfile)
        .outerjoin(PatientProfile, PatientProfile.user_id == User.id)
        .filter(User.id == patient_id, User.role == Role.PATIENT)
        .first()
    )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PATIENT_NOT_FOUND_DETAIL,
        )

    user, profile = row

    # Trazabilidad: se registra la lectura, sin datos de salud (metadata va
    # vacia; entity_id es solo el id del paciente).
    audit.log(
        db,
        actor_user_id=doctor.user_id,
        action="patient_profile_viewed",
        entity_type="patient_profile",
        entity_id=user.id,
        ip=audit.client_ip(request),
        metadata=None,
    )

    return DoctorPatientDetail(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        dni=profile.dni if profile is not None else None,
        birth_date=profile.birth_date if profile is not None else None,
        sex=profile.sex if profile is not None else None,
        phone=profile.phone if profile is not None else None,
        address=profile.address if profile is not None else None,
        city=profile.city if profile is not None else None,
        insurance_provider=(
            profile.insurance_provider if profile is not None else None
        ),
        insurance_plan=(
            profile.insurance_plan if profile is not None else None
        ),
        insurance_member_number=(
            profile.insurance_member_number if profile is not None else None
        ),
        emergency_contact_name=(
            profile.emergency_contact_name if profile is not None else None
        ),
        emergency_contact_phone=(
            profile.emergency_contact_phone if profile is not None else None
        ),
        is_complete=profile.is_complete if profile is not None else False,
        created_at=user.created_at,
    )


@router.post(
    "/patients",
    response_model=DoctorPatientListItem,
    status_code=status.HTTP_201_CREATED,
)
def link_patient(
    payload: LinkPatientRequest,
    request: Request,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Vincula un paciente existente por DNI o email.

    Si el vinculo existia y estaba `ENDED`, se reactiva en vez de crear otra
    fila (el par `(doctor_id, patient_id)` es unico en la base).
    """
    patient = _find_patient(db, payload)

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PATIENT_NOT_FOUND_DETAIL,
        )

    relationship = (
        db.query(CareRelationship)
        .filter(
            CareRelationship.doctor_id == doctor.id,
            CareRelationship.patient_id == patient.id,
        )
        .first()
    )

    if relationship is not None:
        if relationship.status == CareRelationshipStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=PATIENT_ALREADY_LINKED_DETAIL,
            )

        relationship.status = CareRelationshipStatus.ACTIVE
    else:
        relationship = CareRelationship(
            doctor_id=doctor.id,
            patient_id=patient.id,
            status=CareRelationshipStatus.ACTIVE,
        )
        db.add(relationship)

    db.commit()
    db.refresh(relationship)

    audit.log(
        db,
        actor_user_id=doctor.user_id,
        action="patient_linked",
        entity_type="care_relationship",
        entity_id=relationship.id,
        ip=audit.client_ip(request),
        metadata=None,
    )

    profile = (
        db.query(PatientProfile)
        .filter(PatientProfile.user_id == patient.id)
        .first()
    )

    return _list_item(patient, profile, None)


@router.get(
    "/appointments/{appointment_id}",
    response_model=DoctorAppointmentDetail,
)
def get_appointment_detail(
    appointment_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Detalle de un turno del medico. 404 si el turno no es de este medico."""
    from app.models.appointment import Appointment
    from app.models.user import User

    appt = db.get(Appointment, appointment_id)

    if appt is None or appt.doctor_id != doctor.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos ese turno.",
        )

    patient = db.get(User, appt.patient_id)

    return DoctorAppointmentDetail(
        id=appt.id,
        patient_id=appt.patient_id,
        patient_name=f"{patient.first_name} {patient.last_name}".strip() if patient else None,
        patient_dni=(
            db.query(PatientProfile)
            .filter(PatientProfile.user_id == appt.patient_id)
            .first()
            .dni
            if db.query(PatientProfile).filter(PatientProfile.user_id == appt.patient_id).first()
            else None
        ),
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
