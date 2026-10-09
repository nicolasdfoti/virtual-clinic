"""Routers de notas clinicas para el medico.

Solo un medico con relacion ACTIVE puede ver y registrar notas de sus pacientes.
Las notas son append-only: se pueden crear y se pueden agregar adendas, nunca
se modifican ni se borran.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.doctor import Doctor
from app.schemas.clinical_note import (
    ClinicalNoteAmendRequest,
    ClinicalNoteCreate,
    ClinicalNoteListResponse,
    ClinicalNoteResponse,
)
from app.services import audit, clinical_notes
from app.services.clinical_notes import ClinicalNoteError

from .doctor import PATIENT_NOT_FOUND_DETAIL, _active_relationship

router = APIRouter(tags=["Doctor - Clinical notes"])

ENTITY_TYPE_NOTE = "clinical_note"


@router.post(
    "/doctor/patients/{patient_id}/clinical-notes",
    response_model=ClinicalNoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_note(
    patient_id: int,
    payload: ClinicalNoteCreate,
    request: Request,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Crea una nueva nota de evolucion para el paciente."""
    if _active_relationship(db, doctor.id, patient_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PATIENT_NOT_FOUND_DETAIL,
        )

    try:
        note = clinical_notes.create_note(
            db=db,
            doctor=doctor,
            patient_id=patient_id,
            content=payload.content,
            appointment_id=payload.appointment_id,
        )
    except ClinicalNoteError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    audit.log(
        db,
        actor_user_id=doctor.user_id,
        action="clinical_note_created",
        entity_type=ENTITY_TYPE_NOTE,
        entity_id=note.id,
        ip=audit.client_ip(request),
        metadata={
            "patient_id": patient_id,
            "doctor_id": doctor.id,
            "has_appointment": payload.appointment_id is not None,
        },
    )

    return ClinicalNoteResponse(
        id=note.id,
        patient_id=note.patient_id,
        doctor_id=note.doctor_id,
        doctor_name=clinical_notes.doctor_display_name(doctor),
        appointment_id=note.appointment_id,
        content=note.content,
        amends_note_id=note.amends_note_id,
        created_at=note.created_at,
    )


@router.post(
    "/doctor/patients/{patient_id}/clinical-notes/{note_id}/amend",
    response_model=ClinicalNoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def amend_note(
    patient_id: int,
    note_id: int,
    payload: ClinicalNoteAmendRequest,
    request: Request,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Agrega una adenda a una nota existente."""
    if _active_relationship(db, doctor.id, patient_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PATIENT_NOT_FOUND_DETAIL,
        )

    try:
        amendment = clinical_notes.create_amendment(
            db=db,
            doctor=doctor,
            patient_id=patient_id,
            note_id=note_id,
            content=payload.content,
        )
    except ClinicalNoteError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    audit.log(
        db,
        actor_user_id=doctor.user_id,
        action="clinical_note_amended",
        entity_type=ENTITY_TYPE_NOTE,
        entity_id=amendment.id,
        ip=audit.client_ip(request),
        metadata={
            "patient_id": patient_id,
            "amends_note_id": note_id,
            "doctor_id": doctor.id,
        },
    )

    return ClinicalNoteResponse(
        id=amendment.id,
        patient_id=amendment.patient_id,
        doctor_id=amendment.doctor_id,
        doctor_name=clinical_notes.doctor_display_name(doctor),
        appointment_id=amendment.appointment_id,
        content=amendment.content,
        amends_note_id=amendment.amends_note_id,
        created_at=amendment.created_at,
    )


@router.get(
    "/doctor/patients/{patient_id}/clinical-notes",
    response_model=ClinicalNoteListResponse,
)
def list_notes(
    patient_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Lista las notas de evolucion del paciente (mas recientes primero)."""
    if _active_relationship(db, doctor.id, patient_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PATIENT_NOT_FOUND_DETAIL,
        )

    rows, total = clinical_notes.list_notes(db, patient_id, limit, offset)

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
