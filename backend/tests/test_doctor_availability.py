"""Tests de /api/doctor/availability.

Cubren listado, alta, edicion (PUT) y baja (DELETE) de franjas semanales. El
aislamiento entre medicos es clave: una franja de otro medico se trata como 404
para no filtrar la existencia de recursos ajenos.
"""
from app.models.enums import Role
from app.models.user import User

from tests.conftest import create_doctor, create_user, login_as


AVAILABILITY_PATH = "/api/doctor/availability"


def second_doctor(session) -> User:
    """Medico aparte, para probar aislamiento por pertenencia."""
    user = create_user(
        session,
        email="otro-medico@example.com",
        role=Role.DOCTOR,
    )
    create_doctor(session, user, license_number="MP 200")

    return user


def test_availability_requires_auth(client):
    response = client.get(AVAILABILITY_PATH)

    assert response.status_code == 401


def test_create_list_update_delete_flow(client, doctor_user):
    login_as(client, doctor_user)

    created = client.post(
        AVAILABILITY_PATH,
        json={"weekday": 0, "start_time": "08:00:00", "end_time": "12:00:00"},
    )
    assert created.status_code == 201
    availability_id = created.json()["id"]

    listed = client.get(AVAILABILITY_PATH)
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    updated = client.put(
        f"{AVAILABILITY_PATH}/{availability_id}",
        json={"start_time": "09:00:00"},
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["start_time"] == "09:00:00"
    assert body["end_time"] == "12:00:00"

    deleted = client.delete(f"{AVAILABILITY_PATH}/{availability_id}")
    assert deleted.status_code == 204

    listed_after = client.get(AVAILABILITY_PATH)
    assert listed_after.json() == []


def test_update_validates_time_range(client, doctor_user):
    login_as(client, doctor_user)

    created = client.post(
        AVAILABILITY_PATH,
        json={"weekday": 1, "start_time": "08:00:00", "end_time": "12:00:00"},
    )
    availability_id = created.json()["id"]

    response = client.put(
        f"{AVAILABILITY_PATH}/{availability_id}",
        json={"end_time": "07:00:00"},
    )

    assert response.status_code == 400


def test_update_rejects_duplicate_start_time(client, doctor_user):
    login_as(client, doctor_user)

    client.post(
        AVAILABILITY_PATH,
        json={"weekday": 2, "start_time": "08:00:00", "end_time": "10:00:00"},
    )
    second = client.post(
        AVAILABILITY_PATH,
        json={"weekday": 2, "start_time": "10:00:00", "end_time": "12:00:00"},
    )
    second_id = second.json()["id"]

    response = client.put(
        f"{AVAILABILITY_PATH}/{second_id}",
        json={"start_time": "08:00:00"},
    )

    assert response.status_code == 409


def test_cannot_update_or_delete_foreign_availability(client, db_session, doctor_user):
    login_as(client, doctor_user)
    created = client.post(
        AVAILABILITY_PATH,
        json={"weekday": 3, "start_time": "08:00:00", "end_time": "12:00:00"},
    )
    own_id = created.json()["id"]

    other = second_doctor(db_session)
    login_as(client, other)

    update = client.put(
        f"{AVAILABILITY_PATH}/{own_id}",
        json={"start_time": "09:00:00"},
    )
    assert update.status_code == 404

    delete = client.delete(f"{AVAILABILITY_PATH}/{own_id}")
    assert delete.status_code == 404


def test_delete_missing_returns_404(client, doctor_user):
    login_as(client, doctor_user)

    response = client.delete(f"{AVAILABILITY_PATH}/999")

    assert response.status_code == 404
