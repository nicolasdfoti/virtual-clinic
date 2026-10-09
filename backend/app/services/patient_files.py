"""Servicio de dominio para los archivos del paciente.

Valida el tipo real por contenido (magic bytes), no por la extension ni por el
Content-Type que declara el cliente. Guarda con nombre aleatorio en disco y
persiste metadatos + SHA256. Append-only: no hay borrado.
"""
from __future__ import annotations

import hashlib
import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.patient_file import PatientFile
from app.models.user import User
from app.services.storage import storage as storage_backend


# Firma (magic bytes) -> (mime, extension). Se comparan contra el comienzo del
# contenido real.
_SIGNATURES: tuple[tuple[bytes, str, str], ...] = (
    (b"%PDF-", "application/pdf", ".pdf"),
    (b"\xff\xd8\xff", "image/jpeg", ".jpg"),
    (b"\x89PNG\r\n\x1a\n", "image/png", ".png"),
)


def _max_file_size_bytes() -> int:
    """Tamano maximo en bytes (usa settings en tiempo de ejecucion, no import-time)."""
    return get_settings().MAX_FILE_SIZE_MB * 1024 * 1024


class PatientFileError(ValueError):
    """Error de negocio al subir/leer un archivo de paciente."""


def detect_mime(content: bytes) -> str | None:
    """Devuelve el mime segun el contenido, o None si no es un tipo permitido."""
    for signature, mime, _extension in _SIGNATURES:
        if content.startswith(signature):
            return mime

    return None


def _extension_for(mime: str) -> str:
    for _signature, allowed_mime, extension in _SIGNATURES:
        if allowed_mime == mime:
            return extension

    raise PatientFileError("Tipo de archivo no permitido.")


def _safe_display_name(original_filename: str) -> str:
    """Nombre a mostrar: sin componentes de ruta y acotado a 255 chars."""
    name = Path(original_filename or "").name.strip()

    if not name:
        return "archivo"

    return name[:255]


def upload_file(
    db: Session,
    patient_id: int,
    uploader: User,
    original_filename: str,
    content: bytes,
) -> PatientFile:
    """Valida y guarda un archivo de la historia del paciente.

    Args:
        patient_id: Dueño de la historia (a quien pertenece el archivo).
        uploader: Usuario que sube (paciente o medico).
        original_filename: Nombre original, solo informativo.
        content: Bytes del archivo.
    """
    if not content:
        raise PatientFileError("El archivo está vacío.")

    max_bytes = _max_file_size_bytes()
    if len(content) > max_bytes:
        raise PatientFileError(
            f"El archivo supera el máximo de {get_settings().MAX_FILE_SIZE_MB} MB."
        )

    mime = detect_mime(content)

    if mime is None:
        raise PatientFileError("Solo se aceptan archivos PDF, JPG o PNG.")

    extension = _extension_for(mime)
    sha256 = hashlib.sha256(content).hexdigest()

    # Nombre aleatorio en disco. Nunca se usa el nombre original para la ruta.
    relative_name = (
        f"clinical_files/{patient_id}/{uuid.uuid4().hex}{extension}"
    )
    storage_path, saved_sha256 = storage_backend.save(content, relative_name)

    patient_file = PatientFile(
        patient_id=patient_id,
        uploaded_by_user_id=uploader.id,
        original_filename=_safe_display_name(original_filename),
        mime_type=mime,
        size=len(content),
        sha256=saved_sha256 or sha256,
        storage_path=storage_path,
    )

    db.add(patient_file)
    db.commit()
    db.refresh(patient_file)

    return patient_file


def list_files(
    db: Session,
    patient_id: int,
    limit: int,
    offset: int,
) -> tuple[list[PatientFile], int]:
    """Archivos del paciente, mas recientes primero."""
    query = db.query(PatientFile).filter(PatientFile.patient_id == patient_id)

    total = query.count()

    rows = (
        query.order_by(PatientFile.created_at.desc(), PatientFile.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return rows, total


def get_file(db: Session, patient_id: int, file_id: int) -> PatientFile | None:
    """Archivo puntual del paciente (None si no existe o es de otro)."""
    patient_file = db.get(PatientFile, file_id)

    if patient_file is None or patient_file.patient_id != patient_id:
        return None

    return patient_file


def open_file(patient_file: PatientFile):
    """Abre el binario para descargarlo. Falla si la fila apunta a algo inexistente."""
    if not storage_backend.exists(patient_file.storage_path):
        raise PatientFileError("El archivo no está disponible.")

    return storage_backend.open(patient_file.storage_path)
