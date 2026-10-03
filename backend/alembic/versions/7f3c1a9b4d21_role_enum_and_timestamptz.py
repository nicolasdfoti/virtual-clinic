"""role as enum and timestamptz timestamps

Revision ID: 7f3c1a9b4d21
Revises: 2a8c31a987b6
Create Date: 2026-10-02

Convierte `users.role` de VARCHAR a un enum de Postgres y pasa
`created_at` / `updated_at` a timestamptz con server_default.

Sobre la conversion de timestamps: la columna era `timestamp without time
zone` y se llenaba con `datetime.now()`, o sea hora local *naive* de la
maquina. Para no correrl al convertir asumimos que esos valores estaban en
America/Argentina/Buenos_Aires (la zona del proyecto) y los reinterpretamos con
`AT TIME ZONE`. Si los datos viejos venian de otra zona, corregir el valor de
la zona en esta migracion antes de aplicarla.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = '7f3c1a9b4d21'
down_revision: Union[str, Sequence[str], None] = '2a8c31a987b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ROLE_VALUES = ("PATIENT", "DOCTOR", "ADMIN")

CLINIC_TIMEZONE = "America/Argentina/Buenos_Aires"


user_role = postgresql.ENUM(*ROLE_VALUES, name='user_role')


def upgrade() -> None:
    bind = op.get_bind()

    # Esta migracion usa `ALTER COLUMN ... TYPE`, `AT TIME ZONE` y ENUM nativos:
    # solo existen en PostgreSQL, que es la base del proyecto. SQLite se usa
    # unicamente para los tests, que arman el esquema desde los modelos y no
    # corren migraciones. Sin este chequeo el fallo en otra base es un error
    # de sintaxis crudo ("near ALTER") que no dice nada util.
    if bind.dialect.name != 'postgresql':
        raise RuntimeError(
            f"La migracion {revision} solo corre en PostgreSQL, no en "
            f"{bind.dialect.name}."
        )

    # Falla temprano y con un mensaje util si hay un role fuera del enum, en
    # vez de reventar el cast con un error de Postgres a mitad de la migracion.
    # En modo offline (`alembic upgrade head --sql`) no hay base contra la que
    # consultar, asi que el chequeo se omite y solo se emite el SQL.
    if not op.get_context().as_sql:
        unexpected = bind.execute(
            sa.text(
                "SELECT DISTINCT role FROM users "
                "WHERE role NOT IN ('PATIENT', 'DOCTOR', 'ADMIN', "
                "'patient', 'doctor', 'admin')"
            )
        ).scalars().all()

        if unexpected:
            raise RuntimeError(
                "Hay valores de users.role fuera del enum: "
                f"{unexpected}. Corregilos a mano antes de aplicar la migracion."
            )

    # La columna guardaba minusculas ("patient"); el enum es en mayusculas.
    op.execute("UPDATE users SET role = upper(role) WHERE role <> upper(role)")

    user_role.create(bind, checkfirst=True)

    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
    op.execute(
        "ALTER TABLE users ALTER COLUMN role TYPE user_role "
        "USING role::text::user_role"
    )
    op.alter_column(
        'users',
        'role',
        server_default=sa.text("'PATIENT'"),
        existing_type=user_role,
    )

    op.execute(
        "ALTER TABLE users ALTER COLUMN created_at TYPE timestamptz "
        f"USING created_at AT TIME ZONE '{CLINIC_TIMEZONE}'"
    )
    op.execute(
        "ALTER TABLE users ALTER COLUMN updated_at TYPE timestamptz "
        f"USING updated_at AT TIME ZONE '{CLINIC_TIMEZONE}'"
    )

    op.alter_column(
        'users',
        'created_at',
        server_default=sa.text('now()'),
        existing_type=sa.DateTime(timezone=True),
    )
    op.alter_column(
        'users',
        'updated_at',
        server_default=sa.text('now()'),
        existing_type=sa.DateTime(timezone=True),
    )
    op.alter_column(
        'users',
        'is_active',
        server_default=sa.text('true'),
        existing_type=sa.Boolean(),
    )


def downgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name != 'postgresql':
        raise RuntimeError(
            f"La migracion {revision} solo corre en PostgreSQL, no en "
            f"{bind.dialect.name}."
        )

    op.execute("ALTER TABLE users ALTER COLUMN created_at DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN updated_at DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN is_active DROP DEFAULT")

    op.execute(
        "ALTER TABLE users ALTER COLUMN created_at TYPE timestamp "
        "WITHOUT TIME ZONE "
        f"USING created_at AT TIME ZONE '{CLINIC_TIMEZONE}'"
    )
    op.execute(
        "ALTER TABLE users ALTER COLUMN updated_at TYPE timestamp "
        "WITHOUT TIME ZONE "
        f"USING updated_at AT TIME ZONE '{CLINIC_TIMEZONE}'"
    )

    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
    op.execute(
        "ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20) "
        "USING role::text"
    )
    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'patient'")
    op.execute("UPDATE users SET role = lower(role)")

    postgresql.ENUM(name='user_role').drop(op.get_bind(), checkfirst=True)