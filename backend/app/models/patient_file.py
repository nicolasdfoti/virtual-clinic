from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class PatientFile(Base):
    """Archivo subido a la historia del paciente (estudio, resultado, etc.).

    Lo puede subir el propio paciente o un medico con relacion activa. Es
    inmutable: no hay UPDATE ni DELETE. El binario vive fuera de lo servido
    estaticamente, con nombre aleatorio en disco; en la base solo se guarda la
    ruta relativa, el hash SHA256 y los metadatos.
    """

    __tablename__ = "patient_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )

    # Usuario que hizo la subida (paciente o medico). Se guarda el user_id, no
    # el doctor_id, porque puede ser cualquiera de los dos roles.
    uploaded_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )

    # Nombre original que traia el archivo (solo para mostrar; nunca se usa
    # para armar la ruta en disco).
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)

    # Mime validado por contenido (magic bytes), no por el header del cliente.
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    size: Mapped[int] = mapped_column(Integer, nullable=False)

    sha256: Mapped[str] = mapped_column(String(64), nullable=False)

    # Ruta relativa dentro de STORAGE_DIR.
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    patient: Mapped["User"] = relationship(foreign_keys=[patient_id])
    uploaded_by: Mapped["User"] = relationship(foreign_keys=[uploaded_by_user_id])
