"""Notas clinicas desde el lado del paciente.

Por defecto, el paciente NO ve las notas: el endpoint devuelve 403/condicionado
por la configuracion PATIENT_VISIBLE_NOTES. Cuando esta habilitada, el paciente
puede listar las notas de su propia historia.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database import get_db
from app.dependencies import get_current_ready_user
from app.models.enums import Role
from app.models.user import User
from app.schemas.clinical_note import ClinicalNoteListResponse, ClinicalNoteResponse
from app.services import clinical_notes

router = APIRouter(tags=["Patient - Clinical notes"])


@router.get("/patients/me/clinical-notes", response_model=ClinicalNoteListResponse)
def list_my_clinical_notes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Lista mis notas de evolucion.

    Solo disponible si la clinica habilito la visibilidad para el paciente
    (`PATIENT_VISIBLE_NOTES=True`). Esta nota no es para el paciente: por eso
    esta oculta por defecto (uso interno/consulta con consentimiento).
    """
    if current_user.role != Role.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo pacientes pueden acceder a sus notas clinicas.",
        )

    if not get_settings().PATIENT_VISIBLE_NOTES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La visualizacion de la historia clinica para el paciente no esta habilitada.",
        )

    rows, total = clinical_notes.list_notes(db, current_user.id, limit, offset)

    items = []
    for note in rows:
        items.append(
            ClinicalNoteResponse(
                id=note.id,
                patient_id=note.patient_id,
                doctor_id=note.doctor_id,
                doctor_name=(
                    clinical_notes.doctor_display_name(note.doctor)
                    if note.doctor is not None
                    else None
                ),
                appointment_id=note.appointment_id,
                content=note.content,
                amends_note_id=note.amends_note_id,
                created_at=note.created_at,
            )
        )

    return ClinicalNoteListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )
