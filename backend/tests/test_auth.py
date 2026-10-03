"""Tests de /api/auth."""
import pytest

from app.models.enums import Role

from tests.conftest import create_user


REGISTER_PAYLOAD = {
    "first_name": "Ana",
    "last_name": "Ruiz",
    "email": "ana@example.com",
    "password": "Password123",
}


def test_register_crea_la_cuenta(client):
    response = client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    assert response.status_code == 201

    body = response.json()

    assert body["email"] == "ana@example.com"
    assert body["role"] == "PATIENT"
    assert body["is_active"] is True
    assert "password" not in body
    assert "password_hash" not in body


def test_register_normaliza_el_email_a_minusculas(client):
    response = client.post(
        "/api/auth/register",
        json={**REGISTER_PAYLOAD, "email": "Ana.Lopez@Example.COM"},
    )

    assert response.status_code == 201
    assert response.json()["email"] == "ana.lopez@example.com"


def test_register_con_email_duplicado_falla(client, user):
    response = client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    assert response.status_code == 400


def test_register_duplicado_no_revela_que_el_email_existe(client, user):
    response = client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    # El mensaje es el mismo que devolveria cualquier otro rechazo: no puede
    # confirmar que "ana@example.com" ya esta registrado.
    assert response.json()["detail"] == "No se pudo completar el registro."


def test_register_con_password_corta_falla(client):
    response = client.post(
        "/api/auth/register",
        json={**REGISTER_PAYLOAD, "password": "corta7"},
    )

    assert response.status_code == 422
    assert "8 caracteres" in str(response.json())


def test_register_con_password_de_73_bytes_falla(client):
    response = client.post(
        "/api/auth/register",
        json={**REGISTER_PAYLOAD, "password": "a" * 73},
    )

    # 72 es el limite de bcrypt: mas alla se trunca en silencio.
    assert response.status_code == 422
    assert "72 bytes" in str(response.json())


def test_register_ignora_el_role_enviado_por_el_cliente(client, db_session):
    response = client.post(
        "/api/auth/register",
        json={**REGISTER_PAYLOAD, "role": "ADMIN"},
    )

    assert response.status_code == 201
    # No se auto-asigna ADMIN por mandar el campo en el body.
    assert response.json()["role"] == "PATIENT"


def test_register_normaliza_los_nombres(client):
    response = client.post(
        "/api/auth/register",
        json={**REGISTER_PAYLOAD, "first_name": "  Ana  "},
    )

    assert response.status_code == 201
    assert response.json()["first_name"] == "Ana"


def test_register_con_nombre_vacio_falla(client):
    response = client.post(
        "/api/auth/register",
        json={**REGISTER_PAYLOAD, "first_name": "   "},
    )

    assert response.status_code == 422


def test_login_ok_devuelve_la_sesion_y_setea_la_cookie(client, user):
    response = client.post(
        "/api/auth/login",
        json={"email": "ana@example.com", "password": "Password123"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "ana@example.com"

    cookie_header = response.headers["set-cookie"]

    assert "access_token=" in cookie_header
    # httpOnly es el motivo por el que se migró desde localStorage.
    assert "HttpOnly" in cookie_header
    assert "SameSite=lax" in cookie_header


def test_login_es_case_insensitive_en_el_email(client, user):
    response = client.post(
        "/api/auth/login",
        json={"email": "ANA@Example.com", "password": "Password123"},
    )

    assert response.status_code == 200


def test_login_normaliza_el_email_antes_de_buscar(client, db_session):
    create_user(db_session, email="juan@example.com")

    response = client.post(
        "/api/auth/login",
        json={"email": "  Juan@Example.com  ", "password": "Password123"},
    )

    assert response.status_code == 200


def test_login_con_email_inexistente_y_password_incorrecta_son_indistinguibles(
    client,
    user,
):
    inexistente = client.post(
        "/api/auth/login",
        json={"email": "nadie@example.com", "password": "Password123"},
    )

    password_incorrecta = client.post(
        "/api/auth/login",
        json={"email": "ana@example.com", "password": "PasswordIncorrecta123"},
    )

    assert inexistente.status_code == password_incorrecta.status_code == 401
    # Mismo status Y mismo body: si difieren, se puede enumerar que emails
    # estan registrados.
    assert inexistente.json() == password_incorrecta.json()


def test_login_con_usuario_inactivo_da_403(client, inactive_user):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "inactivo@example.com",
            "password": "Password123",
        },
    )

    assert response.status_code == 403
    # Generico a proposito: no puede confirmar que el email existe.
    assert response.json()["detail"] == "Credenciales inválidas."
    assert "desactivad" not in response.json()["detail"]


def test_me_con_cookie_devuelve_el_usuario(client, user):
    client.post(
        "/api/auth/login",
        json={"email": "ana@example.com", "password": "Password123"},
    )

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "ana@example.com"
    assert "password_hash" not in response.json()


def test_me_sin_cookie_da_401(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_con_cookie_invalida_da_401(client):
    client.cookies.set("access_token", "no.es.un.jwt")

    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_logout_invalida_el_acceso(client, user):
    client.post(
        "/api/auth/login",
        json={"email": "ana@example.com", "password": "Password123"},
    )

    assert client.get("/api/auth/me").status_code == 200

    logout_response = client.post("/api/auth/logout")

    assert logout_response.status_code == 204
    # El logout borra la cookie: /me ya no tiene con que autenticar.
    assert "access_token=" in logout_response.headers["set-cookie"]
    assert client.get("/api/auth/me").status_code == 401


def test_logout_sin_sesion_devuelve_204(client):
    response = client.post("/api/auth/logout")

    assert response.status_code == 204


def test_me_con_usuario_inactivo_da_403(client, inactive_user):
    client.post(
        "/api/auth/login",
        json={
            "email": "inactivo@example.com",
            "password": "Password123",
        },
    )

    # El login ya fue rechazado con 403, pero forzamos el caso de un cookie
    # emitido antes de la baja: get_current_active_user tiene que cortar.
    from app.core.security import create_access_token

    client.cookies.set(
        "access_token",
        create_access_token(subject=str(inactive_user.id)),
    )

    response = client.get("/api/auth/me")

    assert response.status_code == 403