from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.doctor import Doctor
    from app.models.user import User


class ClinicalNote(Base):
    """Nota de evolucion clinica escrita por un medico.

    Es inmutable: solo se agregan filas (INSERT). Para corregir o ampliar una
    nota se crea una adenda con `amends_note_id` apuntando a la original. Nunca
    se hace UPDATE ni DELETE: la historia clinica es un registro append-only.
    """

    __tablename__ = "clinical_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )

    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id"),
        index=True,
        nullable=False,
    )

    # Turno asociado (opcional, para trazabilidad).
    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id"),
        index=True,
        nullable=True,
    )

    # Contenido de la nota (texto libre).
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Si esta fila es una adenda, apunta a la nota que corrige/amplia.
    amends_note_id: Mapped[int | None] = mapped_column(
        ForeignKey("clinical_notes.id"),
        index=True,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    patient: Mapped["User"] = relationship(foreign_keys=[patient_id])
    doctor: Mapped["Doctor"] = relationship(foreign_keys=[doctor_id])

    amendments: Mapped[list["ClinicalNote"]] = relationship(
        back_populates="amends",
        foreign_keys=[amends_note_id],
        cascade="all, delete-orphan",
    )
    amends: Mapped["ClinicalNote | None"] = relationship(
        back_populates="amendments",
        remote_side=[id],
        foreign_keys=[amends_note_id],
    )
