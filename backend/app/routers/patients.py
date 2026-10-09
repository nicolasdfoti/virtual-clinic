from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import Role
from app.models.patient_profile import PatientProfile
from app.models.user import User
from app.schemas.patient_profile import (
    PatientProfileResponse,
    PatientProfileUpdate,
)


router = APIRouter(
    prefix="/patients",
    tags=["Patients"],
)

DNI_TAKEN_DETAIL = "Ya hay un paciente registrado con ese DNI."

# Campos que el paciente puede editar. La lista define que se copia del body al
# modelo: agregar una columna nueva al perfil no la expone por accidente.
EDITABLE_FIELDS = (
    "dni",
    "birth_date",
    "sex",
    "phone",
    "address",
    "city",
    "insurance_provider",
    "insurance_plan",
    "insurance_member_number",
    "emergency_contact_name",
    "emergency_contact_phone",
)


def _get_profile(db: Session, user_id: int) -> PatientProfile | None:
    return (
        db.query(PatientProfile)
        .filter(PatientProfile.user_id == user_id)
        .first()
    )


@router.get(
    "/me/profile",
    response_model=PatientProfileResponse,
)
def get_my_profile(
    current_user: User = Depends(require_roles(Role.PATIENT)),
    db: Session = Depends(get_db),
):
    """Perfil del paciente autenticado. Sin fila todavia, se responde un perfil
    vacio con `is_complete=false` para que el frontend no tenga que tratar el
    404 como caso especial."""
    profile = _get_profile(db, current_user.id)

    if profile is None:
        return PatientProfileResponse(
            user_id=current_user.id,
            is_complete=False,
        )

    return profile


@router.put(
    "/me/profile",
    response_model=PatientProfileResponse,
)
def update_my_profile(
    payload: PatientProfileUpdate,
    current_user: User = Depends(require_roles(Role.PATIENT)),
    db: Session = Depends(get_db),
):
    """Crea o reemplaza el perfil del paciente autenticado.

    El chequeo de DNI duplicado solo mira a OTROS usuarios: reenviar el propio
    DNI no da conflicto.
    """
    profile = _get_profile(db, current_user.id)

    if profile is None:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)

    if payload.dni is not None:
        existing = (
            db.query(PatientProfile)
            .filter(
                PatientProfile.dni == payload.dni,
                PatientProfile.user_id != current_user.id,
            )
            .first()
        )

        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=DNI_TAKEN_DETAIL,
            )

    for field in EDITABLE_FIELDS:
        setattr(profile, field, getattr(payload, field))

    try:
        db.commit()
    except IntegrityError:
        # El chequeo previo no es atomico: dos altas concurrentes con el mismo
        # DNI pueden pasarlo las dos. El indice unico lo corta aca.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=DNI_TAKEN_DETAIL,
        )

    db.refresh(profile)

    return profile
