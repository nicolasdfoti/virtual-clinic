"""Tests de notificaciones in-app."""
from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.core.config import CLINIC_TIMEZONE
from app.models.doctor import Doctor
from app.models.enums import Role
from app.models.notification import Notification
from app.models.patient_profile import PatientProfile
from tests.conftest import create_user, login_as


NOTIFICATIONS_PATH = "/api/notifications"
UNREAD_PATH = "/api/notifications/unread-count"


def _mk_dt(year=2030, month=6, day=15, hour=10, minute=0):
    return datetime(
        year, month, day, hour, minute, tzinfo=ZoneInfo(CLINIC_TIMEZONE)
    )


def _add_availability(session, doctor_id, weekday):
    """Agenda semanal amplia para que el turno caiga dentro de la franja."""
    from datetime import time as dtime

    from app.models.doctor_availability import DoctorAvailability

    session.add(
        DoctorAvailability(
            doctor_id=doctor_id,
            weekday=weekday,
            start_time=dtime(8, 0),
            end_time=dtime(18, 0),
        )
    )
    session.commit()


def _make_patient(session, email="pac@test.com", dni="12345678"):
    user = create_user(session, email=email, role=Role.PATIENT)
    session.add(
        PatientProfile(
            user_id=user.id,
            dni=dni,
            birth_date=date(1990, 1, 1),
            phone="1144440000",
            insurance_provider="OSDE",
        )
    )
    session.commit()
    return user


def _add_notification(session, user, *, type_="appointment_booked", is_read=False,
                      title="Aviso", message="Texto"):
    notification = Notification(
        user_id=user.id,
        type=type_,
        title=title,
        message=message,
        is_read=is_read,
    )
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return notification


def test_list_notifications_requires_auth(client):
    resp = client.get(NOTIFICATIONS_PATH)
    assert resp.status_code == 401


def test_list_notifications_returns_only_own(client, db_session, user):
    other = create_user(db_session, email="otro@test.com")
    _add_notification(db_session, user, title="Mía")
    _add_notification(db_session, other, title="Ajena")

    login_as(client, user)
    resp = client.get(NOTIFICATIONS_PATH)

    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["title"] == "Mía"


def test_list_notifications_only_unread(client, db_session, user):
    _add_notification(db_session, user, title="Leída", is_read=True)
    _add_notification(db_session, user, title="Nueva", is_read=False)

    login_as(client, user)
    resp = client.get(NOTIFICATIONS_PATH, params={"only_unread": True})

    assert resp.status_code == 200
    data = resp.json()
    assert [n["title"] for n in data] == ["Nueva"]


def test_unread_count(client, db_session, user):
    _add_notification(db_session, user, is_read=True)
    _add_notification(db_session, user, is_read=False)
    _add_notification(db_session, user, is_read=False)

    login_as(client, user)
    resp = client.get(UNREAD_PATH)

    assert resp.status_code == 200
    assert resp.json()["unread"] == 2


def test_mark_notification_read(client, db_session, user):
    notification = _add_notification(db_session, user, is_read=False)

    login_as(client, user)
    resp = client.post(f"{NOTIFICATIONS_PATH}/{notification.id}/read")

    assert resp.status_code == 200
    assert resp.json()["is_read"] is True

    db_session.refresh(notification)
    assert notification.is_read is True


def test_mark_foreign_notification_read_is_404(client, db_session, user):
    other = create_user(db_session, email="otro@test.com")
    notification = _add_notification(db_session, other)

    login_as(client, user)
    resp = client.post(f"{NOTIFICATIONS_PATH}/{notification.id}/read")

    assert resp.status_code == 404


def test_mark_all_read(client, db_session, user):
    _add_notification(db_session, user, is_read=False)
    _add_notification(db_session, user, is_read=False)

    login_as(client, user)
    resp = client.post(f"{NOTIFICATIONS_PATH}/read-all")
    assert resp.status_code == 204

    remaining = (
        db_session.query(Notification)
        .filter(
            Notification.user_id == user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )
    assert remaining == 0


def test_booking_notifies_doctor(client, db_session, doctor_user):
    patient = _make_patient(db_session)
    doctor_row = (
        db_session.query(Doctor)
        .filter(Doctor.user_id == doctor_user.id)
        .first()
    )

    _add_availability(db_session, doctor_row.id, _mk_dt().weekday())

    login_as(client, patient)
    resp = client.post(
        "/api/appointments",
        json={
            "doctor_id": doctor_row.id,
            "starts_at": _mk_dt().isoformat(),
            "modality": "VIDEO",
            "reason": "Control",
        },
    )

    assert resp.status_code == 201

    notifications = (
        db_session.query(Notification)
        .filter(Notification.user_id == doctor_user.id)
        .all()
    )
    assert len(notifications) == 1
    assert notifications[0].type == "appointment_booked"
    assert notifications[0].is_read is False


def test_cancel_by_patient_notifies_doctor(client, db_session, doctor_user):
    patient = _make_patient(db_session)
    doctor_row = (
        db_session.query(Doctor)
        .filter(Doctor.user_id == doctor_user.id)
        .first()
    )

    _add_availability(db_session, doctor_row.id, _mk_dt().weekday())

    login_as(client, patient)
    book = client.post(
        "/api/appointments",
        json={
            "doctor_id": doctor_row.id,
            "starts_at": _mk_dt().isoformat(),
            "modality": "VIDEO",
            "reason": "Control",
        },
    )
    appointment_id = book.json()["id"]

    resp = client.patch(
        f"/api/appointments/{appointment_id}/cancel",
        json={"reason": "No puedo"},
    )
    assert resp.status_code == 200

    typed = (
        db_session.query(Notification)
        .filter(
            Notification.user_id == doctor_user.id,
            Notification.type == "appointment_cancelled",
        )
        .all()
    )
    assert len(typed) == 1
