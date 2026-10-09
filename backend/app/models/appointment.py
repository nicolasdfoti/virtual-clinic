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
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import AppointmentModality, AppointmentStatus

if TYPE_CHECKING:
    from app.models.doctor import Doctor
    from app.models.user import User


class Appointment(Base):
    """Turno reservado entre un paciente y un medico.

    `starts_at` / `ends_at` son instantes en UTC (timestamptz). La zona de la
    clinica se usa solo para calcular y mostrar.

    El no-solapamiento de turnos activos del mismo medico lo garantiza un
    constraint de exclusion de Postgres (`EXCLUDE USING gist`), que no se puede
    expresar en el modelo ni en SQLite (que solo se usa en tests). Por eso vive
    solo en la migracion `b1d2...`: los tests de SQLite cubren la logica de
    solapamiento a nivel aplicacion, y el constraint es la red final en
    productivo.
    """

    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
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

    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )

    ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    status: Mapped[AppointmentStatus] = mapped_column(
        SAEnum(AppointmentStatus, name="appointment_status"),
        nullable=False,
        default=AppointmentStatus.SCHEDULED,
        server_default=AppointmentStatus.SCHEDULED.name,
    )

    reason: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    modality: Mapped[AppointmentModality] = mapped_column(
        SAEnum(AppointmentModality, name="appointment_modality"),
        nullable=False,
        default=AppointmentModality.VIDEO,
        server_default=AppointmentModality.VIDEO.name,
    )

    # Link externo (Meet/Zoom/Jitsi) que carga el medico. La plataforma no crea
    # ni aloja videollamadas.
    video_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    cancelled_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    cancel_reason: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
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

    doctor: Mapped["Doctor"] = relationship()
    patient: Mapped["User"] = relationship(foreign_keys=[patient_id])
    cancelled_by_user: Mapped["User | None"] = relationship(
        foreign_keys=[cancelled_by]
    )
