"""Schemas de archivos del paciente."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PatientFileResponse(BaseModel):
    """Archivo de la historia del paciente (sin ruta ni hash)."""

    id: int
    patient_id: int
    uploaded_by_user_id: int
    uploaded_by_name: Optional[str] = None
    original_filename: str
    mime_type: str
    size: int
    created_at: datetime

    class Config:
        from_attributes = True


class PatientFileListResponse(BaseModel):
    items: list[PatientFileResponse]
    total: int
    limit: int
    offset: int
