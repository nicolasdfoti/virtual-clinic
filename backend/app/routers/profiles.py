"""Router de perfiles de usuario.

Endpoints:
- GET /api/profiles/me: Perfil propio (campos segun rol).
- GET /api/profiles/{user_id}: Perfil de otro usuario (según politica de visibilidad).
- PATCH /api/doctor/me/profile: Medico edita su bio.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database import get_db
from app.dependencies import get_current_doctor, get_current_ready_user
from app.models.doctor import Doctor
from app.models.enums import Role
from app.models.user import User
from app.schemas.photo import PhotoUpdateRequest, PhotoUpdateResponse
from app.schemas.profile import (
    AdminViewOfDoctorProfileResponse,
    AdminViewOfPatientProfileResponse,
    DoctorViewOfPatientProfileResponse,
    OwnProfileAdminResponse,
    OwnProfileDoctorResponse,
    OwnProfilePatientResponse,
    PublicDoctorProfileResponse,
)
from app.services import audit, profile_policy

router = APIRouter(prefix="/profiles", tags=["Profiles"])

settings = get_settings()

PROFILE_NOT_FOUND = "Perfil no encontrado."


@router.get(
    "/me",
    response_model=OwnProfilePatientResponse
    | OwnProfileDoctorResponse
    | OwnProfileAdminResponse,
)
def get_my_profile(
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Perfil del usuario autenticado. Campos segun su rol."""
    if current_user.role == Role.PATIENT:
        from app.models.patient_profile import PatientProfile

        profile = (
            db.query(PatientProfile)
            .filter(PatientProfile.user_id == current_user.id)
            .first()
        )

        return OwnProfilePatientResponse(
            id=profile.id if profile else None,
            user_id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            photo=current_user.photo,
            role=current_user.role.value,
            dni=profile.dni if profile else None,
            birth_date=profile.birth_date if profile else None,
            sex=profile.sex if profile else None,
            phone=profile.phone if profile else None,
            address=profile.address if profile else None,
            city=profile.city if profile else None,
            insurance_provider=profile.insurance_provider if profile else None,
            insurance_plan=profile.insurance_plan if profile else None,
            insurance_member_number=profile.insurance_member_number if profile else None,
            emergency_contact_name=profile.emergency_contact_name if profile else None,
            emergency_contact_phone=profile.emergency_contact_phone if profile else None,
            is_complete=profile.is_complete if profile else False,
            created_at=profile.created_at if profile else None,
            updated_at=profile.updated_at if profile else None,
        )

    elif current_user.role == Role.DOCTOR:
        doctor = current_user.doctor
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Perfil de medico no encontrado.",
            )

        return OwnProfileDoctorResponse(
            id=current_user.id,
            user_id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            photo=current_user.photo,
            role=current_user.role.value,
            specialty=doctor.specialty,
            license_number=doctor.license_number,
            bio=doctor.bio,
            is_active=doctor.is_active,
            created_at=doctor.created_at,
        )

    elif current_user.role == Role.ADMIN:
        return OwnProfileAdminResponse(
            id=current_user.id,
            user_id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            photo=current_user.photo,
            role=current_user.role.value,
            created_at=current_user.created_at,
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Rol no soportado.",
    )


@router.get(
    "/{user_id}",
    response_model=PublicDoctorProfileResponse
    | DoctorViewOfPatientProfileResponse
    | AdminViewOfDoctorProfileResponse
    | AdminViewOfPatientProfileResponse,
)
def get_user_profile(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Perfil de otro usuario. Aplica politica de visibilidad por rol."""
    target = db.get(User, user_id)

    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PROFILE_NOT_FOUND,
        )

    # Verificar politica de visibilidad
    if not profile_policy.can_view(current_user, target):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PROFILE_NOT_FOUND,
        )

    # Propio perfil ya se maneja en /me, pero por si acaso
    if current_user.id == target.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PROFILE_NOT_FOUND,
        )

    # Construir respuesta segun rol del visor y rol del objetivo
    if current_user.role == Role.PATIENT:
        # Pacientes solo ven medicos -> PublicDoctorProfileResponse
        if target.role != Role.DOCTOR:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=PROFILE_NOT_FOUND,
            )
        doctor = target.doctor
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=PROFILE_NOT_FOUND,
            )
        return PublicDoctorProfileResponse(
            id=target.id,
            user_id=target.id,
            first_name=target.first_name,
            last_name=target.last_name,
            photo=target.photo,
            specialty=doctor.specialty,
            license_number=doctor.license_number,
            bio=doctor.bio,
        )

    elif current_user.role == Role.DOCTOR:
        # Medicos ven todos
        if target.role == Role.DOCTOR:
            doctor = target.doctor
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=PROFILE_NOT_FOUND,
                )
            return AdminViewOfDoctorProfileResponse(
                id=target.id,
                user_id=target.id,
                email=target.email,
                first_name=target.first_name,
                last_name=target.last_name,
                photo=target.photo,
                specialty=doctor.specialty,
                license_number=doctor.license_number,
                bio=doctor.bio,
                is_active=doctor.is_active,
                created_at=doctor.created_at,
            )
        elif target.role == Role.PATIENT:
            profile = target.patient_profile
            return DoctorViewOfPatientProfileResponse(
                id=target.id,
                user_id=target.id,
                email=target.email,
                first_name=target.first_name,
                last_name=target.last_name,
                photo=target.photo,
                dni=profile.dni if profile else None,
                birth_date=profile.birth_date if profile else None,
                sex=profile.sex if profile else None,
                phone=profile.phone if profile else None,
                address=profile.address if profile else None,
                city=profile.city if profile else None,
                insurance_provider=profile.insurance_provider if profile else None,
                insurance_plan=profile.insurance_plan if profile else None,
                insurance_member_number=profile.insurance_member_number if profile else None,
                emergency_contact_name=profile.emergency_contact_name if profile else None,
                emergency_contact_phone=profile.emergency_contact_phone if profile else None,
                is_complete=profile.is_complete if profile else False,
                created_at=profile.created_at if profile else None,
                updated_at=profile.updated_at if profile else None,
            )
        elif target.role == Role.ADMIN:
            # Admin visto por doctor -> perfil basico de admin
            return AdminViewOfDoctorProfileResponse(
                type="admin",
                id=target.id,
                user_id=target.id,
                email=target.email,
                first_name=target.first_name,
                last_name=target.last_name,
                photo=target.photo,
                specialty="",
                license_number="",
                bio=None,
                is_active=target.is_active,
                created_at=target.created_at,
            )

    elif current_user.role == Role.ADMIN:
        # Admin ve todos
        if target.role == Role.DOCTOR:
            doctor = target.doctor
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=PROFILE_NOT_FOUND,
                )
            return AdminViewOfDoctorProfileResponse(
                id=target.id,
                user_id=target.id,
                email=target.email,
                first_name=target.first_name,
                last_name=target.last_name,
                photo=target.photo,
                specialty=doctor.specialty,
                license_number=doctor.license_number,
                bio=doctor.bio,
                is_active=doctor.is_active,
                created_at=doctor.created_at,
            )
        elif target.role == Role.PATIENT:
            profile = target.patient_profile
            return AdminViewOfPatientProfileResponse(
                id=target.id,
                user_id=target.id,
                email=target.email,
                first_name=target.first_name,
                last_name=target.last_name,
                photo=target.photo,
                dni=profile.dni if profile else None,
                birth_date=profile.birth_date if profile else None,
                sex=profile.sex if profile else None,
                phone=profile.phone if profile else None,
                address=profile.address if profile else None,
                city=profile.city if profile else None,
                insurance_provider=profile.insurance_provider if profile else None,
                insurance_plan=profile.insurance_plan if profile else None,
                insurance_member_number=profile.insurance_member_number if profile else None,
                emergency_contact_name=profile.emergency_contact_name if profile else None,
                emergency_contact_phone=profile.emergency_contact_phone if profile else None,
                is_complete=profile.is_complete if profile else False,
                created_at=profile.created_at if profile else None,
                updated_at=profile.updated_at if profile else None,
            )
        elif target.role == Role.ADMIN:
            # Admin viendo otro admin
            return AdminViewOfDoctorProfileResponse(
                type="admin",
                id=target.id,
                user_id=target.id,
                email=target.email,
                first_name=target.first_name,
                last_name=target.last_name,
                photo=target.photo,
                specialty="",
                license_number="",
                bio=None,
                is_active=target.is_active,
                created_at=target.created_at,
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=PROFILE_NOT_FOUND,
    )


@router.put(
    "/me/photo",
    response_model=PhotoUpdateResponse,
)
def update_my_photo(
    payload: PhotoUpdateRequest,
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Alta, cambio o borrado de la propia foto de perfil.

    Cualquier usuario autenticado puede cambiar solo la suya: el destinatario
    sale del token, nunca del body.
    """
    current_user.photo = payload.photo
    db.commit()
    db.refresh(current_user)

    return PhotoUpdateResponse(photo=current_user.photo)


@router.patch(
    "/doctor/me/profile",
    response_model=OwnProfileDoctorResponse,
)
def update_doctor_bio(
    bio: str | None = None,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Medico edita su propia bio. Solo la bio es editable por el medico."""
    if bio is not None:
        bio = bio.strip()
        if not bio:
            bio = None

    current_doctor.bio = bio
    db.commit()
    db.refresh(current_doctor)

    return OwnProfileDoctorResponse(
        id=current_doctor.user_id,
        user_id=current_doctor.user_id,
        email=current_doctor.user.email,
        first_name=current_doctor.user.first_name,
        last_name=current_doctor.user.last_name,
        photo=current_doctor.user.photo,
        role=Role.DOCTOR.value,
        specialty=current_doctor.specialty,
        license_number=current_doctor.license_number,
        bio=current_doctor.bio,
        is_active=current_doctor.is_active,
        created_at=current_doctor.created_at,
    )