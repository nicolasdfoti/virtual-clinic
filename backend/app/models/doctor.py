from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # One-to-one: un usuario es medico como maximo. El indice unico es el que
    # garantiza la regla en la base de datos, no solo en la aplicacion.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Matricula habilitante. Unica en todo el sistema: dos profesionales no
    # pueden compartirla. El indice unico tambien acelera las busquedas.
    license_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    specialty: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    # Presentacion opcional; no es un campo clinico ni de salud.
    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # Duracion de la consulta en minutos. Por defecto 30; la usa el calendario
    # de turnos para partir el dia en franjas.
    consultation_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=30,
        server_default="30",
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

    # La vuelta de la relacion one-to-one con User vive en User.doctor.
    user: Mapped[User] = relationship(back_populates="doctor")