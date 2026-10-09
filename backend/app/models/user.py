from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import Role

if TYPE_CHECKING:
    from app.models.doctor import Doctor


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

    # `true` cuando el usuario tiene que cambiar la clave antes de usar el
    # sistema (primer login, admin creado por bootstrap o reset de password).
    must_change_password: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    # Se incrementa para invalidar todos los tokens previos de un usuario
    # (cierre de sesion global / cambio de password): el token guarda una
    # version y deja de ser valido si no coincide con la actual.
    token_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
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

    # La vuelta de la relacion one-to-one con User vive en Doctor.user.
    doctor: Mapped[Doctor | None] = relationship(
        back_populates="user",
        uselist=False,
    )