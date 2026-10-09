"""Tests de integracion con Alembic.

Las migraciones del proyecto corren solo en PostgreSQL (`7f3c1a9b4d21` y
`e3f4c1b20d33` abortan en otro dialecto). La suite por defecto usa SQLite, que
no puede aplicarlas: por eso el test de igualdad con los modelos requiere
`TEST_DATABASE_URL` (Postgres), y aca se cubre ademas la generacion offline
del SQL sin necesidad de base.

Regla del proyecto (AGENTS.md): `alembic upgrade head` sobre base vacia debe
dejar el esquema igual a los modelos.
"""
import os
import subprocess
import sys

import pytest

from tests.conftest import TEST_DATABASE_URL, USING_SQLITE


BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _run_alembic(*args: str, database_url: str) -> subprocess.CompletedProcess:
    """Corre alembic apuntando a `database_url`. El entorno de test ya define
    SECRET_KEY/ENVIRONMENT, pero se reenvian para que la app arranque sin
    depender de un .env del host."""
    return subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        env={
            **os.environ,
            "DATABASE_URL": database_url,
            "SECRET_KEY": "test-only-secret-key-not-used-anywhere",
            "ENVIRONMENT": "testing",
        },
    )


def test_offline_upgrade_genera_el_esquema_de_doctors_y_users():
    """Smoke sin base real: `alembic upgrade head --sql` con URL postgres.

    No abre conexiones (modo offline), pero valida que las migraciones se
    encadenan y emiten el DDL esperado: tabla doctors con sus index unicos,
    los defaults y las columnas nuevas de users.
    """
    result = _run_alembic(
        "upgrade",
        "head",
        "--sql",
        database_url="postgresql+psycopg://user:pass@localhost:5432/offline_check",
    )

    assert result.returncode == 0, result.stderr

    sql = result.stdout + result.stderr

    assert "CREATE TABLE doctors" in sql
    assert "license_number" in sql
    assert "specialty" in sql
    assert "consultation_minutes" in sql
    assert "ix_doctors_user_id" in sql
    assert "ix_doctors_license_number" in sql
    # Columnas de auth nuevas en users.
    assert "must_change_password" in sql
    assert "token_version" in sql
    # FK one-to-one contra users.
    assert "REFERENCES users (id)" in sql
    # Tabla de perfil de paciente.
    assert "CREATE TABLE patient_profiles" in sql
    assert "ix_patient_profiles_user_id" in sql
    assert "ix_patient_profiles_dni" in sql
    assert "insurance_provider" in sql
    assert "emergency_contact_phone" in sql
    # Relacion administrativa con el medico asignado.
    assert "assigned_doctor_id" in sql
    assert "ix_patient_profiles_assigned_doctor_id" in sql
    # Vinculo medico-paciente.
    assert "CREATE TABLE care_relationships" in sql
    assert "care_relationship_status" in sql
    assert "uq_care_relationships_doctor_patient" in sql
    assert "ix_care_relationships_doctor_id" in sql
    assert "ix_care_relationships_patient_id" in sql
    # Trazabilidad.
    assert "CREATE TABLE audit_logs" in sql
    assert "ix_audit_logs_action" in sql
    assert "ix_audit_logs_entity_type" in sql
    assert "ix_audit_logs_created_at" in sql
    # Agenda y turnos.
    assert "doctor_availabilities" in sql
    assert "doctor_time_off" in sql
    assert "appointments" in sql
    assert "exclude_active_appointments" in sql


@pytest.mark.skipif(
    USING_SQLITE,
    reason="requiere TEST_DATABASE_URL apuntando a PostgreSQL",
)
def test_alembic_upgrade_head_en_base_vacia_iguala_los_modelos():
    """El corazon de la regla: migrar una base vacia y que quede identica a
    Base.metadata (tipos, defaults, index y constraints).

    Crea una base temporal al lado de TEST_DATABASE_URL para no ensuciar la de
    test, le aplica `upgrade head` y compara con compare_metadata.
    """
    from sqlalchemy import create_engine, text
    from sqlalchemy.engine.url import make_url

    from alembic.autogenerate import compare_metadata
    from alembic.migration import MigrationContext

    from app.database import Base
    import app.models  # noqa: F401  (registra todos los modelos)

    base_url = make_url(TEST_DATABASE_URL)
    temp_db_name = f"alembic_check_{os.getpid()}"

    # Se conecta al server (db "postgres" existe en instalaciones estandar).
    server_url = base_url.set(database="postgres")
    server_engine = create_engine(
        server_url,
        isolation_level="AUTOCOMMIT",
        pool_pre_ping=True,
    )

    temp_url = base_url.set(database=temp_db_name)

    try:
        with server_engine.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{temp_db_name}"'))
            connection.execute(text(f'CREATE DATABASE "{temp_db_name}"'))

        result = _run_alembic(
            "upgrade",
            "head",
            database_url=temp_url.render_as_string(hide_password=False),
        )

        assert result.returncode == 0, result.stderr

        check_engine = create_engine(temp_url, pool_pre_ping=True)

        with check_engine.connect() as connection:
            # alembic_version es infra de alembic, no un modelo: se la
            # descarta antes de comparar para que no cuente como tabla extra.
            connection.execute(text("DROP TABLE IF EXISTS alembic_version"))

            context = MigrationContext.configure(
                connection,
                opts={
                    "compare_type": True,
                    "compare_server_default": True,
                },
            )
            diffs = compare_metadata(context, Base.metadata)

        assert diffs == [], diffs
    finally:
        with server_engine.connect() as connection:
            connection.execute(
                text(f'DROP DATABASE IF EXISTS "{temp_db_name}" WITH (FORCE)')
            )
        server_engine.dispose()