import secrets
from datetime import date, datetime, time, timedelta
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import CLINIC_TIMEZONE
from app.core.security import hash_password
from app.database import get_db
from app.dependencies import require_roles
from app.models.doctor import Doctor
from app.models.enums import Role
from app.models.patient_profile import PatientProfile
from app.models.user import User
from app.schemas.admin import (
    AdminPatientListResponse,
    AdminPatientResponse,
    AdminStatsResponse,
)
from app.schemas.doctor import (
    DoctorCreate,
    DoctorCreatedResponse,
    DoctorProfileCreate,
    DoctorResponse,
    DoctorUpdate,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)

EMAIL_TAKEN_DETAIL = "Ya existe una cuenta con ese email."
LICENSE_TAKEN_DETAIL = "Ya hay un médico registrado con esa matrícula."
DOCTOR_NOT_FOUND_DETAIL = "No encontramos ese médico."
DOCTOR_PROFILE_EXISTS_DETAIL = "Ya tenés un perfil de médico."
DOCTOR_CONFLICT_DETAIL = (
    "No se pudo completar el alta: el email o la matrícula ya existen."
)

# token_urlsafe(16) da 22 caracteres: cumple el minimo de 8 y no llega al tope
# de 72 bytes de bcrypt.
TEMPORARY_PASSWORD_BYTES = 16

PATIENT_SORT_COLUMNS = {
    "created_at": User.created_at,
    "last_name": User.last_name,
    "email": User.email,
}


def _generate_temporary_password() -> str:
    return secrets.token_urlsafe(TEMPORARY_PASSWORD_BYTES)


def _doctor_response(doctor: Doctor, user: User) -> DoctorResponse:
    return DoctorResponse(
        id=doctor.id,
        user_id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        specialty=doctor.specialty,
        license_number=doctor.license_number,
        bio=doctor.bio,
        is_active=doctor.is_active,
        created_at=doctor.created_at,
    )


def _get_doctor_row(
    db: Session,
    doctor_id: int,
) -> tuple[Doctor, User] | None:
    return (
        db.query(Doctor, User)
        .join(User, Doctor.user_id == User.id)
        .filter(Doctor.id == doctor_id)
        .first()
    )


def _clinic_day_start(value: date) -> datetime:
    return datetime.combine(value, time.min, tzinfo=ZoneInfo(CLINIC_TIMEZONE))


@router.post(
    "/doctors",
    response_model=DoctorCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_doctor(
    payload: DoctorCreate,
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    """Alta de medico. El servidor genera la contraseña temporal y la devuelve
    una sola vez; nunca se loguea ni se puede volver a consultar."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=EMAIL_TAKEN_DETAIL,
        )

    if (
        db.query(Doctor)
        .filter(Doctor.license_number == payload.license_number)
        .first()
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=LICENSE_TAKEN_DETAIL,
        )

    temporary_password = _generate_temporary_password()

    user = User(
        email=payload.email,
        password_hash=hash_password(temporary_password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=Role.DOCTOR,
        must_change_password=True,
    )

    db.add(user)
    db.flush()

    doctor = Doctor(
        user_id=user.id,
        specialty=payload.specialty,
        license_number=payload.license_number,
        bio=payload.bio,
    )

    db.add(doctor)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=DOCTOR_CONFLICT_DETAIL,
        )

    db.refresh(user)
    db.refresh(doctor)

    response = _doctor_response(doctor, user)

    return DoctorCreatedResponse(
        **response.model_dump(),
        temporary_password=temporary_password,
    )


@router.get(
    "/doctors",
    response_model=list[DoctorResponse],
)
def list_doctors(
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Doctor, User)
        .join(User, Doctor.user_id == User.id)
        .order_by(User.last_name, User.first_name)
        .all()
    )

    return [_doctor_response(doctor, user) for doctor, user in rows]


@router.patch(
    "/doctors/{doctor_id}",
    response_model=DoctorResponse,
)
def update_doctor(
    doctor_id: int,
    payload: DoctorUpdate,
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    row = _get_doctor_row(db, doctor_id)

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=DOCTOR_NOT_FOUND_DETAIL,
        )

    doctor, user = row
    data = payload.model_dump(exclude_unset=True)

    new_license = data.get("license_number")

    if new_license is not None:
        existing = (
            db.query(Doctor)
            .filter(
                Doctor.license_number == new_license,
                Doctor.id != doctor.id,
            )
            .first()
        )

        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=LICENSE_TAKEN_DETAIL,
            )

    if data.get("first_name") is not None:
        user.first_name = data["first_name"]

    if data.get("last_name") is not None:
        user.last_name = data["last_name"]

    if new_license is not None:
        doctor.license_number = new_license

    if data.get("specialty") is not None:
        doctor.specialty = data["specialty"]

    if "bio" in data:
        doctor.bio = data["bio"]

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=DOCTOR_CONFLICT_DETAIL,
        )

    db.refresh(doctor)
    db.refresh(user)

    return _doctor_response(doctor, user)


def _set_doctor_active(
    db: Session,
    doctor_id: int,
    active: bool,
) -> DoctorResponse:
    row = _get_doctor_row(db, doctor_id)

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=DOCTOR_NOT_FOUND_DETAIL,
        )

    doctor, user = row

    doctor.is_active = active
    user.is_active = active

    if not active:
        # Al desactivar, los tokens ya emitidos dejan de valer: si no, la
        # sesion abierta seguiria operando hasta que expire.
        user.token_version += 1

    db.commit()
    db.refresh(doctor)
    db.refresh(user)

    return _doctor_response(doctor, user)


@router.post(
    "/doctors/{doctor_id}/deactivate",
    response_model=DoctorResponse,
)
def deactivate_doctor(
    doctor_id: int,
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    return _set_doctor_active(db, doctor_id, active=False)


@router.post(
    "/doctors/{doctor_id}/activate",
    response_model=DoctorResponse,
)
def activate_doctor(
    doctor_id: int,
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    return _set_doctor_active(db, doctor_id, active=True)


@router.post(
    "/me/enable-doctor-profile",
    response_model=DoctorResponse,
    status_code=status.HTTP_201_CREATED,
)
def enable_doctor_profile(
    payload: DoctorProfileCreate,
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    """El admin se crea su propia fila de medico sin tocar su rol (sigue
    siendo ADMIN y ademas puede atender)."""
    if (
        db.query(Doctor)
        .filter(Doctor.user_id == current_admin.id)
        .first()
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=DOCTOR_PROFILE_EXISTS_DETAIL,
        )

    if (
        db.query(Doctor)
        .filter(Doctor.license_number == payload.license_number)
        .first()
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=LICENSE_TAKEN_DETAIL,
        )

    doctor = Doctor(
        user_id=current_admin.id,
        specialty=payload.specialty,
        license_number=payload.license_number,
        bio=payload.bio,
    )

    db.add(doctor)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=DOCTOR_CONFLICT_DETAIL,
        )

    db.refresh(doctor)

    return _doctor_response(doctor, current_admin)


@router.get(
    "/patients",
    response_model=AdminPatientListResponse,
)
def list_patients(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None),
    insurance_provider: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    doctor_id: int | None = Query(default=None),
    created_from: date | None = Query(default=None),
    created_to: date | None = Query(default=None),
    sort: Literal["created_at", "last_name", "email"] = Query(
        default="created_at"
    ),
    order: Literal["asc", "desc"] = Query(default="desc"),
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    query = (
        db.query(User, PatientProfile)
        .outerjoin(PatientProfile, PatientProfile.user_id == User.id)
        .filter(User.role == Role.PATIENT)
    )

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                User.email.ilike(pattern),
                PatientProfile.dni.ilike(pattern),
            )
        )

    if insurance_provider and insurance_provider.strip():
        query = query.filter(
            PatientProfile.insurance_provider.ilike(
                f"%{insurance_provider.strip()}%"
            )
        )

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if doctor_id is not None:
        query = query.filter(PatientProfile.assigned_doctor_id == doctor_id)

    if created_from is not None:
        query = query.filter(User.created_at >= _clinic_day_start(created_from))

    if created_to is not None:
        query = query.filter(
            User.created_at
            < _clinic_day_start(created_to) + timedelta(days=1)
        )

    total = query.count()

    sort_column = PATIENT_SORT_COLUMNS[sort]
    order_by = sort_column.desc() if order == "desc" else sort_column.asc()

    rows = (
        query.order_by(order_by, User.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [
        AdminPatientResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            dni=profile.dni if profile is not None else None,
            insurance_provider=(
                profile.insurance_provider if profile is not None else None
            ),
            is_active=user.is_active,
            created_at=user.created_at,
        )
        for user, profile in rows
    ]

    return AdminPatientListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
)
def get_stats(
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    total_patients = (
        db.query(func.count(User.id))
        .filter(User.role == Role.PATIENT)
        .scalar()
    )

    active_patients = (
        db.query(func.count(User.id))
        .filter(User.role == Role.PATIENT, User.is_active.is_(True))
        .scalar()
    )

    now = datetime.now(ZoneInfo(CLINIC_TIMEZONE))
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    new_patients_this_month = (
        db.query(func.count(User.id))
        .filter(
            User.role == Role.PATIENT,
            User.created_at >= month_start,
        )
        .scalar()
    )

    active_doctors = (
        db.query(func.count(Doctor.id))
        .filter(Doctor.is_active.is_(True))
        .scalar()
    )

    return AdminStatsResponse(
        total_patients=total_patients or 0,
        active_patients=active_patients or 0,
        new_patients_this_month=new_patients_this_month or 0,
        active_doctors=active_doctors or 0,
    )
