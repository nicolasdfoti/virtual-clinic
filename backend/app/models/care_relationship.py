from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import CareRelationshipStatus

if TYPE_CHECKING:
    from app.models.doctor import Doctor
    from app.models.user import User


class CareRelationship(Base):
    """Vinculo medico-paciente.

    Es la relacion que habilita al medico a ver el perfil de un paciente. El
    indice unico por par `(doctor_id, patient_id)` es la regla fuerte: una sola
    fila por par. Desvincular no borra: pasa `status` a `ENDED`.
    """

    __tablename__ = "care_relationships"

    __table_args__ = (
        UniqueConstraint(
            "doctor_id",
            "patient_id",
            name="uq_care_relationships_doctor_patient",
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

    # El paciente es el usuario (no el perfil): la relacion es con la persona.
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )

    status: Mapped[CareRelationshipStatus] = mapped_column(
        SAEnum(CareRelationshipStatus, name="care_relationship_status"),
        nullable=False,
        default=CareRelationshipStatus.ACTIVE,
        server_default=CareRelationshipStatus.ACTIVE.name,
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
    patient: Mapped[User] = relationship()
