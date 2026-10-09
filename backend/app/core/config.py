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

# `lax` evita que el cookie viaje en POST cross-site (CSRF basico) y sigue
# funcionando con la redireccion de Vite en dev. Si en el futuro hay dominios
# distintos para API y front, hay que pasar a `none` + Secure, lo que obliga a
# agregar proteccion CSRF explicita.
ACCESS_TOKEN_COOKIE_SAMESITE = "lax"

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

    @property
    def cookie_secure(self) -> bool:
        if self.ENVIRONMENT == "production":
            return True

        return self.COOKIE_SECURE


@lru_cache
def get_settings() -> Settings:
    return Settings()