from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import Role


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Se guarda siempre normalizado a minusculas (ver normalize_email en
    # app/schemas/user.py). El indice unico de arriba es el que impide dos
    # cuentas con el mismo email aunque difieran en mayusculas.
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    role: Mapped[Role] = mapped_column(
        SAEnum(Role, name="user_role"),
        nullable=False,
        default=Role.PATIENT,
        server_default=Role.PATIENT.name,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # timestamptz: se guarda en UTC con timezone. La zona de la clinica
    # (America/Argentina/Buenos_Aires) se aplica solo al mostrar y al calcular
    # horarios, nunca al guardar ni comparar.
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