"""Schemas de notas de evolucion clinica."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ClinicalNoteCreate(BaseModel):
    """Datos para crear una nota de evolucion."""

    content: str = Field(
        ...,
        min_length=1,
        max_length=20000,
        description="Contenido de la nota (texto libre).",
    )
    appointment_id: Optional[int] = Field(
        default=None,
        description="ID del turno asociado (opcional).",
    )


class ClinicalNoteAmendRequest(BaseModel):
    """Datos para agregar una adenda a una nota existente."""

    content: str = Field(
        ...,
        min_length=1,
        max_length=20000,
        description="Contenido de la adenda (texto libre).",
    )


class ClinicalNoteResponse(BaseModel):
    """Nota de evolucion en respuesta."""

    id: int
    patient_id: int
    doctor_id: int
    doctor_name: Optional[str] = None
    appointment_id: Optional[int]
    content: str
    amends_note_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class ClinicalNoteListResponse(BaseModel):
    items: list[ClinicalNoteResponse]
    total: int
    limit: int
    offset: int
