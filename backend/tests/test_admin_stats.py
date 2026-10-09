"""Tests de /api/admin/stats."""
from datetime import datetime, timedelta, timezone

import pytest

from app.models.enums import Role
from app.models.user import User

from tests.conftest import create_user, login_as


STATS_PATH = "/api/admin/stats"


def test_stats_cuentan_pacientes_y_medicos(
    client,
    db_session,
    admin_user,
    doctor_user,
):
    login_as(client, admin_user)

    create_user(db_session, email="p1@example.com", role=Role.PATIENT)
    create_user(db_session, email="p2@example.com", role=Role.PATIENT)
    inactive_patient = create_user(
        db_session,
        email="p3@example.com",
        role=Role.PATIENT,
        is_active=False,
    )

    old_patient = create_user(
        db_session,
        email="viejo@example.com",
        role=Role.PATIENT,
    )
    old_patient.created_at = datetime.now(timezone.utc) - timedelta(days=60)
    db_session.commit()

    inactive_doctor = create_user(
        db_session,
        email="medico-off@example.com",
        role=Role.DOCTOR,
        is_active=False,
    )
    db_session.commit()

    assert inactive_patient.is_active is False
    assert inactive_doctor.is_active is False

    body = client.get(STATS_PATH).json()

    assert body["total_patients"] == 4
    assert body["active_patients"] == 3
    assert body["new_patients_this_month"] == 3
    # doctor_user (activo) + medico-off (inactivo): cuenta solo el activo.
    assert body["active_doctors"] == 1


@pytest.mark.parametrize("role", [Role.DOCTOR, Role.PATIENT])
def test_stats_solo_admin(client, db_session, role):
    user = create_user(
        db_session,
        email=f"{role.value.lower()}-s@example.com",
        role=role,
    )
    login_as(client, user)

    assert client.get(STATS_PATH).status_code == 403


def test_stats_sin_sesion_da_401(client):
    assert client.get(STATS_PATH).status_code == 401
