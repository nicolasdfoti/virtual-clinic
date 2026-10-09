"""Tests de agenda/turnos."""
import threading
import time
from datetime import datetime, timedelta, time as dtime, date
from zoneinfo import ZoneInfo

import pytest

from app.models.appointment import Appointment
from app.models.doctor_availability import DoctorAvailability
from app.models.doctor_time_off import DoctorTimeOff
from app.models.enums import AppointmentStatus, AppointmentModality, Role
from app.services import scheduling
from tests.conftest import create_user, create_doctor, login_as

def create_patient_profile(session, user, **kwargs):
    from app.models.patient_profile import PatientProfile
    profile = PatientProfile(
        user_id=user.id,
        dni=kwargs.get("dni", "12345678"),
        birth_date=kwargs.get("birth_date", date(1990, 1, 1)),
        phone=kwargs.get("phone", "1144440000"),
        insurance_provider=kwargs.get("insurance_provider", "OSDE"),
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

def create_patient(session, email="pac@test.com", **kwargs):
    user = create_user(session, email=email, role=Role.PATIENT)
    create_patient_profile(session, user, **kwargs)
    return user


SLOTS_PATH = "/api/doctors/{id}/slots"
APPOINTMENTS_PATH = "/api/appointments"


def _mk_dt(year=2030, month=6, day=1, hour=9, minute=0):
    from zoneinfo import ZoneInfo
    from app.core.config import CLINIC_TIMEZONE
    return datetime(year, month, day, hour, minute, tzinfo=ZoneInfo(CLINIC_TIMEZONE))


def test_get_slots_requires_auth(client, db_session, doctor_user):
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()
    resp = client.get(f"/api/doctors/{doctor_row.id}/slots?from=2030-06-01&to=2030-06-01")
    assert resp.status_code == 401


def test_slots_empty_without_availability(client, db_session, doctor_user, user):
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()
    login_as(client, user)
    resp = client.get(f"/api/doctors/{doctor_row.id}/slots?from=2030-06-01&to=2030-06-01")
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_slots_with_availability(client, db_session, doctor_user, user):
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()
    
    # 2030-06-01 is a Saturday (weekday 5) or let's find weekday
    # Let's check weekday for 2030-06-01: 2030-06-01 is Saturday (5)
    av = DoctorAvailability(
        doctor_id=doctor_row.id,
        weekday=5,
        start_time=dtime(9, 0),
        end_time=dtime(11, 0),
    )
    db_session.add(av)
    db_session.commit()

    login_as(client, user)
    resp = client.get(f"/api/doctors/{doctor_row.id}/slots?from=2030-06-01&to=2030-06-01")
    assert resp.status_code == 200
    slots = resp.json()
    assert len(slots) > 0


def test_book_appointment_success(client, db_session, doctor_user):
    patient = create_patient(db_session, email="patient@test.com")
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()

    starts = _mk_dt(2030, 6, 15, 10, 0)
    login_as(client, patient)
    resp = client.post(
        APPOINTMENTS_PATH,
        json={
            "doctor_id": doctor_row.id,
            "starts_at": starts.isoformat(),
            "modality": "VIDEO",
            "reason": "Control general",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["doctor_id"] == doctor_row.id
    assert data["patient_id"] == patient.id
    assert data["status"] == "SCHEDULED"


def test_book_appointment_incomplete_profile(client, db_session, doctor_user):
    user = create_user(db_session, email="noprofile@test.com", role=Role.PATIENT)
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()

    starts = _mk_dt(2030, 6, 15, 10, 0)
    login_as(client, user)
    resp = client.post(
        APPOINTMENTS_PATH,
        json={
            "doctor_id": doctor_row.id,
            "starts_at": starts.isoformat(),
            "modality": "VIDEO",
        },
    )
    assert resp.status_code == 400
    assert "perfil" in resp.json()["detail"].lower()


def test_book_appointment_conflict_409(client, db_session, doctor_user):
    patient1 = create_patient(db_session, email="p1@test.com", dni="11111111")
    patient2 = create_patient(db_session, email="p2@test.com", dni="22222222")
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()

    starts = _mk_dt(2030, 6, 15, 10, 0)
    starts_utc = scheduling.to_utc(starts)
    ends_utc = starts_utc + timedelta(minutes=30)

    # Book first
    appt = Appointment(
        patient_id=patient1.id,
        doctor_id=doctor_row.id,
        starts_at=starts_utc,
        ends_at=ends_utc,
        status=AppointmentStatus.SCHEDULED,
        reason="Test",
        modality=AppointmentModality.VIDEO,
    )
    db_session.add(appt)
    db_session.commit()

    # Try patient2 booking same slot
    login_as(client, patient2)
    resp = client.post(
        APPOINTMENTS_PATH,
        json={
            "doctor_id": doctor_row.id,
            "starts_at": starts.isoformat(),
            "modality": "VIDEO",
        },
    )
    assert resp.status_code == 409


def test_concurrency_booking(client, db_session, doctor_user):
    """Intento de reserva superpuesta devuelve 409 Conflict."""
    patient1 = create_patient(db_session, email="c1@test.com", dni="33333333")
    patient2 = create_patient(db_session, email="c2@test.com", dni="44444444")
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()

    starts = _mk_dt(2030, 6, 20, 11, 0)

    login_as(client, patient1)
    resp1 = client.post(
        APPOINTMENTS_PATH,
        json={
            "doctor_id": doctor_row.id,
            "starts_at": starts.isoformat(),
            "modality": "VIDEO",
        },
    )
    assert resp1.status_code == 201

    login_as(client, patient2)
    resp2 = client.post(
        APPOINTMENTS_PATH,
        json={
            "doctor_id": doctor_row.id,
            "starts_at": starts.isoformat(),
            "modality": "VIDEO",
        },
    )
    assert resp2.status_code == 409


def test_cancel_appointment_patient_success(client, db_session, doctor_user):
    patient = create_patient(db_session, email="cancel@test.com")
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()

    # Starts in 3 days (> 24h)
    starts = datetime.now(ZoneInfo("UTC")) + timedelta(days=3)
    ends = starts + timedelta(minutes=30)

    appt = Appointment(
        patient_id=patient.id,
        doctor_id=doctor_row.id,
        starts_at=starts,
        ends_at=ends,
        status=AppointmentStatus.SCHEDULED,
        reason="Cancel test",
        modality=AppointmentModality.VIDEO,
    )
    db_session.add(appt)
    db_session.commit()

    login_as(client, patient)
    resp = client.patch(
        f"/api/appointments/{appt.id}/cancel",
        json={"reason": "No puedo asistir"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


def test_cancel_appointment_patient_too_late(client, db_session, doctor_user):
    patient = create_patient(db_session, email="toolate@test.com")
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()

    # Starts in 2 hours (< 24h)
    starts = datetime.now(ZoneInfo("UTC")) + timedelta(hours=2)
    ends = starts + timedelta(minutes=30)

    appt = Appointment(
        patient_id=patient.id,
        doctor_id=doctor_row.id,
        starts_at=starts,
        ends_at=ends,
        status=AppointmentStatus.SCHEDULED,
        reason="Too late cancel",
        modality=AppointmentModality.VIDEO,
    )
    db_session.add(appt)
    db_session.commit()

    login_as(client, patient)
    resp = client.patch(
        f"/api/appointments/{appt.id}/cancel",
        json={"reason": "Urgencia"},
    )
    assert resp.status_code == 403


def test_cancel_appointment_doctor_success(client, db_session, doctor_user):
    patient = create_patient(db_session, email="doccancel@test.com")
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()

    starts = datetime.now(ZoneInfo("UTC")) + timedelta(hours=2) # Doctor can cancel anytime
    ends = starts + timedelta(minutes=30)

    appt = Appointment(
        patient_id=patient.id,
        doctor_id=doctor_row.id,
        starts_at=starts,
        ends_at=ends,
        status=AppointmentStatus.SCHEDULED,
        reason="Doctor cancel",
        modality=AppointmentModality.VIDEO,
    )
    db_session.add(appt)
    db_session.commit()

    login_as(client, doctor_user)
    resp = client.patch(
        f"/api/appointments/{appt.id}/cancel",
        json={"reason": "Imprevisto médico"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


def test_complete_appointment_doctor(client, db_session, doctor_user):
    patient = create_patient(db_session, email="complete@test.com")
    from app.models.doctor import Doctor
    doctor_row = db_session.query(Doctor).filter_by(user_id=doctor_user.id).first()

    starts = datetime.now(ZoneInfo("UTC")) - timedelta(hours=1)
    ends = starts + timedelta(minutes=30)

    appt = Appointment(
        patient_id=patient.id,
        doctor_id=doctor_row.id,
        starts_at=starts,
        ends_at=ends,
        status=AppointmentStatus.SCHEDULED,
        reason="Completed test",
        modality=AppointmentModality.VIDEO,
    )
    db_session.add(appt)
    db_session.commit()

    login_as(client, doctor_user)
    resp = client.patch(f"/api/appointments/{appt.id}/complete")
    assert resp.status_code == 200
    assert resp.json()["status"] == "COMPLETED"

