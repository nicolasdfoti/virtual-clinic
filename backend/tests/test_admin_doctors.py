"""Tests de /api/admin/doctors y del alta de médicos.

Cubre permisos, alta con contraseña temporal, duplicados, edición,
desactivación/activación (con invalidación de sesión) y el gate de
PASSWORD_CHANGE_REQUIRED.
"""
import pytest

from app.core.security import create_access_token, verify_password
from app.models.doctor import Doctor
from app.models.enums import Role
from app.models.user import User

from tests.conftest import create_user, login_as


DOCTORS_PATH = "/api/admin/doctors"
STATS_PATH = "/api/admin/stats"
PASSWORD_PATH = "/api/auth/password"

PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED"


def doctor_payload(**overrides) -> dict:
    payload = {
        "email": "nuevo@example.com",
        "first_name": "Nora",
        "last_name": "Gómez",
        "specialty": "Cardiología",
        "license_number": "MP 5555",
        "bio": "Cardióloga clínica.",
    }

    payload.update(overrides)

    return payload


def test_alta_crea_user_y_doctor_y_devuelve_password_temporal(
    client,
    db_session,
    admin_user,
):
    login_as(client, admin_user)

    response = client.post(DOCTORS_PATH, json=doctor_payload())

    assert response.status_code == 201

    body = response.json()

    assert body["email"] == "nuevo@example.com"
    assert body["specialty"] == "Cardiología"
    assert body["is_active"] is True

    temporary_password = body["temporary_password"]

    assert isinstance(temporary_password, str)
    assert len(temporary_password) >= 8

    user = (
        db_session.query(User)
        .filter(User.email == "nuevo@example.com")
        .one()
    )

    assert user.role == Role.DOCTOR
    assert user.must_change_password is True
    assert verify_password(temporary_password, user.password_hash)

    doctor = db_session.query(Doctor).filter(Doctor.user_id == user.id).one()

    assert doctor.license_number == "MP 5555"


def test_la_password_temporal_no_se_vuelve_a_exponer(
    client,
    db_session,
    admin_user,
):
    login_as(client, admin_user)

    client.post(DOCTORS_PATH, json=doctor_payload())

    listing = client.get(DOCTORS_PATH).json()

    assert len(listing) == 1
    assert "temporary_password" not in listing[0]


def test_matricula_duplicada_da_409(client, db_session, admin_user, doctor_user):
    login_as(client, admin_user)

    response = client.post(
        DOCTORS_PATH,
        json=doctor_payload(email="otro@example.com", license_number="MP 100"),
    )

    assert response.status_code == 409
    # No se creo una cuenta parcial.
    assert (
        db_session.query(User)
        .filter(User.email == "otro@example.com")
        .first()
        is None
    )


def test_email_duplicado_da_409(client, db_session, admin_user):
    login_as(client, admin_user)

    client.post(DOCTORS_PATH, json=doctor_payload())

    response = client.post(
        DOCTORS_PATH,
        json=doctor_payload(
            email="NUEVO@example.com",
            license_number="MP 9999",
        ),
    )

    assert response.status_code == 409


def test_listar_doctores_incluye_inactivos(client, db_session, admin_user):
    login_as(client, admin_user)

    first = client.post(
        DOCTORS_PATH,
        json=doctor_payload(email="a@example.com", license_number="MP 1"),
    ).json()

    client.post(
        DOCTORS_PATH,
        json=doctor_payload(email="b@example.com", license_number="MP 2"),
    )

    client.post(f"{DOCTORS_PATH}/{first['id']}/deactivate")

    listing = client.get(DOCTORS_PATH).json()

    assert len(listing) == 2

    by_id = {item["id"]: item for item in listing}

    assert by_id[first["id"]]["is_active"] is False


def test_patch_actualiza_los_datos(client, db_session, admin_user):
    login_as(client, admin_user)

    created = client.post(
        DOCTORS_PATH,
        json=doctor_payload(),
    ).json()

    response = client.patch(
        f"{DOCTORS_PATH}/{created['id']}",
        json={
            "first_name": "Norita",
            "specialty": "Clínica médica",
            "bio": None,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["first_name"] == "Norita"
    assert body["specialty"] == "Clínica médica"
    assert body["bio"] is None
    # Lo no enviado queda igual.
    assert body["license_number"] == "MP 5555"


def test_patch_a_matricula_existente_da_409(
    client,
    db_session,
    admin_user,
    doctor_user,
):
    login_as(client, admin_user)

    created = client.post(
        DOCTORS_PATH,
        json=doctor_payload(),
    ).json()

    response = client.patch(
        f"{DOCTORS_PATH}/{created['id']}",
        json={"license_number": "MP 100"},
    )

    assert response.status_code == 409


def test_patch_de_medico_inexistente_da_404(client, db_session, admin_user):
    login_as(client, admin_user)

    response = client.patch(
        f"{DOCTORS_PATH}/99999",
        json={"specialty": "Otra"},
    )

    assert response.status_code == 404


def test_deactivate_y_activate(client, db_session, admin_user):
    login_as(client, admin_user)

    created = client.post(DOCTORS_PATH, json=doctor_payload()).json()

    user = (
        db_session.query(User)
        .filter(User.email == "nuevo@example.com")
        .one()
    )

    version_before = user.token_version

    deactivated = client.post(f"{DOCTORS_PATH}/{created['id']}/deactivate")

    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False

    db_session.refresh(user)

    assert user.is_active is False
    # Invalida las sesiones abiertas.
    assert user.token_version == version_before + 1

    activated = client.post(f"{DOCTORS_PATH}/{created['id']}/activate")

    assert activated.status_code == 200
    assert activated.json()["is_active"] is True

    db_session.refresh(user)

    assert user.is_active is True


def test_desactivar_invalida_la_sesion_del_medico(
    client,
    db_session,
    admin_user,
):
    login_as(client, admin_user)

    created = client.post(DOCTORS_PATH, json=doctor_payload()).json()

    doctor_user = (
        db_session.query(User)
        .filter(User.email == "nuevo@example.com")
        .one()
    )

    old_token = create_access_token(
        subject=str(doctor_user.id),
        token_version=doctor_user.token_version,
    )

    client.post(f"{DOCTORS_PATH}/{created['id']}/deactivate")

    client.cookies.clear()
    client.cookies.set("access_token", old_token)

    assert client.get("/api/auth/me").status_code == 401


def test_medico_con_clave_temporal_es_gateado(
    client,
    db_session,
    admin_user,
):
    login_as(client, admin_user)

    created = client.post(DOCTORS_PATH, json=doctor_payload()).json()

    client.cookies.clear()

    login = client.post(
        "/api/auth/login",
        json={
            "email": "nuevo@example.com",
            "password": created["temporary_password"],
        },
    )

    assert login.status_code == 200

    # /auth/me sigue disponible.
    assert client.get("/api/auth/me").status_code == 200

    blocked = client.get(STATS_PATH)

    assert blocked.status_code == 403
    assert blocked.json()["detail"]["code"] == PASSWORD_CHANGE_REQUIRED

    # Logout tambien disponible.
    assert client.post("/api/auth/logout").status_code == 204


def test_gate_se_libera_al_cambiar_la_password(client, db_session):
    admin = create_user(
        db_session,
        email="forced-admin@example.com",
        role=Role.ADMIN,
        must_change_password=True,
    )

    login_as(client, admin)

    blocked = client.get(STATS_PATH)

    assert blocked.status_code == 403
    assert blocked.json()["detail"]["code"] == PASSWORD_CHANGE_REQUIRED

    changed = client.patch(
        PASSWORD_PATH,
        json={
            "current_password": "Password123",
            "new_password": "NuevaClave123",
        },
    )

    assert changed.status_code == 204
    assert client.get(STATS_PATH).status_code == 200


def test_enable_doctor_profile(client, db_session, admin_user):
    login_as(client, admin_user)

    response = client.post(
        "/api/admin/me/enable-doctor-profile",
        json={
            "specialty": "Dermatología",
            "license_number": "MP 7777",
            "bio": "Atiendo por la tarde.",
        },
    )

    assert response.status_code == 201

    body = response.json()

    assert body["user_id"] == admin_user.id
    assert body["specialty"] == "Dermatología"
    # Sigue siendo admin ademas de medico.
    db_session.refresh(admin_user)
    assert admin_user.role == Role.ADMIN
    assert (
        db_session.query(Doctor)
        .filter(Doctor.user_id == admin_user.id)
        .count()
        == 1
    )

    again = client.post(
        "/api/admin/me/enable-doctor-profile",
        json={"specialty": "Otra", "license_number": "MP 8888"},
    )

    assert again.status_code == 409


def test_enable_doctor_profile_con_matricula_usada(
    client,
    db_session,
    admin_user,
    doctor_user,
):
    login_as(client, admin_user)

    response = client.post(
        "/api/admin/me/enable-doctor-profile",
        json={"specialty": "Otra", "license_number": "MP 100"},
    )

    assert response.status_code == 409


@pytest.mark.parametrize("role", [Role.DOCTOR, Role.PATIENT])
def test_solo_admin_puede_gestionar_medicos(client, db_session, role):
    user = create_user(
        db_session,
        email=f"{role.value.lower()}-x@example.com",
        role=role,
    )
    login_as(client, user)

    assert client.get(DOCTORS_PATH).status_code == 403
    assert client.post(DOCTORS_PATH, json=doctor_payload()).status_code == 403


def test_sin_sesion_da_401(client):
    assert client.get(DOCTORS_PATH).status_code == 401
    assert client.post(DOCTORS_PATH, json=doctor_payload()).status_code == 401
