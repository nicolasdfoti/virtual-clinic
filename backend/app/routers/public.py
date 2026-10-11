from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.doctor import PublicDoctorResponse


router = APIRouter(
    prefix="/public",
    tags=["Public"],
)

DOCTOR_NOT_FOUND = "No encontramos ese médico."


@router.get(
    "/doctors",
    response_model=list[PublicDoctorResponse],
)
def list_public_doctors(db: Session = Depends(get_db)):
    """Directorio publico. Sin autenticacion y sin datos de contacto ni ids:
    solo nombre, especialidad, matricula y presentacion de medicos activos."""
    rows = (
        db.query(Doctor, User)
        .join(User, Doctor.user_id == User.id)
        .filter(
            Doctor.is_active.is_(True),
            User.is_active.is_(True),
        )
        .order_by(User.last_name, User.first_name)
        .all()
    )

    return [
        PublicDoctorResponse(
            id=doctor.id,
            name=f"{user.first_name} {user.last_name}".strip(),
            specialty=doctor.specialty,
            license_number=doctor.license_number,
            bio=doctor.bio,
        )
        for doctor, user in rows
    ]


@router.get(
    "/doctors/{doctor_id}",
    response_model=PublicDoctorResponse,
)
def get_public_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Perfil publico de un medico activo. Sin datos de contacto ni ids de
    usuario: solo lo que hace falta para presentarlo."""
    row = (
        db.query(Doctor, User)
        .join(User, Doctor.user_id == User.id)
        .filter(
            Doctor.id == doctor_id,
            Doctor.is_active.is_(True),
            User.is_active.is_(True),
        )
        .first()
    )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=DOCTOR_NOT_FOUND,
        )

    doctor, user = row

    return PublicDoctorResponse(
        id=doctor.id,
        name=f"{user.first_name} {user.last_name}".strip(),
        specialty=doctor.specialty,
        license_number=doctor.license_number,
        bio=doctor.bio,
    )
