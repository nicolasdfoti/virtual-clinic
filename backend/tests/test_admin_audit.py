"""Tests de /api/admin/audit-logs: filtros, paginacion y aislamiento por rol."""
from datetime import datetime, timezone

import pytest

from app.models.audit_log import AuditLog
from app.models.enums import Role

from tests.conftest import create_user, login_as


AUDIT_PATH = "/api/admin/audit-logs"

ALLOWED_FIELDS = {
    "id",
    "actor_user_id",
    "actor_email",
    "actor_name",
    "action",
    "entity_type",
    "entity_id",
    "ip",
    "metadata",
    "created_at",
}


def create_entry(
    session,
    actor=None,
    action: str = "patient_profile_viewed",
    entity_type: str = "patient_profile",
    entity_id: int | None = 1,
    ip: str | None = "127.0.0.1",
    metadata: dict | None = None,
    created_at: datetime | None = None,
) -> AuditLog:
    entry = AuditLog(
        actor_user_id=actor.id if actor is not None else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        ip=ip,
        extra=metadata,
    )

    if created_at is not None:
        entry.created_at = created_at

    session.add(entry)
    session.commit()
    session.refresh(entry)

    return entry


def test_sin_sesion_da_401(client):
    assert client.get(AUDIT_PATH).status_code == 401


@pytest.mark.parametrize("role", [Role.DOCTOR, Role.PATIENT])
def test_solo_admin_accede(client, db_session, role):
    user = create_user(
        db_session,
        email=f"{role.value.lower()}-audit@example.com",
        role=role,
    )
    login_as(client, user)

    assert client.get(AUDIT_PATH).status_code == 403


def test_lista_con_actor_y_mas_nuevo_primero(client, db_session, admin_user):
    doctor = create_user(
        db_session, email="med@example.com", role=Role.DOCTOR,
        first_name="Marta", last_name="Gómez",
    )

    create_entry(db_session, actor=doctor, action="patient_linked")
    create_entry(db_session, actor=doctor, action="patient_profile_viewed")

    login_as(client, admin_user)
    response = client.get(AUDIT_PATH)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert set(body["items"][0].keys()) == ALLOWED_FIELDS

    first = body["items"][0]
    assert first["action"] == "patient_profile_viewed"
    assert first["actor_user_id"] == doctor.id
    assert first["actor_email"] == "med@example.com"
    assert first["actor_name"] == "Marta Gómez"


def test_paginacion(client, db_session, admin_user):
    for index in range(3):
        create_entry(db_session, action=f"accion_{index}")

    login_as(client, admin_user)

    page = client.get(AUDIT_PATH, params={"limit": 2, "offset": 0}).json()
    assert page["total"] == 3
    assert page["limit"] == 2
    assert len(page["items"]) == 2


def test_filtro_por_accion(client, db_session, admin_user):
    create_entry(db_session, action="patient_linked")
    create_entry(db_session, action="patient_profile_viewed")

    login_as(client, admin_user)
    response = client.get(AUDIT_PATH, params={"action": "linked"})

    assert [item["action"] for item in response.json()["items"]] == [
        "patient_linked"
    ]


def test_filtro_por_actor(client, db_session, admin_user):
    uno = create_user(db_session, email="uno@example.com", role=Role.DOCTOR)
    dos = create_user(db_session, email="dos@example.com", role=Role.DOCTOR)

    create_entry(db_session, actor=uno)
    create_entry(db_session, actor=dos)

    login_as(client, admin_user)
    response = client.get(AUDIT_PATH, params={"actor_user_id": uno.id})

    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["actor_user_id"] == uno.id


def test_filtro_por_entity_type(client, db_session, admin_user):
    create_entry(db_session, entity_type="patient_profile")
    create_entry(db_session, entity_type="care_relationship")

    login_as(client, admin_user)
    response = client.get(AUDIT_PATH, params={"entity_type": "care"})

    assert [item["entity_type"] for item in response.json()["items"]] == [
        "care_relationship"
    ]


def test_filtro_rango_created_at(client, db_session, admin_user):
    create_entry(
        db_session,
        created_at=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc),
    )
    create_entry(
        db_session,
        created_at=datetime(2026, 2, 15, 12, 0, tzinfo=timezone.utc),
    )

    login_as(client, admin_user)
    response = client.get(
        AUDIT_PATH,
        params={"created_from": "2026-02-01", "created_to": "2026-02-28"},
    )

    assert response.json()["total"] == 1


def test_base_vacia_devuelve_lista_vacia(client, db_session, admin_user):
    login_as(client, admin_user)
    body = client.get(AUDIT_PATH).json()

    assert body == {"items": [], "total": 0, "limit": 20, "offset": 0}
