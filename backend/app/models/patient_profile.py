from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class PatientProfile(Base):
    """Datos que el paciente carga para la consulta.

    Todos los campos son opcionales a nivel columna: el perfil se puede ir
    completando de a poco y `is_complete` (calculado, no persistido) dice si ya
    tiene lo minimo para sacar un turno. El indice unico de `dni` es la regla
    fuerte: dos pacientes no pueden compartir documento.
    """

    __tablename__ = "patient_profiles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # One-to-one con users. El indice unico es el que garantiza la regla.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Solo digitos, 7 u 8. El unico permite varios NULL (Postgres y SQLite
    # excluyen NULL del unico), que es exactamente lo que se necesita mientras
    # el perfil esta incompleto.
    dni: Mapped[str | None] = mapped_column(
        String(8),
        unique=True,
        index=True,
        nullable=True,
    )

    # Medico asignado. Nullable porque un paciente puede no tener medico
    # todavia (y porque el alta de turnos, que lo setea, llega despues). No
    # expone datos de salud: es solo la relacion administrativa.
    assigned_doctor_id: Mapped[int | None] = mapped_column(
        ForeignKey("doctors.id"),
        index=True,
        nullable=True,
    )

    birth_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    sex: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    address: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # Obra social, prepaga o "Particular". Es texto libre para no inventar un
    # catalogo de coberturas que la clinica no definio.
    insurance_provider: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    insurance_plan: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    insurance_member_number: Mapped[str | None] = mapped_column(
        String(60),
        nullable=True,
    )

    emergency_contact_name: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    emergency_contact_phone: Mapped[str | None] = mapped_column(
        String(30),
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

    user: Mapped[User] = relationship(back_populates="patient_profile")

    @property
    def is_complete(self) -> bool:
        """Lo minimo para poder sacar un turno: documento, fecha de nacimiento,
        cobertura (obra social o "Particular") y telefono."""
        return bool(
            self.dni
            and self.birth_date
            and self.insurance_provider
            and self.phone
        )
