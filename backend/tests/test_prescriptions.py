"""Tests de recetas/indicaciones y ordenes medicas.

Cubren emision, listado y anulacion por parte del medico; listado y descarga
del paciente; y listados/descargas/actividad del admin. Se verifica ademas el
aislamiento entre medicos y pacientes (recurso ajeno = 404).
"""
from datetime import date

from app.models.audit_log import AuditLog
from app.models.doctor import Doctor
from app.models.enums import Role
from app.models.patient_profile import PatientProfile
from app.models.prescription import MedicalOrder, Prescription
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


PRESCRIPTION_ITEM = {
    "medication": "Amoxicilina",
    "dose": "500 mg",
    "frequency": "cada 8 horas",
    "duration": "7 días",
    "instructions": "Tomar con comida",
}


# --- Emision de recetas (medico) ---


def test_emitir_receta_sin_sesion_es_401(client):
    response = client.post(
        "/api/doctor/patients/1/prescriptions",
        json={"patient_id": 1, "items": [PRESCRIPTION_ITEM]},
    )
    assert response.status_code == 401


def test_emitir_receta_como_paciente_es_403(client, db_session):
    patient = create_patient(db_session, email="solo-pac@example.com")
    login_as(client, patient)

    response = client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    )
    assert response.status_code == 403


def test_emitir_receta_sin_vinculo_es_404(client, doctor_user, db_session):
    other = second_doctor(db_session)
    patient = create_patient(db_session, email="ajeno@example.com")
    link_patient(db_session, other, patient)

    login_as(client, doctor_user)
    response = client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    )

    assert response.status_code == 404


def test_emitir_receta_ok_genera_folio_y_audita(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, doctor_user)
    response = client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["folio"].startswith("RX-")
    assert body["status"] == "ACTIVE"
    assert body["patient_id"] == patient.id
    assert body["doctor_id"] == doctor.id
    assert len(body["items"]) == 1
    assert body["items"][0]["medication"] == "Amoxicilina"

    stored = db_session.query(Prescription).one()
    assert stored.folio == body["folio"]

    entry = (
        db_session.query(AuditLog)
        .filter_by(action="prescription_created")
        .one()
    )
    assert entry.entity_type == "prescription"
    assert entry.entity_id == stored.id


def test_emitir_receta_sin_items_es_422(client, doctor_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)

    response = client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": []},
    )

    assert response.status_code == 422


def test_listar_recetas_no_mezcla_otros_medicos(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)
    other = second_doctor(db_session)
    other_user = other.user
    link_patient(db_session, other, patient)

    login_as(client, doctor_user)
    client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    )

    login_as(client, other_user)
    client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    )

    login_as(client, doctor_user)
    response = client.get(f"/api/doctor/patients/{patient.id}/prescriptions")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["doctor_id"] == doctor.id


def test_anular_receta_ok(client, doctor_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)

    created = client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    ).json()

    response = client.patch(
        f"/api/doctor/patients/{patient.id}/prescriptions/{created['id']}/cancel",
        json={"cancel_reason": "Error de tipeo"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"
    assert response.json()["cancel_reason"] == "Error de tipeo"

    entry = (
        db_session.query(AuditLog)
        .filter_by(action="prescription_cancelled")
        .one()
    )
    assert entry.entity_id == created["id"]


def test_anular_receta_ya_anulada_es_400(client, doctor_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)

    created = client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    ).json()

    url = f"/api/doctor/patients/{patient.id}/prescriptions/{created['id']}/cancel"
    client.patch(url, json={"cancel_reason": "primera"})
    response = client.patch(url, json={"cancel_reason": "segunda"})

    assert response.status_code == 400


def test_anular_receta_de_otro_medico_es_404(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)
    other = second_doctor(db_session)
    link_patient(db_session, other, patient)

    login_as(client, other.user)
    created = client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    ).json()

    login_as(client, doctor_user)
    response = client.patch(
        f"/api/doctor/patients/{patient.id}/prescriptions/{created['id']}/cancel",
        json={"cancel_reason": "no mio"},
    )

    assert response.status_code == 404


# --- Ordenes medicas (medico) ---


def test_emitir_orden_ok(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)

    response = client.post(
        f"/api/doctor/patients/{patient.id}/orders",
        json={
            "patient_id": patient.id,
            "type": "LAB",
            "studies": "Hemograma completo\nGlucemia",
            "presumptive_diagnosis": "Anemia",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["folio"].startswith("ORD-")
    assert body["type"] == "LAB"
    assert body["status"] == "ACTIVE"
    assert len(db_session.query(MedicalOrder).all()) == 1


def test_emitir_orden_tipo_invalido_es_422(client, doctor_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)

    response = client.post(
        f"/api/doctor/patients/{patient.id}/orders",
        json={"patient_id": patient.id, "type": "NO_EXISTE", "studies": "algo"},
    )

    assert response.status_code == 422


def test_emitir_orden_sin_estudios_es_422(client, doctor_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)

    response = client.post(
        f"/api/doctor/patients/{patient.id}/orders",
        json={"patient_id": patient.id, "type": "LAB", "studies": ""},
    )

    assert response.status_code == 422


def test_anular_orden_ok(client, doctor_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)

    created = client.post(
        f"/api/doctor/patients/{patient.id}/orders",
        json={"patient_id": patient.id, "type": "IMAGING", "studies": "Radiografía"},
    ).json()

    response = client.patch(
        f"/api/doctor/patients/{patient.id}/orders/{created['id']}/cancel",
        json={"cancel_reason": "Duplicada"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"


# --- Paciente ---


def test_paciente_lista_solo_sus_recetas(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)
    otro_paciente = create_patient(db_session, email="otro-pac@example.com")
    link_patient(db_session, doctor, otro_paciente)

    login_as(client, doctor_user)
    client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    )
    client.post(
        f"/api/doctor/patients/{otro_paciente.id}/prescriptions",
        json={"patient_id": otro_paciente.id, "items": [PRESCRIPTION_ITEM]},
    )

    login_as(client, patient)
    response = client.get("/api/prescriptions")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["patient_id"] == patient.id


def test_paciente_descarga_pdf_de_su_receta(client, doctor_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)
    created = client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    ).json()

    login_as(client, patient)
    response = client.get(f"/api/prescriptions/{created['id']}/pdf")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_paciente_no_descarga_receta_ajena_es_404(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)
    otro_paciente = create_patient(db_session, email="intruso@example.com")
    link_patient(db_session, doctor, otro_paciente)

    login_as(client, doctor_user)
    created = client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    ).json()

    login_as(client, otro_paciente)
    response = client.get(f"/api/prescriptions/{created['id']}/pdf")

    assert response.status_code == 404


def test_paciente_lista_y_descarga_su_orden(client, doctor_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)
    created = client.post(
        f"/api/doctor/patients/{patient.id}/orders",
        json={"patient_id": patient.id, "type": "LAB", "studies": "Hemograma"},
    ).json()

    login_as(client, patient)

    listed = client.get("/api/prescriptions/orders")
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    pdf = client.get(f"/api/prescriptions/orders/{created['id']}/pdf")
    assert pdf.status_code == 200
    assert pdf.content.startswith(b"%PDF")


def test_paciente_sin_sesion_no_lista_recetas_es_401(client):
    assert client.get("/api/prescriptions").status_code == 401
    assert client.get("/api/prescriptions/orders").status_code == 401


# --- Admin ---


def test_admin_lista_recetas_y_ordenes(client, doctor_user, admin_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)
    client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    )
    client.post(
        f"/api/doctor/patients/{patient.id}/orders",
        json={"patient_id": patient.id, "type": "LAB", "studies": "Hemograma"},
    )

    login_as(client, admin_user)

    presc = client.get("/api/admin/prescriptions")
    assert presc.status_code == 200
    assert presc.json()["total"] == 1
    assert presc.json()["items"][0]["patient_name"]

    orders = client.get("/api/admin/prescriptions/medical-orders")
    assert orders.status_code == 200
    assert orders.json()["total"] == 1


def test_admin_descarga_pdf_y_audita(client, doctor_user, admin_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)
    created = client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    ).json()

    login_as(client, admin_user)
    response = client.get(f"/api/admin/prescriptions/{created['id']}/pdf")

    assert response.status_code == 200
    assert response.content.startswith(b"%PDF")

    entry = (
        db_session.query(AuditLog)
        .filter_by(action="prescription_pdf_downloaded")
        .one()
    )
    assert entry.entity_id == created["id"]


def test_admin_descarga_pdf_orden(client, doctor_user, admin_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)
    created = client.post(
        f"/api/doctor/patients/{patient.id}/orders",
        json={"patient_id": patient.id, "type": "LAB", "studies": "Hemograma"},
    ).json()

    login_as(client, admin_user)
    response = client.get(
        f"/api/admin/prescriptions/medical-orders/{created['id']}/pdf"
    )

    assert response.status_code == 200
    assert response.content.startswith(b"%PDF")


def test_admin_actividad_de_medico(client, doctor_user, admin_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)
    client.post(
        f"/api/doctor/patients/{patient.id}/prescriptions",
        json={"patient_id": patient.id, "items": [PRESCRIPTION_ITEM]},
    )

    login_as(client, admin_user)
    response = client.get(
        f"/api/admin/prescriptions/doctors/{doctor.id}/activity"
    )

    assert response.status_code == 200
    body = response.json()["items"][0]
    assert body["doctor_id"] == doctor.id
    assert body["prescriptions_issued"] == 1


def test_admin_endpoints_rechazan_a_medico(client, doctor_user, db_session):
    _, patient = set_up(db_session, doctor_user)
    login_as(client, doctor_user)

    assert client.get("/api/admin/prescriptions").status_code == 403
    assert (
        client.get("/api/admin/prescriptions/medical-orders").status_code == 403
    )
