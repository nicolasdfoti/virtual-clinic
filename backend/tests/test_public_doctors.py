"""Tests de /api/public/doctors: sin auth, solo médicos activos y sin datos
personales de contacto."""
from app.models.enums import Role

from tests.conftest import create_doctor, create_user


PUBLIC_PATH = "/api/public/doctors"

ALLOWED_FIELDS = {"id", "name", "specialty", "license_number", "bio"}


def test_sin_sesion_devuelve_medicos_activos(client, db_session, doctor_user):
    response = client.get(PUBLIC_PATH)

    assert response.status_code == 200

    body = response.json()

    assert len(body) == 1
    assert body[0]["name"] == "Ana Ruiz"
    assert body[0]["license_number"] == "MP 100"


def test_excluye_medicos_inactivos(client, db_session, doctor_user):
    inactive_user = create_user(
        db_session,
        email="inactivo-medico@example.com",
        role=Role.DOCTOR,
        is_active=False,
    )
    create_doctor(
        db_session,
        inactive_user,
        license_number="MP 200",
    )

    active_user = create_user(
        db_session,
        email="medico-off@example.com",
        role=Role.DOCTOR,
    )
    create_doctor(
        db_session,
        active_user,
        license_number="MP 300",
        is_active=False,
    )

    body = client.get(PUBLIC_PATH).json()

    assert {item["license_number"] for item in body} == {"MP 100"}


def test_no_expone_datos_personales(client, db_session, doctor_user):
    item = client.get(PUBLIC_PATH).json()[0]

    assert set(item.keys()) == ALLOWED_FIELDS
    assert "email" not in item
    assert "user_id" not in item


def test_detalle_devuelve_medico_activo(client, db_session):
    user = create_user(
        db_session,
        email="medico@example.com",
        role=Role.DOCTOR,
        first_name="Ana",
        last_name="Ruiz",
    )
    doctor = create_doctor(db_session, user, license_number="MP 100")

    response = client.get(f"{PUBLIC_PATH}/{doctor.id}")

    assert response.status_code == 200

    body = response.json()

    assert body["id"] == doctor.id
    assert body["name"] == "Ana Ruiz"
    assert body["specialty"] == "Clínica médica"
    assert body["license_number"] == "MP 100"


def test_detalle_inexistente_da_404(client):
    assert client.get(f"{PUBLIC_PATH}/999999").status_code == 404


def test_detalle_medico_inactivo_da_404(client, db_session):
    user = create_user(
        db_session,
        email="medico-off@example.com",
        role=Role.DOCTOR,
    )
    doctor = create_doctor(
        db_session,
        user,
        license_number="MP 200",
        is_active=False,
    )

    assert client.get(f"{PUBLIC_PATH}/{doctor.id}").status_code == 404


def test_detalle_usuario_inactivo_da_404(client, db_session):
    user = create_user(
        db_session,
        email="inactivo@example.com",
        role=Role.DOCTOR,
        is_active=False,
    )
    doctor = create_doctor(db_session, user, license_number="MP 300")

    assert client.get(f"{PUBLIC_PATH}/{doctor.id}").status_code == 404


def test_detalle_no_expone_datos_personales(client, db_session):
    user = create_user(
        db_session,
        email="medico@example.com",
        role=Role.DOCTOR,
    )
    doctor = create_doctor(db_session, user)

    item = client.get(f"{PUBLIC_PATH}/{doctor.id}").json()

    assert set(item.keys()) == ALLOWED_FIELDS
    assert "email" not in item
    assert "user_id" not in item
