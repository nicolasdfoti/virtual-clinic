"""Tests de GET /api/profiles/{user_id}: visibilidad por rol y discriminador.

El perfil ajeno lo consumen el admin (listado de pacientes/médicos) y el
médico. La respuesta trae `type` para que el frontend sepa cómo renderizarla.
"""
import pytest

from app.models.enums import Role
from app.models.patient_profile import PatientProfile

from tests.conftest import create_doctor, create_user, login_as


PROFILES_PATH = "/api/profiles"


def create_patient(session, email: str, **profile_kwargs) -> object:
    user = create_user(session, email=email)
    profile = PatientProfile(user_id=user.id, **profile_kwargs)
    session.add(profile)
    session.commit()
    session.refresh(user)

    return user


def test_admin_ve_paciente_con_type_patient(client, db_session, admin_user):
    login_as(client, admin_user)
    patient = create_patient(
        db_session,
        email="paciente@example.com",
        dni="12345678",
        insurance_provider="OSDE",
    )

    response = client.get(f"{PROFILES_PATH}/{patient.id}")

    assert response.status_code == 200

    body = response.json()

    assert body["type"] == "patient"
    assert body["user_id"] == patient.id
    assert body["email"] == "paciente@example.com"
    assert body["dni"] == "12345678"


def test_admin_ve_medico_con_type_doctor(client, db_session, admin_user):
    login_as(client, admin_user)
    doctor_user = create_user(
        db_session,
        email="medico@example.com",
        role=Role.DOCTOR,
    )
    create_doctor(db_session, doctor_user, license_number="MP 200")

    response = client.get(f"{PROFILES_PATH}/{doctor_user.id}")

    assert response.status_code == 200

    body = response.json()

    assert body["type"] == "doctor"
    assert body["user_id"] == doctor_user.id
    assert body["license_number"] == "MP 200"


def test_admin_ve_admin_con_type_admin(client, db_session, admin_user):
    login_as(client, admin_user)
    other_admin = create_user(
        db_session,
        email="otro-admin@example.com",
        role=Role.ADMIN,
    )

    response = client.get(f"{PROFILES_PATH}/{other_admin.id}")

    assert response.status_code == 200
    assert response.json()["type"] == "admin"


def test_paciente_ve_medico(client, db_session):
    patient = create_user(db_session, email="paciente@example.com")

    doctor_user = create_user(
        db_session,
        email="medico@example.com",
        role=Role.DOCTOR,
    )
    create_doctor(db_session, doctor_user)

    login_as(client, patient)

    response = client.get(f"{PROFILES_PATH}/{doctor_user.id}")

    assert response.status_code == 200
    assert response.json()["type"] == "doctor"


def test_medico_ve_paciente(client, db_session, doctor_user):
    login_as(client, doctor_user)
    patient = create_patient(db_session, email="paciente@example.com")

    response = client.get(f"{PROFILES_PATH}/{patient.id}")

    assert response.status_code == 200

    body = response.json()

    assert body["type"] == "patient"
    assert body["user_id"] == patient.id


@pytest.mark.parametrize("target_role", [Role.PATIENT, Role.ADMIN])
def test_paciente_no_ve_paciente_ni_admin(client, db_session, target_role):
    viewer = create_user(db_session, email="viewer@example.com")
    target = create_user(
        db_session,
        email=f"target-{target_role.value.lower()}@example.com",
        role=target_role,
    )

    login_as(client, viewer)

    assert client.get(f"{PROFILES_PATH}/{target.id}").status_code == 404


def test_propio_perfil_por_id_da_404(client, db_session, admin_user):
    login_as(client, admin_user)

    assert client.get(f"{PROFILES_PATH}/{admin_user.id}").status_code == 404


def test_usuario_inexistente_da_404(client, admin_user):
    login_as(client, admin_user)

    assert client.get(f"{PROFILES_PATH}/999999").status_code == 404


def test_id_no_numerico_da_422(client, admin_user):
    login_as(client, admin_user)

    assert client.get(f"{PROFILES_PATH}/abc").status_code == 422


def test_sin_sesion_da_401(client, db_session, admin_user):
    assert client.get(f"{PROFILES_PATH}/{admin_user.id}").status_code == 401
