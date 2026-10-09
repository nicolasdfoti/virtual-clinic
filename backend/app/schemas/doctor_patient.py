from datetime import date, datetime

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

from app.schemas.user import normalize_email


class LinkPatientRequest(BaseModel):
    """Body para vincular un paciente existente. Alcanza con DNI o email."""

    dni: str | None = Field(default=None, max_length=8)
    email: EmailStr | None = None

    @field_validator("dni", mode="before")
    @classmethod
    def blank_to_none(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip() or None

        return value

    @field_validator("email")
    @classmethod
    def normalize(cls, value: str | None) -> str | None:
        return normalize_email(value) if value else None

    @model_validator(mode="after")
    def require_identifier(self) -> "LinkPatientRequest":
        if not self.dni and not self.email:
            raise ValueError("Ingresá el DNI o el email del paciente.")

        return self


class DoctorNextAppointment(BaseModel):
    """Proximo turno del paciente con este medico."""

    id: int
    starts_at: datetime
    ends_at: datetime
    modality: str
    status: str
    reason: str | None = None


class DoctorPatientListItem(BaseModel):
    """Fila del listado de pacientes del medico."""

    id: int
    first_name: str
    last_name: str
    dni: str | None = None
    insurance_provider: str | None = None
    next_appointment: DoctorNextAppointment | None = None


class DoctorPatientListResponse(BaseModel):
    items: list[DoctorPatientListItem]
    total: int
    limit: int
    offset: int


class DoctorAppointmentDetail(BaseModel):
    """Detalle de un turno para el medico."""

    id: int
    patient_id: int
    patient_name: str | None = None
    patient_dni: str | None = None
    starts_at: datetime
    ends_at: datetime
    status: str
    modality: str
    reason: str | None = None
    video_url: str | None = None
    cancelled_by: int | None = None
    cancel_reason: str | None = None
    created_at: datetime


class DoctorPatientDetail(BaseModel):
    """Perfil del paciente en solo lectura para el medico que lo atiende."""

    id: int
    first_name: str
    last_name: str
    email: EmailStr
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
