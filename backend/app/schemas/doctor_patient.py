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


class DoctorPatientListItem(BaseModel):
    """Fila del listado de pacientes del medico.

    `next_appointment` queda en None hasta que exista la agenda: no se inventa
    un turno que la plataforma todavia no agenda.
    """

    id: int
    first_name: str
    last_name: str
    dni: str | None = None
    insurance_provider: str | None = None
    next_appointment: datetime | None = None


class DoctorPatientListResponse(BaseModel):
    items: list[DoctorPatientListItem]
    total: int
    limit: int
    offset: int


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
