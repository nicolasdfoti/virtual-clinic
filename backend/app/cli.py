"""Command line interface para tareas de administracion del backend.

Uso:

    python -m app.cli create-admin

Solo un subcomando por ahora. La contraseña se pide por prompt oculto (getpass)
y NUNCA por argumento: quedaría en el historial del shell y en los logs del
proceso. El email, el nombre y el apellido se piden interactivamente.
"""
import argparse
import getpass
import sys

from app.core.security import hash_password
from app.database import SessionLocal
from app.schemas.user import MAX_NAME_LENGTH, MAX_PASSWORD_BYTES, MIN_PASSWORD_LENGTH, normalize_email

from app.models.enums import Role
from app.models.user import User


def create_admin(
    email: str,
    first_name: str,
    last_name: str,
    password: str,
    session_factory=SessionLocal,
) -> int:
    """Crea el usuario ADMIN. Devuelve 0 si ok, 1 si fallo.

    `session_factory` solo se inyecta en tests; en produccion es SessionLocal.
    """
    normalized_email = normalize_email(email)

    if len(normalized_email) == 0:
        print("El email no puede estar vacío.")
        return 1

    first_name = first_name.strip()
    last_name = last_name.strip()

    if len(first_name) == 0 or len(last_name) == 0:
        print("El nombre y el apellido no pueden estar vacíos.")
        return 1

    if len(password) < MIN_PASSWORD_LENGTH:
        print(
            f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres."
        )
        return 1

    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        print(f"La contraseña no puede superar los {MAX_PASSWORD_BYTES} bytes.")
        return 1

    session = session_factory()

    try:
        existing = (
            session.query(User)
            .filter(User.email == normalized_email)
            .first()
        )

        if existing is not None:
            print("Ya existe una cuenta con ese email.")
            return 1

        admin = User(
            email=normalized_email,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            role=Role.ADMIN,
        )

        session.add(admin)
        session.commit()

        print("Administrador creado.")
        return 0
    finally:
        session.close()


def _cmd_create_admin(args: argparse.Namespace) -> int:
    email = input("Email: ").strip()
    first_name = input("Nombre: ").strip()
    last_name = input("Apellido: ").strip()
    # getpass no pide confirmacion a proposito: no queremos que la clave se
    # muestre ni en eco ni en una segunda pasada innecesaria.
    password = getpass.getpass("Contraseña: ")

    return create_admin(email, first_name, last_name, password)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m app.cli",
        description="Tareas de administracion del backend.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser(
        "create-admin",
        help="Crea el primer usuario ADMIN.",
    ).set_defaults(func=_cmd_create_admin)

    args = parser.parse_args(argv)

    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())