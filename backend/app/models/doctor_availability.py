from __future__ import annotations

from datetime import datetime, time
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.doctor import Doctor


class DoctorAvailability(Base):
    """Franja horaria semanal en la que el medico atiende.

    `weekday` usa la convencion de `datetime.weekday()` (0 = lunes ... 6 =
    domingo) y `start_time` / `end_time` son horas de pared en la zona de la
    clinica (America/Argentina/Buenos_Aires), no UTC: la agenda se piensa en
    hora local. El calculo de slots convierte recien al guardar/consultar.
    """

    __tablename__ = "doctor_availabilities"

    __table_args__ = (
        UniqueConstraint(
            "doctor_id",
            "weekday",
            "start_time",
            name="uq_doctor_availabilities_doctor_weekday_start",
        ),
    )

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

    weekday: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    end_time: Mapped[time] = mapped_column(
        Time,
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

    doctor: Mapped["Doctor"] = relationship()
