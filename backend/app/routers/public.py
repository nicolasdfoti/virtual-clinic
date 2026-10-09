from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.doctor import PublicDoctorResponse


router = APIRouter(
    prefix="/public",
    tags=["Public"],
)


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
