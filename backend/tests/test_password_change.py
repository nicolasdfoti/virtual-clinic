"""Tests de PATCH /api/auth/password.

Cubre el cambio exitoso, la validacion de la clave actual, la fortaleza de la
nueva, la invalidacion de tokens viejos y la matriz de autenticacion.
"""
import pytest

from app.core.security import create_access_token, verify_password
from app.models.enums import Role
from app.models.user import User

from tests.conftest import create_user


PASSWORD_PATH = "/api/auth/password"


def login_as(client, user: User) -> None:
    client.cookies.set(
        "access_token",
        create_access_token(
            subject=str(user.id),
            token_version=user.token_version,
        ),
    )


def test_cambio_exitoso_actualiza_hash_y_limpia_la_marca(client, db_session):
    patient = create_user(
        db_session,
        email="ana@example.com",
        must_change_password=True,
    )
    login_as(client, patient)

    response = client.patch(
        PASSWORD_PATH,
        json={
            "current_password": "Password123",
            "new_password": "NuevaClave123",
        },
    )

    assert response.status_code == 204

    db_session.refresh(patient)

    assert patient.must_change_password is False
    assert patient.token_version == 1
    assert verify_password("NuevaClave123", patient.password_hash)
    assert not verify_password("Password123", patient.password_hash)


def test_la_sesion_actual_sigue_viva_con_la_cookie_reemitida(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    client.patch(
        PASSWORD_PATH,
        json={
            "current_password": "Password123",
            "new_password": "NuevaClave123",
        },
    )

    # El PATCH reemite la cookie con la version nueva.
    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "ana@example.com"


def test_login_con_la_clave_nueva_funciona_y_con_la_vieja_no(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    client.patch(
        PASSWORD_PATH,
        json={
            "current_password": "Password123",
            "new_password": "NuevaClave123",
        },
    )

    nueva = client.post(
        "/api/auth/login",
        json={"email": "ana@example.com", "password": "NuevaClave123"},
    )
    vieja = client.post(
        "/api/auth/login",
        json={"email": "ana@example.com", "password": "Password123"},
    )

    assert nueva.status_code == 200
    assert vieja.status_code == 401


def test_los_tokens_previos_quedan_invalidados(client, db_session):
    patient = create_user(db_session, email="ana@example.com")

    old_token = create_access_token(
        subject=str(patient.id),
        token_version=patient.token_version,
    )

    login_as(client, patient)

    response = client.patch(
        PASSWORD_PATH,
        json={
            "current_password": "Password123",
            "new_password": "NuevaClave123",
        },
    )

    assert response.status_code == 204

    # Volvemos a poner el token emitido antes del cambio: tiene que dar 401
    # porque la version quedo atras. Limpiamos la cookie que reemitió el PATCH.
    client.cookies.clear()
    client.cookies.set("access_token", old_token)

    assert client.get("/api/auth/me").status_code == 401


def test_password_actual_incorrecta_da_400(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    response = client.patch(
        PASSWORD_PATH,
        json={
            "current_password": "OtraClave123",
            "new_password": "NuevaClave123",
        },
    )

    assert response.status_code == 400
    assert "actual" in response.json()["detail"].lower()


def test_la_clave_nueva_debe_cumplir_las_reglas(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    response = client.patch(
        PASSWORD_PATH,
        json={
            "current_password": "Password123",
            "new_password": "corta7",
        },
    )

    assert response.status_code == 422


def test_la_clave_nueva_no_supera_los_72_bytes(client, db_session):
    patient = create_user(db_session, email="ana@example.com")
    login_as(client, patient)

    response = client.patch(
        PASSWORD_PATH,
        json={
            "current_password": "Password123",
            "new_password": "a" * 73,
        },
    )

    assert response.status_code == 422


@pytest.mark.parametrize("role", [Role.DOCTOR, Role.ADMIN])
def test_cualquier_rol_autenticado_puede_cambiar_su_clave(client, db_session, role):
    user = create_user(
        db_session,
        email=f"{role.value.lower()}@example.com",
        role=role,
    )
    login_as(client, user)

    response = client.patch(
        PASSWORD_PATH,
        json={
            "current_password": "Password123",
            "new_password": "NuevaClave123",
        },
    )

    assert response.status_code == 204


def test_sin_sesion_da_401(client):
    response = client.patch(
        PASSWORD_PATH,
        json={
            "current_password": "Password123",
            "new_password": "NuevaClave123",
        },
    )

    assert response.status_code == 401
