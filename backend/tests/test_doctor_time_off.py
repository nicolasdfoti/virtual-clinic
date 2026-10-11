"""Tests de /api/doctor/time-off.

Cubren listado, alta y baja (DELETE) de bloqueos de tiempo. Como en
disponibilidad, un bloqueo de otro medico se ve como 404.
"""
from app.models.enums import Role
from app.models.user import User

from tests.conftest import create_doctor, create_user, login_as


TIME_OFF_PATH = "/api/doctor/time-off"

BLOCK = {
    "starts_at": "2030-06-15T09:00:00Z",
    "ends_at": "2030-06-15T12:00:00Z",
    "reason": "Congreso",
}


def second_doctor(session) -> User:
    user = create_user(
        session,
        email="otro-medico@example.com",
        role=Role.DOCTOR,
    )
    create_doctor(session, user, license_number="MP 200")

    return user


def test_time_off_requires_auth(client):
    response = client.get(TIME_OFF_PATH)

    assert response.status_code == 401


def test_create_list_delete_flow(client, doctor_user):
    login_as(client, doctor_user)

    created = client.post(TIME_OFF_PATH, json=BLOCK)
    assert created.status_code == 201
    time_off_id = created.json()["id"]

    listed = client.get(TIME_OFF_PATH)
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    deleted = client.delete(f"{TIME_OFF_PATH}/{time_off_id}")
    assert deleted.status_code == 204

    listed_after = client.get(TIME_OFF_PATH)
    assert listed_after.json() == []


def test_cannot_delete_foreign_time_off(client, db_session, doctor_user):
    login_as(client, doctor_user)
    created = client.post(TIME_OFF_PATH, json=BLOCK)
    own_id = created.json()["id"]

    other = second_doctor(db_session)
    login_as(client, other)

    response = client.delete(f"{TIME_OFF_PATH}/{own_id}")

    assert response.status_code == 404

    login_as(client, doctor_user)
    assert len(client.get(TIME_OFF_PATH).json()) == 1


def test_delete_missing_returns_404(client, doctor_user):
    login_as(client, doctor_user)

    response = client.delete(f"{TIME_OFF_PATH}/999")

    assert response.status_code == 404
