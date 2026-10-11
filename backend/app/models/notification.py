from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Notification(Base):
    """Aviso in-app para un usuario.

    El `message` nunca lleva datos de salud: se arma con nombres, fechas y el
    tipo de evento, no con motivos de consulta ni medicamentos. `related_type`
    e `related_id` apuntan al recurso que origino el aviso para poder enlazarlo
    (por ejemplo, un turno).
    """

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Destinatario. Las notificaciones son siempre de un solo usuario y se
    # consultan filtrando por user_id: por eso el indice.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )

    # Tipo de evento: appointment_booked, appointment_cancelled,
    # prescription_created, medical_order_created, appointment_completed,
    # appointment_no_show.
    type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    related_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    related_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        index=True,
        nullable=False,
        default=False,
        server_default="false",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped[User] = relationship()

    def __repr__(self) -> str:
        return f"<Notification id={self.id} user_id={self.user_id} type={self.type!r}>"
