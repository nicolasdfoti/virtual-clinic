from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import MedicalOrderStatus, MedicalOrderType, PrescriptionStatus

if TYPE_CHECKING:
    from app.models.appointment import Appointment
    from app.models.doctor import Doctor
    from app.models.user import User


class Prescription(Base):
    """Receta / indicacion medica emitida por un medico para un paciente.

    Inmutable tras creacion: solo anulacion con motivo.
    """

    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Folio unico: RX-YYYY-NNNNNN (ej: RX-2026-000123)
    folio: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )

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

    # Turno asociado (opcional, para trazabilidad)
    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id"),
        index=True,
        nullable=True,
    )

    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    status: Mapped[PrescriptionStatus] = mapped_column(
        SAEnum(PrescriptionStatus, name="prescription_status"),
        nullable=False,
        default=PrescriptionStatus.ACTIVE,
        server_default=PrescriptionStatus.ACTIVE.name,
    )

    cancel_reason: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # Snapshot JSON del medico al momento de emitir
    doctor_snapshot: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Snapshot JSON del paciente al momento de emitir
    patient_snapshot: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    patient: Mapped["User"] = relationship(foreign_keys=[patient_id])
    doctor: Mapped["Doctor"] = relationship(foreign_keys=[doctor_id])
    appointment: Mapped["Appointment | None"] = relationship()

    items: Mapped[list["PrescriptionItem"]] = relationship(
        back_populates="prescription",
        cascade="all, delete-orphan",
    )


class PrescriptionItem(Base):
    """Item (medicamento) de una receta."""

    __tablename__ = "prescription_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    prescription_id: Mapped[int] = mapped_column(
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Nombre del medicamento (no hay catalogo: texto libre)
    medication: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    # Dosis (ej: "500 mg", "10 mg/mL")
    dose: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    # Frecuencia (ej: "Cada 8 horas", "1 comprimido por la manana")
    frequency: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    # Duracion (ej: "7 dias", "30 dias")
    duration: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    # Indicaciones adicionales (opcional)
    instructions: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    prescription: Mapped["Prescription"] = relationship(back_populates="items")


class MedicalOrder(Base):
    """Orden medica (laboratorio, imagenes, interconsulta, otros).

    Inmutable tras creacion: solo anulacion con motivo.
    """

    __tablename__ = "medical_orders"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Folio unico: ORD-YYYY-NNNNNN (ej: ORD-2026-000123)
    folio: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )

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

    # Turno asociado (opcional)
    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id"),
        index=True,
        nullable=True,
    )

    type: Mapped[MedicalOrderType] = mapped_column(
        SAEnum(MedicalOrderType, name="medical_order_type"),
        nullable=False,
    )

    # Estudios solicitados (texto libre)
    studies: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Diagnostico presuntivo
    presumptive_diagnosis: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    status: Mapped[MedicalOrderStatus] = mapped_column(
        SAEnum(MedicalOrderStatus, name="medical_order_status"),
        nullable=False,
        default=MedicalOrderStatus.ACTIVE,
        server_default=MedicalOrderStatus.ACTIVE.name,
    )

    cancel_reason: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # Snapshot JSON del medico al momento de emitir
    doctor_snapshot: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Snapshot JSON del paciente al momento de emitir
    patient_snapshot: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    patient: Mapped["User"] = relationship(foreign_keys=[patient_id])
    doctor: Mapped["Doctor"] = relationship(foreign_keys=[doctor_id])
    appointment: Mapped["Appointment | None"] = relationship()