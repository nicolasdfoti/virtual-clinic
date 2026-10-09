"""Tests de /api/patients/me/profile.

Cubre: perfil vacio, alta/edicion, completitud, validaciones, DNI duplicado,
aislamiento entre pacientes y matriz de roles.
"""
from datetime import date, timedelta

import pytest

from app.core.security import create_access_token
from app.models.enums import Role
from app.models.patient_profile import PatientProfile
from app.models.user import User

from tests.conftest import create_user


PROFILE_PATH = "/api/patients/me/profile"

COMPLETE_PAYLOAD = {
    "dni": "12345678",
    "birth_date": "1990-05-20",
    "sex": "Femenino",
    "phone": "+54 11 5555-5555",
    "address": "Calle 123",
    "city": "CABA",
    "insurance_provider": "OSDE",
    "insurance_plan": "210",
    "insurance_member_number": "123456",
    "emergency_contact_name": "Juan Pérez",
    "emergency_contact_phone": "11 4444-4444",
}


def login_as(client, user: User) -> None:
    client.cookies.set(
        "access_token",
        create_access_token(
            subject=str(user.id),
            token_version=user.token_version,
        ),
    )


def test_get_sin_perfil_devuelve_vacio_y_no_crea_fila(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    response = client.get(PROFILE_PATH)

    assert response.status_code == 200

    body = response.json()

    assert body["user_id"] == patient.id
    assert body["id"] is None
    assert body["dni"] is None
    assert body["is_complete"] is False
    # El GET no debe persistir nada.
    assert db_session.query(PatientProfile).count() == 0


def test_put_completa_el_perfil(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    response = client.put(PROFILE_PATH, json=COMPLETE_PAYLOAD)

    assert response.status_code == 200

    body = response.json()

    assert body["dni"] == "12345678"
    assert body["user_id"] == patient.id
    assert body["insurance_provider"] == "OSDE"
    assert body["emergency_contact_phone"] == "11 4444-4444"
    assert body["is_complete"] is True


def test_put_y_get_son_consistentes(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    client.put(PROFILE_PATH, json=COMPLETE_PAYLOAD)

    response = client.get(PROFILE_PATH)

    assert response.status_code == 200
    assert response.json()["dni"] == "12345678"
    assert response.json()["is_complete"] is True


def test_particular_cuenta_como_cobertura(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    payload = {
        "dni": "12345678",
        "birth_date": "1990-05-20",
        "phone": "11 5555-5555",
        "insurance_provider": "Particular",
    }

    response = client.put(PROFILE_PATH, json=payload)

    assert response.status_code == 200
    assert response.json()["is_complete"] is True


def test_perfil_incompleto_sin_cobertura(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    payload = {
        "dni": "12345678",
        "birth_date": "1990-05-20",
        "phone": "11 5555-5555",
    }

    response = client.put(PROFILE_PATH, json=payload)

    assert response.status_code == 200
    assert response.json()["is_complete"] is False


def test_cadenas_vacias_quedan_en_null(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    payload = {field: "   " for field in COMPLETE_PAYLOAD}

    response = client.put(PROFILE_PATH, json=payload)

    assert response.status_code == 200
    assert response.json()["dni"] is None
    assert response.json()["address"] is None
    assert response.json()["is_complete"] is False


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("dni", "123456"),  # muy corto
        ("dni", "123456789"),  # muy largo
        ("dni", "12.345.678"),  # con puntos
        ("dni", "1234567a"),  # no numerico
        ("phone", "12345"),  # menos de 6 digitos
        ("phone", "abcdefg"),  # no numerico
        ("emergency_contact_phone", "abc"),
        ("address", "x" * 201),
        ("city", "x" * 101),
        ("insurance_provider", "x" * 121),
        ("sex", "x" * 31),
    ],
)
def test_validaciones_rechazan_datos_invalidos(client, db_session, field, value):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    response = client.put(PROFILE_PATH, json={**COMPLETE_PAYLOAD, field: value})

    assert response.status_code == 422


def test_fecha_de_nacimiento_futura_falla(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    future = (date.today() + timedelta(days=1)).isoformat()

    response = client.put(
        PROFILE_PATH,
        json={**COMPLETE_PAYLOAD, "birth_date": future},
    )

    assert response.status_code == 422


def test_dni_duplicado_de_otro_paciente_da_409(client, db_session):
    first = create_user(db_session, email="ana@example.com")
    login_as(client, first)
    assert client.put(PROFILE_PATH, json=COMPLETE_PAYLOAD).status_code == 200

    second = create_user(db_session, email="juan@example.com")
    login_as(client, second)

    response = client.put(PROFILE_PATH, json=COMPLETE_PAYLOAD)

    assert response.status_code == 409


def test_reenviar_el_propio_dni_no_da_conflicto(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    assert client.put(PROFILE_PATH, json=COMPLETE_PAYLOAD).status_code == 200
    assert client.put(PROFILE_PATH, json=COMPLETE_PAYLOAD).status_code == 200


def test_otro_paciente_no_ve_el_perfil_ajeno(client, db_session):
    first = create_user(db_session, email="ana@example.com")
    login_as(client, first)
    client.put(PROFILE_PATH, json=COMPLETE_PAYLOAD)

    second = create_user(db_session, email="juan@example.com")
    login_as(client, second)

    response = client.get(PROFILE_PATH)

    assert response.status_code == 200
    assert response.json()["user_id"] == second.id
    assert response.json()["dni"] is None


def test_editar_no_pisa_el_perfil_de_otro(client, db_session):
    first = create_user(db_session, email="ana@example.com")
    login_as(client, first)
    client.put(PROFILE_PATH, json=COMPLETE_PAYLOAD)

    second = create_user(db_session, email="juan@example.com")
    login_as(client, second)
    client.put(PROFILE_PATH, json={"city": "Rosario"})

    # El perfil del primero quedo intacto.
    first_profile = (
        db_session.query(PatientProfile)
        .filter(PatientProfile.user_id == first.id)
        .one()
    )
    assert first_profile.dni == "12345678"
    assert first_profile.city == "CABA"
    assert db_session.query(PatientProfile).count() == 2


@pytest.mark.parametrize("role", [Role.DOCTOR, Role.ADMIN])
def test_roles_no_paciente_dan_403(client, db_session, role):
    user = create_user(
        db_session,
        email=f"{role.value.lower()}@example.com",
        role=role,
    )
    login_as(client, user)

    assert client.get(PROFILE_PATH).status_code == 403
    assert client.put(PROFILE_PATH, json=COMPLETE_PAYLOAD).status_code == 403


def test_sin_sesion_da_401(client):
    assert client.get(PROFILE_PATH).status_code == 401
    assert client.put(PROFILE_PATH, json=COMPLETE_PAYLOAD).status_code == 401
