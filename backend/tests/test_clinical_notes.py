"""Tests de notas clinicas (ClinicalNote) y adendas.

Cubren creacion, adenda, listado y permisos (medico sin vinculo = 404,
paciente solo ve si PATIENT_VISIBLE_NOTES, admin no tiene endpoint directo).
"""
from datetime import date

from app.core.config import get_settings
from app.models.audit_log import AuditLog
from app.models.doctor import Doctor
from app.models.enums import Role
from app.models.patient_profile import PatientProfile
from app.models.user import User

from tests.conftest import create_doctor, create_user, link_patient, login_as


def create_patient(
    session,
    email: str,
    first_name: str = "Paciente",
    last_name: str = "Demo",
    dni: str | None = None,
) -> User:
    user = create_user(session, email=email, first_name=first_name, last_name=last_name)
    profile = PatientProfile(
        user_id=user.id,
        dni=dni,
        birth_date=date(1990, 5, 20),
        insurance_provider="OSDE",
        phone="1145550000",
    )
    session.add(profile)
    session.commit()
    session.refresh(user)
    return user


def doctor_row(session, doctor_user: User) -> Doctor:
    return session.query(Doctor).filter_by(user_id=doctor_user.id).one()


def second_doctor(session) -> Doctor:
    user = create_user(
        session,
        email="otro-medico@example.com",
        role=Role.DOCTOR,
        first_name="Otro",
        last_name="Médico",
    )
    return create_doctor(session, user, license_number="MP 200")


def set_up(session, doctor_user, patient_email="pac@example.com"):
    doctor = doctor_row(session, doctor_user)
    patient = create_patient(session, email=patient_email)
    link_patient(session, doctor, patient)
    return doctor, patient


# --- Creacion de nota (medico) ---


def test_crear_nota_sin_sesion_es_401(client):
    response = client.post(
        "/api/doctor/patients/1/clinical-notes",
        json={"content": "Nota de prueba"},
    )
    assert response.status_code == 401


def test_crear_nota_como_paciente_es_403(client, db_session):
    patient = create_patient(db_session, email="solo-pac@example.com")
    login_as(client, patient)

    response = client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Nota de prueba"},
    )
    assert response.status_code == 403


def test_crear_nota_sin_vinculo_es_404(client, doctor_user, db_session):
    other = second_doctor(db_session)
    patient = create_patient(db_session, email="ajeno@example.com")
    link_patient(db_session, other, patient)

    login_as(client, doctor_user)
    response = client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Nota de prueba"},
    )
    assert response.status_code == 404


def test_crear_nota_ok_genera_fila_y_audita(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, doctor_user)
    response = client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Paciente refiere cefalea desde ayer."},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["content"] == "Paciente refiere cefalea desde ayer."
    assert body["patient_id"] == patient.id
    assert body["doctor_id"] == doctor.id
    assert body["amends_note_id"] is None

    # Auditoria
    audit = db_session.query(AuditLog).filter_by(action="clinical_note_created").first()
    assert audit is not None
    assert audit.entity_type == "clinical_note"
    assert audit.entity_id == body["id"]


def test_crear_nota_con_turno_valido_ok(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)
    from app.models.appointment import Appointment
    from app.models.enums import AppointmentModality, AppointmentStatus
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo

    tz = ZoneInfo("UTC")
    appt = Appointment(
        doctor_id=doctor.id,
        patient_id=patient.id,
        starts_at=datetime.now(tz) + timedelta(days=1),
        ends_at=datetime.now(tz) + timedelta(days=1, hours=1),
        status=AppointmentStatus.SCHEDULED,
        modality=AppointmentModality.IN_PERSON,
        reason="Control",
    )
    db_session.add(appt)
    db_session.commit()
    db_session.refresh(appt)

    login_as(client, doctor_user)
    response = client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Nota con turno", "appointment_id": appt.id},
    )

    assert response.status_code == 201
    assert response.json()["appointment_id"] == appt.id


def test_crear_nota_con_turno_ajeno_es_400(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)
    other = second_doctor(db_session)
    link_patient(db_session, other, patient)

    from app.models.appointment import Appointment
    from app.models.enums import AppointmentModality, AppointmentStatus
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo

    tz = ZoneInfo("UTC")
    appt = Appointment(
        doctor_id=other.id,
        patient_id=patient.id,
        starts_at=datetime.now(tz) + timedelta(days=1),
        ends_at=datetime.now(tz) + timedelta(days=1, hours=1),
        status=AppointmentStatus.SCHEDULED,
        modality=AppointmentModality.IN_PERSON,
    )
    db_session.add(appt)
    db_session.commit()
    db_session.refresh(appt)

    login_as(client, doctor_user)
    response = client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Nota con turno ajeno", "appointment_id": appt.id},
    )

    assert response.status_code == 400
    assert "turno" in response.json()["detail"].lower()


# --- Adenda ---


def test_agregar_adenda_ok(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, doctor_user)
    # Nota original
    resp = client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Nota original"},
    )
    note_id = resp.json()["id"]

    # Adenda
    resp2 = client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes/{note_id}/amend",
        json={"content": "Adenda: agregar dato olvidado"},
    )

    assert resp2.status_code == 201
    body = resp2.json()
    assert body["amends_note_id"] == note_id
    assert body["content"] == "Adenda: agregar dato olvidado"

    # Auditoria
    audit = db_session.query(AuditLog).filter_by(action="clinical_note_amended").first()
    assert audit is not None
    assert audit.entity_id == body["id"]
    assert audit.extra["amends_note_id"] == note_id


def test_adenda_a_nota_inexistente_es_404(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, doctor_user)
    response = client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes/9999/amend",
        json={"content": "Adenda"},
    )
    assert response.status_code == 404


# --- Listado ---


def test_listar_notas_del_paciente(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, doctor_user)
    client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Nota 1"},
    )
    client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Nota 2"},
    )

    response = client.get(f"/api/doctor/patients/{patient.id}/clinical-notes")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2
    # Mas recientes primero
    assert body["items"][0]["content"] == "Nota 2"
    assert body["items"][1]["content"] == "Nota 1"
    # doctor_name incluido
    assert body["items"][0]["doctor_name"] is not None


def test_listar_notas_sin_vinculo_es_404(client, doctor_user, db_session):
    other = second_doctor(db_session)
    patient = create_patient(db_session, email="ajeno2@example.com")
    link_patient(db_session, other, patient)

    login_as(client, doctor_user)
    response = client.get(f"/api/doctor/patients/{patient.id}/clinical-notes")
    assert response.status_code == 404


# --- Paciente: visibilidad condicionada ---


def test_paciente_ver_notas_sin_flag_es_403(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    # Medico crea nota
    login_as(client, doctor_user)
    client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Nota secreta"},
    )

    # Paciente intenta listar (flag por defecto False)
    login_as(client, patient)
    response = client.get("/api/patients/me/clinical-notes")
    assert response.status_code == 403
    assert "habilitada" in response.json()["detail"]


def test_paciente_ver_notas_con_flag_ok(client, doctor_user, db_session, monkeypatch):
    # Habilitar flag temporalmente
    monkeypatch.setenv("PATIENT_VISIBLE_NOTES", "true")
    # settings es lru_cache, forzar recarga
    get_settings.cache_clear()

    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, doctor_user)
    client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Nota visible"},
    )

    login_as(client, patient)
    response = client.get("/api/patients/me/clinical-notes")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["content"] == "Nota visible"

    get_settings.cache_clear()


# --- Inmutabilidad (no hay UPDATE/DELETE) ---


def test_no_hay_endpoint_update_delete_para_notas(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)
    resp = client.post(
        f"/api/doctor/patients/{patient.id}/clinical-notes",
        json={"content": "Nota"},
    )
    note_id = resp.json()["id"]

    # PUT / PATCH / DELETE deberian dar 404 (no existen)
    for method in ["put", "patch", "delete"]:
        func = getattr(client, method)
        r = func(f"/api/doctor/patients/{patient.id}/clinical-notes/{note_id}")
        assert r.status_code == 404, f"{method.upper()} deberia ser 404"