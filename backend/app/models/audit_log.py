from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuditLog(Base):
    """Registro de trazabilidad de acciones sensibles.

    `metadata` esta reservado en SQLAlchemy (es el `Base.metadata` de los
    modelos), asi que la columna se llama `metadata` en la base y el atributo
    `extra` en Python. Nunca guarda datos de salud: solo identificadores,
    accion y contexto administrativo.
    """

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Quien hizo la accion. Nullable para acciones del sistema sin usuario.
    actor_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        index=True,
        nullable=True,
    )

    action: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    entity_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )

    entity_id: Mapped[int | None] = mapped_column(
        Integer,
        index=True,
        nullable=True,
    )

    # IP del cliente (IPv4 o IPv6). Dato tecnico, no clinico.
    ip: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    extra: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        JSON,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
