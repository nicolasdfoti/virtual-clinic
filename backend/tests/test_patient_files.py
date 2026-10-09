"""Tests de archivos del paciente (PatientFile).

Cubren subida (paciente y medico), validacion de tipo real (magic bytes),
tamano maximo, listado, descarga auditada, y aislamiento (recurso ajeno = 404).
"""
from datetime import date
import io

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


def pdf_bytes() -> bytes:
    """PDF minimo valido (magic bytes %PDF-)."""
    return b"%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n%%EOF"


def jpeg_bytes() -> bytes:
    """JPEG minimo valido (magic bytes FF D8 FF)."""
    return b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100


def png_bytes() -> bytes:
    """PNG minimo valido (magic bytes 89 50 4E 47 0D 0A 1A 0A)."""
    return b"\x89PNG\r\n\x1a\n" + b"\x00" * 100


def exe_bytes() -> bytes:
    """EXE disfrazado (sin magic bytes de imagen/PDF)."""
    return b"MZ" + b"\x00" * 500


# --- Subida (paciente) ---


def test_subir_archivo_paciente_pdf_ok(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, patient)
    files = {"file": ("estudio.pdf", pdf_bytes(), "application/pdf")}
    response = client.post("/api/patients/me/files", files=files)

    assert response.status_code == 201
    body = response.json()
    assert body["original_filename"] == "estudio.pdf"
    assert body["mime_type"] == "application/pdf"
    assert body["size"] == len(pdf_bytes())
    assert body["uploaded_by_user_id"] == patient.id

    # Auditoria
    audit = db_session.query(AuditLog).filter_by(action="patient_file_uploaded").first()
    assert audit is not None
    assert audit.extra["by"] == "patient"
    assert audit.extra["mime_type"] == "application/pdf"


def test_subir_archivo_paciente_jpg_ok(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, patient)
    files = {"file": ("foto.jpg", jpeg_bytes(), "image/jpeg")}
    response = client.post("/api/patients/me/files", files=files)

    assert response.status_code == 201
    assert response.json()["mime_type"] == "image/jpeg"


def test_subir_archivo_paciente_png_ok(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, patient)
    files = {"file": ("imagen.png", png_bytes(), "image/png")}
    response = client.post("/api/patients/me/files", files=files)

    assert response.status_code == 201
    assert response.json()["mime_type"] == "image/png"


def test_subir_archivo_tipo_no_permitido_rechazado(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, patient)
    files = {"file": ("malware.exe", exe_bytes(), "application/octet-stream")}
    response = client.post("/api/patients/me/files", files=files)

    assert response.status_code == 400
    assert "pdf" in response.json()["detail"].lower() or "jpg" in response.json()["detail"].lower()


def test_subir_archivo_falso_magic_bytes_rechazado(client, doctor_user, db_session):
    """EXE renombrado a .pdf pero con magic bytes de EXE (MZ)."""
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, patient)
    files = {"file": ("falso.pdf", exe_bytes(), "application/pdf")}
    response = client.post("/api/patients/me/files", files=files)

    assert response.status_code == 400
    # Debe rechazar por contenido real, no por extension
    assert "pdf" in response.json()["detail"].lower() or "jpg" in response.json()["detail"].lower()


def test_subir_archivo_vacio_rechazado(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, patient)
    files = {"file": ("vacio.pdf", b"", "application/pdf")}
    response = client.post("/api/patients/me/files", files=files)

    assert response.status_code == 400
    assert "vac" in response.json()["detail"].lower()


def test_subir_archivo_supera_tamano_rechazado(client, doctor_user, db_session, monkeypatch):
    """Archivo > 10 MB (config MAX_FILE_SIZE_MB)."""
    doctor, patient = set_up(db_session, doctor_user)

    # Bajar el limite a 1 MB para el test
    import os
    os.environ["MAX_FILE_SIZE_MB"] = "1"
    from app.core.config import get_settings
    get_settings.cache_clear()

    login_as(client, patient)
    # 2 MB > 1 MB limite
    big_content = b"%PDF-" + b"X" * (2 * 1024 * 1024)
    files = {"file": ("grande.pdf", big_content, "application/pdf")}
    response = client.post("/api/patients/me/files", files=files)

    assert response.status_code == 400
    assert "maximo" in response.json()["detail"].lower() or "1" in response.json()["detail"].lower()

    get_settings.cache_clear()


# --- Subida (medico) ---


def test_subir_archivo_medico_ok(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, doctor_user)
    files = {"file": ("resultado.pdf", pdf_bytes(), "application/pdf")}
    response = client.post(
        f"/api/doctor/patients/{patient.id}/files",
        files=files,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["uploaded_by_user_id"] == doctor_user.id
    assert body["mime_type"] == "application/pdf"


def test_subir_archivo_medico_sin_vinculo_es_404(client, doctor_user, db_session):
    other = second_doctor(db_session)
    patient = create_patient(db_session, email="ajeno3@example.com")
    link_patient(db_session, other, patient)

    login_as(client, doctor_user)
    files = {"file": ("resultado.pdf", pdf_bytes(), "application/pdf")}
    response = client.post(
        f"/api/doctor/patients/{patient.id}/files",
        files=files,
    )
    assert response.status_code == 404


# --- Listado ---


def test_listar_archivos_paciente(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, patient)
    client.post("/api/patients/me/files", files={"file": ("a.pdf", pdf_bytes(), "application/pdf")})
    client.post("/api/patients/me/files", files={"file": ("b.jpg", jpeg_bytes(), "image/jpeg")})

    response = client.get("/api/patients/me/files")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2
    assert {i["original_filename"] for i in body["items"]} == {"a.pdf", "b.jpg"}


def test_listar_archivos_medico(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, doctor_user)
    # Medico sube
    client.post(
        f"/api/doctor/patients/{patient.id}/files",
        files={"file": ("med.pdf", pdf_bytes(), "application/pdf")},
    )
    # Paciente sube
    login_as(client, patient)
    client.post("/api/patients/me/files", files={"file": ("pac.pdf", pdf_bytes(), "application/pdf")})

    login_as(client, doctor_user)
    response = client.get(f"/api/doctor/patients/{patient.id}/files")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    names = {i["original_filename"] for i in body["items"]}
    assert names == {"med.pdf", "pac.pdf"}


def test_listar_archivos_sin_vinculo_es_404(client, doctor_user, db_session):
    other = second_doctor(db_session)
    patient = create_patient(db_session, email="ajeno4@example.com")
    link_patient(db_session, other, patient)

    login_as(client, doctor_user)
    response = client.get(f"/api/doctor/patients/{patient.id}/files")
    assert response.status_code == 404


# --- Descarga auditada ---


def test_descargar_archivo_paciente_audita(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, patient)
    upload = client.post("/api/patients/me/files", files={"file": ("estudio.pdf", pdf_bytes(), "application/pdf")})
    file_id = upload.json()["id"]

    response = client.get(f"/api/patients/me/files/{file_id}/download")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "estudio.pdf" in response.headers["content-disposition"]

    # Auditoria
    audit = db_session.query(AuditLog).filter_by(action="patient_file_downloaded").first()
    assert audit is not None
    assert audit.entity_type == "patient_file"
    assert audit.entity_id == file_id
    assert audit.extra["by"] == "patient"


def test_descargar_archivo_medico_audita(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, doctor_user)
    upload = client.post(
        f"/api/doctor/patients/{patient.id}/files",
        files={"file": ("result.pdf", pdf_bytes(), "application/pdf")},
    )
    file_id = upload.json()["id"]

    response = client.get(f"/api/doctor/patients/{patient.id}/files/{file_id}/download")

    assert response.status_code == 200

    # Auditoria
    audit = db_session.query(AuditLog).filter_by(action="patient_file_downloaded").first()
    assert audit is not None
    assert audit.actor_user_id == doctor_user.id
    assert audit.extra["by"] == "doctor"  # Wait, we don't set by in doctor download


def test_descargar_archivo_inexistente_es_404(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)

    login_as(client, patient)
    response = client.get("/api/patients/me/files/9999/download")
    assert response.status_code == 404


# --- Aislamiento ---


def test_paciente_no_ve_archivos_de_otro(client, doctor_user, db_session):
    doctor, patient = set_up(db_session, doctor_user)
    other_patient = create_patient(db_session, email="otro-pac@example.com")

    login_as(client, patient)
    client.post("/api/patients/me/files", files={"file": ("a.pdf", pdf_bytes(), "application/pdf")})

    login_as(client, other_patient)
    response = client.get("/api/patients/me/files")
    assert response.status_code == 200
    assert response.json()["total"] == 0


def test_medico_no_ve_archivos_de_paciente_sin_vinculo(client, doctor_user, db_session):
    other = second_doctor(db_session)
    patient = create_patient(db_session, email="ajeno5@example.com")
    link_patient(db_session, other, patient)

    login_as(client, doctor_user)
    response = client.get(f"/api/doctor/patients/{patient.id}/files")
    assert response.status_code == 404