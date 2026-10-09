import re
from datetime import date, datetime
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import CLINIC_TIMEZONE


MAX_SEX_LENGTH = 30
MAX_PHONE_LENGTH = 30
MAX_ADDRESS_LENGTH = 200
MAX_CITY_LENGTH = 100
MAX_INSURANCE_PROVIDER_LENGTH = 120
MAX_INSURANCE_PLAN_LENGTH = 120
MAX_INSURANCE_MEMBER_LENGTH = 60
MAX_CONTACT_NAME_LENGTH = 120

DNI_PATTERN = re.compile(r"^\d{7,8}$")

# Telefono "razonable": solo digitos y separadores habituales (+, -, parentesis
# y espacios) y al menos 6 digitos reales. No se exige un formato exacto porque
# los numeros argentinos varian (0/15/11, con o sin guiones).
PHONE_ALLOWED_PATTERN = re.compile(r"^[0-9+\-()\s]+$")
MIN_PHONE_DIGITS = 6


def _clinic_today() -> date:
    return datetime.now(ZoneInfo(CLINIC_TIMEZONE)).date()


class PatientProfileUpdate(BaseModel):
    """Body del PUT. Todos los campos son opcionales y las cadenas vacias se
    normalizan a NULL: el formulario manda "" cuando el paciente deja un campo
    en blanco."""

    dni: str | None = Field(default=None, max_length=8)
    birth_date: date | None = None
    sex: str | None = Field(default=None, max_length=MAX_SEX_LENGTH)
    phone: str | None = Field(default=None, max_length=MAX_PHONE_LENGTH)
    address: str | None = Field(default=None, max_length=MAX_ADDRESS_LENGTH)
    city: str | None = Field(default=None, max_length=MAX_CITY_LENGTH)
    insurance_provider: str | None = Field(
        default=None,
        max_length=MAX_INSURANCE_PROVIDER_LENGTH,
    )
    insurance_plan: str | None = Field(
        default=None,
        max_length=MAX_INSURANCE_PLAN_LENGTH,
    )
    insurance_member_number: str | None = Field(
        default=None,
        max_length=MAX_INSURANCE_MEMBER_LENGTH,
    )
    emergency_contact_name: str | None = Field(
        default=None,
        max_length=MAX_CONTACT_NAME_LENGTH,
    )
    emergency_contact_phone: str | None = Field(
        default=None,
        max_length=MAX_PHONE_LENGTH,
    )

    @field_validator("*", mode="before")
    @classmethod
    def blank_strings_to_none(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None

        return value

    @field_validator("dni")
    @classmethod
    def validate_dni(cls, value: str | None) -> str | None:
        if value is None:
            return None

        if not DNI_PATTERN.match(value):
            raise ValueError("El DNI debe tener entre 7 y 8 dígitos, sin puntos.")

        return value

    @field_validator("birth_date")
    @classmethod
    def validate_birth_date(cls, value: date | None) -> date | None:
        if value is None:
            return None

        if value > _clinic_today():
            raise ValueError("La fecha de nacimiento no puede ser futura.")

        return value

    @field_validator("phone", "emergency_contact_phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None

        digits = sum(character.isdigit() for character in value)

        if not PHONE_ALLOWED_PATTERN.match(value) or digits < MIN_PHONE_DIGITS:
            raise ValueError("Ingresá un teléfono válido.")

        return value


class PatientProfileResponse(BaseModel):
    """Perfil tal como lo ve su dueño. Cuando todavia no existe fila se
    responde un perfil vacio con `id`/timestamps en None e `is_complete=false`.
    """

    id: int | None = None
    user_id: int
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
