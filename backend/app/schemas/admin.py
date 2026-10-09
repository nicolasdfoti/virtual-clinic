from datetime import datetime

from pydantic import BaseModel, EmailStr


class AdminPatientResponse(BaseModel):
    """Fila del listado de pacientes para el admin.

    Solo campos administrativos. El DNI y la obra social viven aca porque es un
    endpoint especifico de administracion (igual que el perfil del paciente);
    no salen en ningun endpoint publico ni en /auth/me.
    """

    id: int
    first_name: str
    last_name: str
    email: EmailStr
    dni: str | None
    insurance_provider: str | None
    is_active: bool
    created_at: datetime


class AdminPatientListResponse(BaseModel):
    items: list[AdminPatientResponse]
    total: int
    limit: int
    offset: int


class AdminStatsResponse(BaseModel):
    total_patients: int
    active_patients: int
    new_patients_this_month: int
    active_doctors: int
