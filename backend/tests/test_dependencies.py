"""Matriz de permisos: roles x dependencias de autorizacion.

Los endpoints de este archivo son de PRUEBA y existen solo aca: montan una
aplicacion FastAPI minima que usa las dependencias reales. No se registran en
app/main.py.
"""
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.database import get_db
from app.dependencies import get_current_doctor, require_roles
from app.models.enums import Role
from app.models.user import User

from tests.conftest import create_doctor, create_user


deps_test_app = FastAPI()


@deps_test_app.get("/probe/patient")
def probe_patient(
    current_user: User = Depends(require_roles(Role.PATIENT)),
):
    return {"id": current_user.id}


@deps_test_app.get("/probe/doctor")
def probe_doctor(
    current_user: User = Depends(require_roles(Role.DOCTOR)),
):
    return {"id": current_user.id}


@deps_test_app.get("/probe/admin")
def probe_admin(
    current_user: User = Depends(require_roles(Role.ADMIN)),
):
    return {"id": current_user.id}


@deps_test_app.get("/probe/doctor-or-admin")
def probe_doctor_or_admin(
    current_user: User = Depends(require_roles(Role.DOCTOR, Role.ADMIN)),
):
    return {"id": current_user.id}


@deps_test_app.get("/probe/doctor-profile")
def probe_doctor_profile(
    doctor=Depends(get_current_doctor),
):
    return {"id": doctor.id}


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    deps_test_app.dependency_overrides[get_db] = override_get_db

    with TestClient(deps_test_app) as test_client:
        yield test_client

    deps_test_app.dependency_overrides.clear()


def login_as(client, user: User) -> None:
    """Sumula la cookie de sesion del usuario (idem login del endpoint real)."""
    client.cookies.set(
        "access_token",
        create_access_token(subject=str(user.id)),
    )


@pytest.mark.parametrize(
    ("role", "path", "expected_status"),
    [
        (Role.PATIENT, "/probe/patient", 200),
        (Role.DOCTOR, "/probe/patient", 403),
        (Role.ADMIN, "/probe/patient", 403),
        (Role.PATIENT, "/probe/doctor", 403),
        (Role.DOCTOR, "/probe/doctor", 200),
        (Role.ADMIN, "/probe/doctor", 403),
        (Role.PATIENT, "/probe/admin", 403),
        (Role.DOCTOR, "/probe/admin", 403),
        (Role.ADMIN, "/probe/admin", 200),
        (Role.PATIENT, "/probe/doctor-or-admin", 403),
        (Role.DOCTOR, "/probe/doctor-or-admin", 200),
        (Role.ADMIN, "/probe/doctor-or-admin", 200),
    ],
)
def test_require_roles_matriz(client, db_session, role, path, expected_status):
    user = create_user(db_session, email=f"perfil-{role.value}@example.com", role=role)
    login_as(client, user)

    response = client.get(path)

    assert response.status_code == expected_status


def test_require_roles_falla_sin_autenticacion(client):
    response = client.get("/probe/admin")

    assert response.status_code == 401


def test_require_roles_falla_con_usuario_inactivo(client, db_session):
    user = create_user(
        db_session,
        email="inactivo-admin@example.com",
        role=Role.ADMIN,
        is_active=False,
    )
    login_as(client, user)

    response = client.get("/probe/admin")

    assert response.status_code == 403


def test_get_current_doctor_devuelve_el_doctor_de_un_medico(client, db_session):
    doctor_user = create_user(
        db_session,
        email="medico@example.com",
        role=Role.DOCTOR,
    )
    doctor = create_doctor(db_session, doctor_user)
    login_as(client, doctor_user)

    response = client.get("/probe/doctor-profile")

    assert response.status_code == 200
    assert response.json()["id"] == doctor.id


def test_get_current_doctor_funciona_para_admin_con_fila_de_doctor(client, db_session):
    admin_user = create_user(
        db_session,
        email="admin-medico@example.com",
        role=Role.ADMIN,
    )
    doctor = create_doctor(db_session, admin_user, license_number="MP 999")
    login_as(client, admin_user)

    response = client.get("/probe/doctor-profile")

    assert response.status_code == 200
    assert response.json()["id"] == doctor.id


def test_get_current_doctor_falla_sin_fila_doctor(client, db_session):
    doctor_user = create_user(
        db_session,
        email="medico-sin-fila@example.com",
        role=Role.DOCTOR,
    )
    login_as(client, doctor_user)

    response = client.get("/probe/doctor-profile")

    assert response.status_code == 403


def test_get_current_doctor_falla_con_doctor_desactivado(client, db_session):
    doctor_user = create_user(
        db_session,
        email="medico-inactivo@example.com",
        role=Role.DOCTOR,
    )
    create_doctor(db_session, doctor_user, is_active=False)
    login_as(client, doctor_user)

    response = client.get("/probe/doctor-profile")

    assert response.status_code == 403


def test_get_current_doctor_falla_para_paciente(client, db_session):
    patient = create_user(db_session, email="paciente@example.com", role=Role.PATIENT)
    login_as(client, patient)

    response = client.get("/probe/doctor-profile")

    assert response.status_code == 403


def test_get_current_doctor_falla_con_usuario_inactivo(client, db_session):
    doctor_user = create_user(
        db_session,
        email="medico-dado-de-baja@example.com",
        role=Role.DOCTOR,
        is_active=False,
    )
    login_as(client, doctor_user)

    response = client.get("/probe/doctor-profile")

    assert response.status_code == 403