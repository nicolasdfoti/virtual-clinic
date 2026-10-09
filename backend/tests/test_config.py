"""Tests de configuracion.

Se focusan en los casos que rompen el arranque, porque un error de parseo de
variables de entorno deja la app sin levantar y sin un mensaje util.
"""
import pytest
from pydantic import ValidationError

from app.core.config import MIN_SECRET_KEY_LENGTH, Settings

VALID_ENV = {
    "DATABASE_URL": "sqlite:///:memory:",
    "SECRET_KEY": "x" * MIN_SECRET_KEY_LENGTH,
}


def build_settings(**overrides) -> Settings:
    return Settings(**{**VALID_ENV, **overrides})


def test_cors_origins_acepta_csv_plano():
    """Regresion: sin NoDecode, pydantic-settings intenta parsear el valor
    del entorno como JSON y un "a,b" plano levanta SettingsError."""
    settings = build_settings(CORS_ORIGINS="http://localhost:5173")

    assert settings.CORS_ORIGINS == ["http://localhost:5173"]


def test_cors_origins_parte_multiples_y_saca_espacios():
    settings = build_settings(
        CORS_ORIGINS=(
            "http://localhost:5173, https://app.clinicavirtual.com ,"
            "https://admin.clinicavirtual.com"
        )
    )

    assert settings.CORS_ORIGINS == [
        "http://localhost:5173",
        "https://app.clinicavirtual.com",
        "https://admin.clinicavirtual.com",
    ]


def test_cors_origins_acepta_lista_de_python():
    """La via usual: tests o codigo que pasa la lista ya armada."""
    settings = build_settings(CORS_ORIGINS=["http://a.test", "http://b.test"])

    assert settings.CORS_ORIGINS == ["http://a.test", "http://b.test"]


def test_secret_key_corta_falla():
    with pytest.raises(ValidationError):
        build_settings(SECRET_KEY="corta")


def test_secret_key_placeholder_falla():
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        build_settings(SECRET_KEY="change_me")


def test_cookie_secure_se_fuerza_en_produccion():
    assert build_settings(ENVIRONMENT="production").cookie_secure is True
    assert build_settings(ENVIRONMENT="production", COOKIE_SECURE=False).cookie_secure is True


def test_cookie_secure_respeta_el_flag_en_desarrollo():
    assert build_settings(ENVIRONMENT="development", COOKIE_SECURE=False).cookie_secure is False
    assert build_settings(ENVIRONMENT="development", COOKIE_SECURE=True).cookie_secure is True


def test_importar_app_models_registra_las_tablas():
    """Regresion: con app/models/__init__.py vacio, `import app.models` no
    registraba nada y Base.metadata.create_all() creaba cero tablas sin
    fallar."""
    from app.database import Base
    import app.models  # noqa: F401

    assert "users" in Base.metadata.tables
    assert "doctors" in Base.metadata.tables
    assert "patient_profiles" in Base.metadata.tables