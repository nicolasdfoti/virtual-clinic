from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import Role


MIN_PASSWORD_LENGTH = 8

# bcrypt trunca silenciosamente en 72 bytes: una clave mas larga no falla, se
# corta y dos passwords distintos pueden terminar dando el mismo hash. Por eso
# se rechaza en vez de truncar.
MAX_PASSWORD_BYTES = 72

MIN_NAME_LENGTH = 1
MAX_NAME_LENGTH = 100


def normalize_email(email: str) -> str:
    """Los emails se comparan y guardan siempre en minusculas.

    Sin esto, `Ana@Mail.com` y `ana@mail.com`arian dos cuentas distintas
    porque el indice unico de Postgres es case-sensitive.
    """
    return email.strip().lower()


def _validate_name(value: str, field_name: str) -> str:
    stripped = value.strip()

    if len(stripped) < MIN_NAME_LENGTH:
        raise ValueError(f"{field_name} no puede estar vacío.")

    if len(stripped) > MAX_NAME_LENGTH:
        raise ValueError(
            f"{field_name} no puede superar los {MAX_NAME_LENGTH} caracteres."
        )

    return stripped


def _validate_password(value: str) -> str:
    if len(value) < MIN_PASSWORD_LENGTH:
        raise ValueError(
            f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres."
        )

    if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError(
            f"La contraseña no puede superar los {MAX_PASSWORD_BYTES} bytes."
        )

    return value


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

    @field_validator("email")
    @classmethod
    def email_to_lowercase(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("password")
    @classmethod
    def password_within_limits(cls, value: str) -> str:
        return _validate_password(value)

    @field_validator("first_name")
    @classmethod
    def first_name_stripped(cls, value: str) -> str:
        return _validate_name(value, "El nombre")

    @field_validator("last_name")
    @classmethod
    def last_name_stripped(cls, value: str) -> str:
        return _validate_name(value, "El apellido")

    # `role` no forma parte del schema: si el cliente manda un role, Pydantic
    # lo ignora y el endpoint asigna siempre PATIENT. Un usuario no puede
    # auto-asignarse ADMIN ni siquiera manipulando el body del POST.
    model_config = ConfigDict(extra="ignore")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def email_to_lowercase(cls, value: str) -> str:
        return normalize_email(value)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    role: Role
    is_active: bool

    model_config = ConfigDict(from_attributes=True)