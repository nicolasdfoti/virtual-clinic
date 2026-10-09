"""Servicio de dominio para la historia clinica (notas de evolucion).

Registro append-only: solo se crean notas y adendas. Nunca se actualiza ni se
borra una nota.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.clinical_note import ClinicalNote
from app.models.doctor import Doctor


class ClinicalNoteError(ValueError):
    """Error de negocio al operar sobre notas clinicas."""


def doctor_display_name(doctor: Doctor) -> str:
    """Nombre del medico para mostrar en la timeline."""
    user = doctor.user
    if user is None:
        return "Médico"

    return f"{user.first_name} {user.last_name}".strip()


def _validate_appointment(
    db: Session,
    appointment_id: int | None,
    doctor: Doctor,
    patient_id: int,
) -> None:
    """Si viene turno, tiene que ser de este medico y este paciente."""
    if appointment_id is None:
        return

    appointment = db.get(Appointment, appointment_id)

    if (
        appointment is None
        or appointment.doctor_id != doctor.id
        or appointment.patient_id != patient_id
    ):
        raise ClinicalNoteError("El turno indicado no corresponde al paciente.")


def create_note(
    db: Session,
    doctor: Doctor,
    patient_id: int,
    content: str,
    appointment_id: int | None = None,
) -> ClinicalNote:
    """Crea una nota de evolucion nueva (sin adenda)."""
    _validate_appointment(db, appointment_id, doctor, patient_id)

    note = ClinicalNote(
        patient_id=patient_id,
        doctor_id=doctor.id,
        appointment_id=appointment_id,
        content=content.strip(),
        amends_note_id=None,
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


def create_amendment(
    db: Session,
    doctor: Doctor,
    patient_id: int,
    note_id: int,
    content: str,
) -> ClinicalNote:
    """Agrega una adenda que corrige/amplia una nota existente.

    No toca la nota original: crea una fila nueva apuntando a ella.
    """
    original = db.get(ClinicalNote, note_id)

    if original is None or original.patient_id != patient_id:
        raise ClinicalNoteError("No encontramos esa nota.")

    amendment = ClinicalNote(
        patient_id=patient_id,
        doctor_id=doctor.id,
        appointment_id=original.appointment_id,
        content=content.strip(),
        amends_note_id=original.id,
    )

    db.add(amendment)
    db.commit()
    db.refresh(amendment)

    return amendment


def list_notes(
    db: Session,
    patient_id: int,
    limit: int,
    offset: int,
) -> tuple[list[ClinicalNote], int]:
    """Notas del paciente (de cualquier medico), mas recientes primero."""
    query = db.query(ClinicalNote).filter(ClinicalNote.patient_id == patient_id)

    total = query.count()

    rows = (
        query.order_by(ClinicalNote.created_at.desc(), ClinicalNote.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return rows, total


def get_note(db: Session, patient_id: int, note_id: int) -> ClinicalNote | None:
    """Nota puntual del paciente (404 logico si no existe o es de otro)."""
    note = db.get(ClinicalNote, note_id)

    if note is None or note.patient_id != patient_id:
        return None

    return note
