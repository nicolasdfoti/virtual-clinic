"""Tests de /api/doctor/patients.

Cubren el listado (solo vinculos ACTIVE del medico), el detalle en solo lectura
con su auditoria y el alta de vinculo por DNI o email.
"""
from datetime import date

from app.models.audit_log import AuditLog
from app.models.care_relationship import CareRelationship
from app.models.doctor import Doctor
from app.models.enums import CareRelationshipStatus, Role
from app.models.patient_profile import PatientProfile
from app.models.user import User

from tests.conftest import create_doctor, create_user, link_patient, login_as


DOCTOR_PATIENTS_PATH = "/api/doctor/patients"


def create_patient(
    session,
    email: str,
    first_name: str = "Paciente",
    last_name: str = "Demo",
    dni: str | None = None,
    insurance_provider: str | None = None,
    phone: str | None = None,
) -> User:
    user = create_user(
        session,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )

    profile = PatientProfile(
        user_id=user.id,
        dni=dni,
        insurance_provider=insurance_provider,
        phone=phone,
        birth_date=date(1990, 5, 20),
    )

    session.add(profile)
    session.commit()
    session.refresh(user)

    return user


def doctor_row(session, doctor_user: User) -> Doctor:
    return session.query(Doctor).filter_by(user_id=doctor_user.id).one()


def second_doctor(session) -> Doctor:
    """Medico con su propia fila, para probar aislamiento entre medicos."""
    user = create_user(
        session,
        email="otro-medico@example.com",
        role=Role.DOCTOR,
        first_name="Otro",
        last_name="Médico",
    )

    return create_doctor(session, user, license_number="MP 200")


def test_listado_sin_sesion_es_401(client):
    response = client.get(DOCTOR_PATIENTS_PATH)

    assert response.status_code == 401


def test_listado_con_rol_paciente_es_403(client, doctor_user, db_session):
    patient = create_patient(db_session, email="pac@example.com")
    login_as(client, patient)

    response = client.get(DOCTOR_PATIENTS_PATH)

    assert response.status_code == 403


def test_listado_solo_devuelve_vinculos_activos(client, doctor_user, db_session):
    doctor = doctor_row(db_session, doctor_user)

    active = create_patient(
        db_session, email="activo@example.com", first_name="Activo"
    )
    ended = create_patient(db_session, email="baja@example.com", first_name="Baja")
    sin_vinculo = create_patient(
        db_session, email="suelto@example.com", first_name="Suelto"
    )

    link_patient(db_session, doctor, active)
    link_patient(db_session, doctor, ended, status=CareRelationshipStatus.ENDED)

    login_as(client, doctor_user)
    response = client.get(DOCTOR_PATIENTS_PATH)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert [item["id"] for item in body["items"]] == [active.id]
    assert body["items"][0]["next_appointment"] is None
    assert sin_vinculo.id not in [item["id"] for item in body["items"]]


def test_listado_no_mezcla_pacientes_de_otro_medico(
    client, doctor_user, db_session
):
    doctor = doctor_row(db_session, doctor_user)
    other = second_doctor(db_session)

    mio = create_patient(db_session, email="mio@example.com", first_name="Mio")
    ajeno = create_patient(db_session, email="ajeno@example.com", first_name="Ajeno")

    link_patient(db_session, doctor, mio)
    link_patient(db_session, other, ajeno)

    login_as(client, doctor_user)
    response = client.get(DOCTOR_PATIENTS_PATH)

    assert response.status_code == 200
    ids = [item["id"] for item in response.json()["items"]]
    assert ids == [mio.id]


def test_listado_busca_por_nombre_y_dni(client, doctor_user, db_session):
    doctor = doctor_row(db_session, doctor_user)

    target = create_patient(
        db_session,
        email="buscado@example.com",
        first_name="Valentina",
        last_name="Gómez",
        dni="30111222",
        insurance_provider="OSDE",
    )
    create_patient(
        db_session,
        email="otro@example.com",
        first_name="Jorge",
        last_name="Pérez",
        dni="28999888",
    )

    link_patient(db_session, doctor, target)

    login_as(client, doctor_user)

    by_name = client.get(DOCTOR_PATIENTS_PATH, params={"q": "Valentina"})
    assert by_name.status_code == 200
    assert [item["id"] for item in by_name.json()["items"]] == [target.id]

    by_dni = client.get(DOCTOR_PATIENTS_PATH, params={"q": "30111222"})
    assert by_dni.status_code == 200
    assert [item["id"] for item in by_dni.json()["items"]] == [target.id]

    no_match = client.get(DOCTOR_PATIENTS_PATH, params={"q": "ZZZ"})
    assert no_match.json()["total"] == 0


def test_detalle_devuelve_perfil_y_registra_auditoria(
    client, doctor_user, db_session
):
    doctor = doctor_row(db_session, doctor_user)

    patient = create_patient(
        db_session,
        email="detalle@example.com",
        first_name="Sofía",
        last_name="Ledesma",
        dni="31222333",
        insurance_provider="Swiss Medical",
        phone="1145550000",
    )

    link_patient(db_session, doctor, patient)

    login_as(client, doctor_user)
    response = client.get(f"{DOCTOR_PATIENTS_PATH}/{patient.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["first_name"] == "Sofía"
    assert body["dni"] == "31222333"
    assert body["is_complete"] is True

    entry = db_session.query(AuditLog).one()
    assert entry.action == "patient_profile_viewed"
    assert entry.entity_type == "patient_profile"
    assert entry.entity_id == patient.id
    assert entry.actor_user_id == doctor_user.id
    assert entry.extra is None


def test_detalle_sin_vinculo_activo_es_404(client, doctor_user, db_session):
    other = second_doctor(db_session)
    patient = create_patient(db_session, email="ajeno@example.com")

    link_patient(db_session, other, patient)

    login_as(client, doctor_user)
    response = client.get(f"{DOCTOR_PATIENTS_PATH}/{patient.id}")

    assert response.status_code == 404


def test_detalle_paciente_inexistente_es_404(client, doctor_user):
    login_as(client, doctor_user)
    response = client.get(f"{DOCTOR_PATIENTS_PATH}/99999")

    assert response.status_code == 404


def test_detalle_vinculo_finalizado_es_404(client, doctor_user, db_session):
    doctor = doctor_row(db_session, doctor_user)
    patient = create_patient(db_session, email="baja@example.com")

    link_patient(db_session, doctor, patient, status=CareRelationshipStatus.ENDED)

    login_as(client, doctor_user)
    response = client.get(f"{DOCTOR_PATIENTS_PATH}/{patient.id}")

    assert response.status_code == 404


def test_vincular_por_dni(client, doctor_user, db_session):
    patient = create_patient(
        db_session, email="dni@example.com", dni="33444555"
    )

    login_as(client, doctor_user)
    response = client.post(DOCTOR_PATIENTS_PATH, json={"dni": "33444555"})

    assert response.status_code == 201
    assert response.json()["id"] == patient.id

    relationship = db_session.query(CareRelationship).one()
    assert relationship.patient_id == patient.id
    assert relationship.status == CareRelationshipStatus.ACTIVE

    entry = db_session.query(AuditLog).one()
    assert entry.action == "patient_linked"
    assert entry.entity_type == "care_relationship"
    assert entry.entity_id == relationship.id


def test_vincular_por_email_normaliza_mayusculas(
    client, doctor_user, db_session
):
    patient = create_patient(db_session, email="mayus@example.com")

    login_as(client, doctor_user)
    response = client.post(
        DOCTOR_PATIENTS_PATH, json={"email": "Mayus@Example.com"}
    )

    assert response.status_code == 201
    assert response.json()["id"] == patient.id


def test_vincular_paciente_inexistente_es_404(client, doctor_user):
    login_as(client, doctor_user)
    response = client.post(DOCTOR_PATIENTS_PATH, json={"dni": "99999999"})

    assert response.status_code == 404


def test_vincular_usuario_no_paciente_es_404(client, doctor_user, db_session):
    otro_medico = second_doctor(db_session)

    login_as(client, doctor_user)
    response = client.post(
        DOCTOR_PATIENTS_PATH, json={"email": otro_medico.user.email}
    )

    assert response.status_code == 404


def test_vincular_ya_activo_es_409(client, doctor_user, db_session):
    doctor = doctor_row(db_session, doctor_user)
    patient = create_patient(db_session, email="ya@example.com", dni="34555666")

    link_patient(db_session, doctor, patient)

    login_as(client, doctor_user)
    response = client.post(DOCTOR_PATIENTS_PATH, json={"dni": "34555666"})

    assert response.status_code == 409
    assert db_session.query(CareRelationship).count() == 1


def test_vincular_reactiva_vinculo_finalizado(client, doctor_user, db_session):
    doctor = doctor_row(db_session, doctor_user)
    patient = create_patient(
        db_session, email="reactivar@example.com", dni="35666777"
    )

    relationship = link_patient(
        db_session, doctor, patient, status=CareRelationshipStatus.ENDED
    )

    login_as(client, doctor_user)
    response = client.post(DOCTOR_PATIENTS_PATH, json={"dni": "35666777"})

    assert response.status_code == 201

    db_session.refresh(relationship)
    assert relationship.status == CareRelationshipStatus.ACTIVE
    assert db_session.query(CareRelationship).count() == 1


def test_vincular_sin_identificador_es_422(client, doctor_user):
    login_as(client, doctor_user)
    response = client.post(DOCTOR_PATIENTS_PATH, json={})

    assert response.status_code == 422
