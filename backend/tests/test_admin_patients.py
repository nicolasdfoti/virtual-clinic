"""Tests de /api/admin/patients: filtros, paginación y forma de la respuesta."""
from datetime import datetime, timezone

import pytest

from app.models.enums import Role
from app.models.patient_profile import PatientProfile
from app.models.user import User

from tests.conftest import create_user, login_as


PATIENTS_PATH = "/api/admin/patients"

ALLOWED_FIELDS = {
    "id",
    "first_name",
    "last_name",
    "email",
    "dni",
    "insurance_provider",
    "is_active",
    "created_at",
}


def create_patient(
    session,
    email: str,
    first_name: str = "Paciente",
    last_name: str = "Demo",
    is_active: bool = True,
    dni: str | None = None,
    insurance_provider: str | None = None,
    assigned_doctor_id: int | None = None,
) -> User:
    user = create_user(
        session,
        email=email,
        first_name=first_name,
        last_name=last_name,
        is_active=is_active,
    )

    profile = PatientProfile(
        user_id=user.id,
        dni=dni,
        insurance_provider=insurance_provider,
        assigned_doctor_id=assigned_doctor_id,
    )

    session.add(profile)
    session.commit()
    session.refresh(user)

    return user


def test_paginacion_y_total(client, db_session, admin_user):
    login_as(client, admin_user)

    for index in range(3):
        create_patient(db_session, email=f"p{index}@example.com")

    first_page = client.get(PATIENTS_PATH, params={"limit": 2, "offset": 0})

    assert first_page.status_code == 200

    body = first_page.json()

    assert body["total"] == 3
    assert body["limit"] == 2
    assert body["offset"] == 0
    assert len(body["items"]) == 2

    second_page = client.get(PATIENTS_PATH, params={"limit": 2, "offset": 2})

    assert len(second_page.json()["items"]) == 1


def test_limit_mayor_a_100_da_422(client, admin_user):
    login_as(client, admin_user)

    assert client.get(PATIENTS_PATH, params={"limit": 101}).status_code == 422


def test_filtro_q_por_nombre_email_y_dni(client, db_session, admin_user):
    login_as(client, admin_user)

    create_patient(
        db_session,
        email="ana@example.com",
        first_name="Ana",
        last_name="Ruiz",
        dni="12345678",
    )
    create_patient(
        db_session,
        email="juan@example.com",
        first_name="Juan",
        last_name="Pérez",
        dni="87654321",
    )

    by_name = client.get(PATIENTS_PATH, params={"q": "Ana"}).json()
    assert {item["email"] for item in by_name["items"]} == {"ana@example.com"}

    by_email = client.get(PATIENTS_PATH, params={"q": "juan@"}).json()
    assert {item["email"] for item in by_email["items"]} == {"juan@example.com"}

    by_dni = client.get(PATIENTS_PATH, params={"q": "87654321"}).json()
    assert {item["email"] for item in by_dni["items"]} == {"juan@example.com"}


def test_filtro_insurance_provider(client, db_session, admin_user):
    login_as(client, admin_user)

    create_patient(
        db_session,
        email="a@example.com",
        insurance_provider="OSDE",
    )
    create_patient(
        db_session,
        email="b@example.com",
        insurance_provider="Particular",
    )

    response = client.get(PATIENTS_PATH, params={"insurance_provider": "osde"})

    assert {item["email"] for item in response.json()["items"]} == {
        "a@example.com"
    }


def test_filtro_is_active(client, db_session, admin_user):
    login_as(client, admin_user)

    create_patient(db_session, email="activo@example.com")
    create_patient(db_session, email="inactivo@example.com", is_active=False)

    response = client.get(PATIENTS_PATH, params={"is_active": "false"})

    assert {item["email"] for item in response.json()["items"]} == {
        "inactivo@example.com"
    }


def test_filtro_doctor_id(client, db_session, admin_user, doctor_user):
    login_as(client, admin_user)

    other_doctor = create_user(
        db_session,
        email="otro-medico@example.com",
        role=Role.DOCTOR,
    )

    create_patient(
        db_session,
        email="asignado@example.com",
        assigned_doctor_id=doctor_user.id,
    )
    create_patient(db_session, email="suelto@example.com")

    response = client.get(
        PATIENTS_PATH,
        params={"doctor_id": doctor_user.id},
    )

    assert {item["email"] for item in response.json()["items"]} == {
        "asignado@example.com"
    }

    assert other_doctor.id != doctor_user.id


def test_filtro_rango_created_at(client, db_session, admin_user):
    login_as(client, admin_user)

    old = create_patient(db_session, email="viejo@example.com")
    old.created_at = datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)

    recent = create_patient(db_session, email="reciente@example.com")
    recent.created_at = datetime(2026, 2, 15, 12, 0, tzinfo=timezone.utc)

    db_session.commit()

    response = client.get(
        PATIENTS_PATH,
        params={"created_from": "2026-02-01", "created_to": "2026-02-28"},
    )

    assert {item["email"] for item in response.json()["items"]} == {
        "reciente@example.com"
    }


def test_orden_por_apellido(client, db_session, admin_user):
    login_as(client, admin_user)

    create_patient(db_session, email="z@example.com", last_name="Zarate")
    create_patient(db_session, email="a@example.com", last_name="Alvarez")

    response = client.get(
        PATIENTS_PATH,
        params={"sort": "last_name", "order": "asc"},
    )

    last_names = [item["last_name"] for item in response.json()["items"]]

    assert last_names == ["Alvarez", "Zarate"]


def test_solo_expone_campos_administrativos(client, db_session, admin_user):
    login_as(client, admin_user)

    create_patient(db_session, email="ana@example.com", dni="12345678")

    item = client.get(PATIENTS_PATH).json()["items"][0]

    assert set(item.keys()) == ALLOWED_FIELDS


@pytest.mark.parametrize("role", [Role.DOCTOR, Role.PATIENT])
def test_solo_admin_lista_pacientes(client, db_session, role):
    user = create_user(
        db_session,
        email=f"{role.value.lower()}-p@example.com",
        role=role,
    )
    login_as(client, user)

    assert client.get(PATIENTS_PATH).status_code == 403


def test_sin_sesion_da_401(client):
    assert client.get(PATIENTS_PATH).status_code == 401
