from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.doctor import Doctor


class DoctorTimeOff(Base):
    """Bloque de tiempo en el que el medico no atiende (vacaciones, congreso,
    un tramite puntual). Se guarda en UTC igual que los turnos.

    Es un rango de instantes (no una franja semanal) porque lo normal es
    bloquear dias concretos del calendario.
    """

    __tablename__ = "doctor_time_off"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
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

    reason: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    doctor: Mapped["Doctor"] = relationship()
