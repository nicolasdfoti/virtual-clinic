"""Schemas para perfiles de usuario segun rol del visor.

Define que campos se exponen segun quien mira y a quien mira.
"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr


# ===== Perfil propio (GET /api/profiles/me) =====


class OwnProfilePatientResponse(BaseModel):
    """Perfil propio de un paciente."""

    id: int
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    role: str  # "PATIENT"
    dni: str | None = None
    birth_date: date | None = None
    sex: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    insurance_provider: str | None = None
    insurance_plan: str | None = None
    insurance_member_number: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    is_complete: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class OwnProfileDoctorResponse(BaseModel):
    """Perfil propio de un medico."""

    id: int
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    role: str  # "DOCTOR"
    specialty: str
    license_number: str
    bio: str | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OwnProfileAdminResponse(BaseModel):
    """Perfil propio de un admin."""

    id: int
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    role: str  # "ADMIN"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===== Perfil de otro usuario (GET /api/profiles/{user_id}) =====


class PublicDoctorProfileResponse(BaseModel):
    """Perfil publico de un medico (visible para pacientes)."""

    type: Literal["doctor"] = "doctor"
    id: int
    user_id: int
    first_name: str
    last_name: str
    specialty: str
    license_number: str
    bio: str | None = None

    model_config = ConfigDict(from_attributes=True)


class DoctorViewOfPatientProfileResponse(BaseModel):
    """Perfil de paciente visto por medico/admin (con datos sensibles)."""

    type: Literal["patient"] = "patient"
    id: int
    user_id: int
    email: str
    first_name: str
    last_name: str
    dni: str | None = None
    birth_date: date | None = None
    sex: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    insurance_provider: str | None = None
    insurance_plan: str | None = None
    insurance_member_number: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    is_complete: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminViewOfDoctorProfileResponse(BaseModel):
    """Perfil de medico visto por admin (incluye email y estado).

    Se reutiliza para mostrar un admin: en ese caso `type` viaja como "admin".
    """

    type: Literal["doctor", "admin"] = "doctor"
    id: int
    user_id: int
    email: str
    first_name: str
    last_name: str
    specialty: str
    license_number: str
    bio: str | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminViewOfPatientProfileResponse(BaseModel):
    """Perfil de paciente visto por admin (incluye email y DNI)."""

    type: Literal["patient"] = "patient"
    id: int
    user_id: int
    email: str
    first_name: str
    last_name: str
    dni: str | None = None
    birth_date: date | None = None
    sex: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    insurance_provider: str | None = None
    insurance_plan: str | None = None
    insurance_member_number: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    is_complete: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)