from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


MIN_SECRET_KEY_LENGTH = 32

ALGORITHM = "HS256"

# Zona de la clinica. Se usa para calcular "hoy" en validaciones (por ejemplo
# que la fecha de nacimiento no sea futura) y, mas adelante, para armar turnos.
CLINIC_TIMEZONE = "America/Argentina/Buenos_Aires"

ACCESS_TOKEN_COOKIE_NAME = "access_token"

ACCESS_TOKEN_COOKIE_PATH = "/"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = Field(
        ...,
        description="URL de conexion. La sobreescribe alembic/env.py y los tests.",
    )
    SECRET_KEY: str = Field(
        ...,
        min_length=MIN_SECRET_KEY_LENGTH,
        description=(
            "Clave de firma JWT. Sin valor por defecto: generar una real "
            "con `python -c \"import secrets; print(secrets.token_urlsafe(48))\"`."
        ),
    )
    ENVIRONMENT: str = Field(
        default="development",
        description="development | testing | production",
    )
    COOKIE_SECURE: bool = Field(
        default=False,
        description=(
            "En True la cookie solo viaja por HTTPS. En produccion tiene que "
            "ser True; la app lo fuerza si ENVIRONMENT=production."
        ),
    )
    # `NoDecode` es necesario: sin el, pydantic-settings intenta parsear el
    # valor del entorno como JSON antes de correr los validadores, y un
    # "a,b" plano (que es lo que naturalmente se escribe en el .env) revienta con
    # SettingsError en vez de llegar a split_origins.
    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"],
        description="Origenes permitidos. Separados por coma en el .env.",
    )
    SQL_ECHO: bool = Field(
        default=False,
        description="Loguear el SQL. Nunca True en produccion.",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        gt=0,
    )
    # `lax` evita que la cookie viaje en POST cross-site (CSRF basico) y sigue
    # funcionando con la redireccion de Vite en dev. Con frontend (Vercel) y API
    # (Render) en dominios distintos hay que usar `none` + Secure, lo que obliga
    # a que el middleware de Origin sea estricto (ver OriginCheckMiddleware).
    ACCESS_TOKEN_COOKIE_SAMESITE: str = Field(
        default="lax",
        description="lax | strict | none. Con dominios distintos usar 'none' (exige Secure).",
    )

    # Leyenda legal al pie de recetas/ordenes (configurable por entorno).
    # Si no se setea, usa el valor por defecto "Indicacion medica".
    PDF_FOOTER_LEGEND: str = Field(
        default="Indicacion medica",
        description="Texto al pie del PDF de recetas/ordenes. Ej: 'Receta electronica valida segun Ley 27.553'",
    )

    # Directorio de almacenamiento para PDFs (fuera de lo servido estaticamente).
    # En Windows con Control de Aplicaciones, usar ruta absoluta sin espacios.
    STORAGE_DIR: str = Field(
        default="storage",
        description="Directorio base para almacenar PDFs generados. Debe estar fuera de static/",
    )

    # Visibilidad de la historia clinica para el paciente. Por defecto el
    # paciente NO ve las notas del medico (dato sensible: la nota es material
    # de trabajo clinico, no un resumen para el paciente). Se habilita por
    # entorno cuando la clinica lo decide.
    PATIENT_VISIBLE_NOTES: bool = Field(
        default=False,
        description="Si es True, el paciente puede listar y leer las notas clinicas.",
    )

    # Tamano maximo de los archivos que sube el paciente (en MB).
    MAX_FILE_SIZE_MB: int = Field(
        default=10,
        gt=0,
        description="Tamano maximo aceptado para PatientFile, en MB.",
    )

    # Storage URI para rate limiting (redis://... o memory:// para desarrollo).
    RATE_LIMIT_STORAGE_URI: str = Field(
        default="memory://",
        description="URI de almacenamiento para rate limiting (redis://host:port o memory://).",
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def reject_placeholder_secret(cls, value: str) -> str:
        if value.strip().lower() in {"change_me", "changeme"}:
            raise ValueError(
                "SECRET_KEY sigue siendo el valor de ejemplo de .env.example. "
                "Generá una real antes de arrancar."
            )

        return value

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [
                origin.strip()
                for origin in value.split(",")
                if origin.strip()
            ]

        return value

    @field_validator("ACCESS_TOKEN_COOKIE_SAMESITE")
    @classmethod
    def validate_samesite(cls, value: str) -> str:
        normalized = value.strip().lower()

        if normalized not in {"lax", "strict", "none"}:
            raise ValueError(
                "ACCESS_TOKEN_COOKIE_SAMESITE debe ser 'lax', 'strict' o 'none'."
            )

        return normalized

    @property
    def cookie_secure(self) -> bool:
        if self.ENVIRONMENT == "production":
            return True

        return self.COOKIE_SECURE

    @property
    def cookie_samesite(self) -> str:
        # SameSite=None sin Secure el navegador descarta la cookie; en dev no
        # hay HTTPS, asi que degradamos a lax en vez de romper la sesion.
        if self.ACCESS_TOKEN_COOKIE_SAMESITE == "none" and not self.cookie_secure:
            return "lax"

        return self.ACCESS_TOKEN_COOKIE_SAMESITE


@lru_cache
def get_settings() -> Settings:
    return Settings()