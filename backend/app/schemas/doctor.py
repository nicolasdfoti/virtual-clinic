from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.schemas.user import _validate_name, normalize_email


MAX_SPECIALTY_LENGTH = 100
MAX_LICENSE_LENGTH = 50
MAX_BIO_LENGTH = 1000


def _validate_specialty(value: str) -> str:
    stripped = value.strip()

    if not stripped:
        raise ValueError("La especialidad no puede estar vacía.")

    if len(stripped) > MAX_SPECIALTY_LENGTH:
        raise ValueError(
            f"La especialidad no puede superar los {MAX_SPECIALTY_LENGTH} "
            "caracteres."
        )

    return stripped


def _validate_license(value: str) -> str:
    stripped = value.strip()

    if not stripped:
        raise ValueError("La matrícula no puede estar vacía.")

    if len(stripped) > MAX_LICENSE_LENGTH:
        raise ValueError(
            f"La matrícula no puede superar los {MAX_LICENSE_LENGTH} "
            "caracteres."
        )

    return stripped


def _validate_bio(value: str | None) -> str | None:
    if value is None:
        return None

    stripped = value.strip()

    if not stripped:
        return None

    if len(stripped) > MAX_BIO_LENGTH:
        raise ValueError(
            f"La presentación no puede superar los {MAX_BIO_LENGTH} "
            "caracteres."
        )

    return stripped


class DoctorCreate(BaseModel):
    """Alta de médico por parte del admin.

    La contraseña no viaja en el body: la genera el servidor y solo se expone
    una vez en la respuesta del alta.
    """

    email: EmailStr
    first_name: str
    last_name: str
    specialty: str
    license_number: str
    bio: str | None = None

    @field_validator("email")
    @classmethod
    def email_to_lowercase(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("first_name")
    @classmethod
    def first_name_stripped(cls, value: str) -> str:
        return _validate_name(value, "El nombre")

    @field_validator("last_name")
    @classmethod
    def last_name_stripped(cls, value: str) -> str:
        return _validate_name(value, "El apellido")

    @field_validator("specialty")
    @classmethod
    def specialty_stripped(cls, value: str) -> str:
        return _validate_specialty(value)

    @field_validator("license_number")
    @classmethod
    def license_stripped(cls, value: str) -> str:
        return _validate_license(value)

    @field_validator("bio")
    @classmethod
    def bio_stripped(cls, value: str | None) -> str | None:
        return _validate_bio(value)

    model_config = ConfigDict(extra="ignore")


class DoctorProfileCreate(BaseModel):
    """El admin se habilita a si mismo como medico: sin email ni nombre porque
    ya los tiene en su propia cuenta."""

    specialty: str
    license_number: str
    bio: str | None = None

    @field_validator("specialty")
    @classmethod
    def specialty_stripped(cls, value: str) -> str:
        return _validate_specialty(value)

    @field_validator("license_number")
    @classmethod
    def license_stripped(cls, value: str) -> str:
        return _validate_license(value)

    @field_validator("bio")
    @classmethod
    def bio_stripped(cls, value: str | None) -> str | None:
        return _validate_bio(value)

    model_config = ConfigDict(extra="ignore")


class DoctorUpdate(BaseModel):
    """Edicion parcial. Solo se aplican los campos presentes en el body, asi
    que `exclude_unset=True` es lo que permite distinguir "no lo mandes" de
    "pone null" (por ejemplo, borrar la bio)."""

    first_name: str | None = None
    last_name: str | None = None
    specialty: str | None = None
    license_number: str | None = None
    bio: str | None = None

    @field_validator("first_name")
    @classmethod
    def first_name_stripped(cls, value: str | None) -> str | None:
        return None if value is None else _validate_name(value, "El nombre")

    @field_validator("last_name")
    @classmethod
    def last_name_stripped(cls, value: str | None) -> str | None:
        return None if value is None else _validate_name(value, "El apellido")

    @field_validator("specialty")
    @classmethod
    def specialty_stripped(cls, value: str | None) -> str | None:
        return None if value is None else _validate_specialty(value)

    @field_validator("license_number")
    @classmethod
    def license_stripped(cls, value: str | None) -> str | None:
        return None if value is None else _validate_license(value)

    @field_validator("bio")
    @classmethod
    def bio_stripped(cls, value: str | None) -> str | None:
        return _validate_bio(value)

    model_config = ConfigDict(extra="ignore")


class DoctorResponse(BaseModel):
    """Vista administrativa del medico: incluye email y estado de la cuenta."""

    id: int
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    specialty: str
    license_number: str
    bio: str | None
    is_active: bool
    created_at: datetime


class DoctorCreatedResponse(DoctorResponse):
    """Respuesta del alta. La contraseña temporal va una sola vez y nunca se
    loguea ni se vuelve a exponer."""

    temporary_password: str


class PublicDoctorResponse(BaseModel):
    """Lo unico visible sin autenticacion. Incluye id para reserva de turnos.
    Sin email, sin telefono: solo lo que hace falta para presentar al profesional."""

    id: int
    name: str
    specialty: str
    license_number: str
    bio: str | None
