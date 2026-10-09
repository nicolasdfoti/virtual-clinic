"""create doctors table and add users auth columns

Revision ID: e3f4c1b20d33
Revises: 7f3c1a9b4d21
Create Date: 2026-10-08

Crea la tabla `doctors` (que existia solo como modelo, nunca en una migracion)
con la relacion one-to-one contra `users`, y agrega a `users` las columnas de
autenticacion `must_change_password` y `token_version`.

Igual que la revision 7f3c1a9b4d21, la base del proyecto es PostgreSQL: SQLite
solo se usa en tests, que arman el esquema desde los modelos y no corren
migraciones.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = 'e3f4c1b20d33'
down_revision: Union[str, Sequence[str], None] = '7f3c1a9b4d21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name != 'postgresql':
        raise RuntimeError(
            f"La migracion {revision} solo corre en PostgreSQL, no en "
            f"{bind.dialect.name}."
        )

    op.create_table(
        'doctors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('license_number', sa.String(length=50), nullable=False),
        sa.Column('specialty', sa.String(length=100), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('consultation_minutes', sa.Integer(), nullable=False, server_default=sa.text('30')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_doctors_id'), 'doctors', ['id'], unique=False)
    op.create_index(op.f('ix_doctors_user_id'), 'doctors', ['user_id'], unique=True)
    op.create_index(op.f('ix_doctors_license_number'), 'doctors', ['license_number'], unique=True)

    op.add_column(
        'users',
        sa.Column('must_change_password', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )
    op.add_column(
        'users',
        sa.Column('token_version', sa.Integer(), nullable=False, server_default=sa.text('0')),
    )


def downgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name != 'postgresql':
        raise RuntimeError(
            f"La migracion {revision} solo corre en PostgreSQL, no en "
            f"{bind.dialect.name}."
        )

    op.drop_column('users', 'token_version')
    op.drop_column('users', 'must_change_password')
    op.drop_index(op.f('ix_doctors_license_number'), table_name='doctors')
    op.drop_index(op.f('ix_doctors_user_id'), table_name='doctors')
    op.drop_index(op.f('ix_doctors_id'), table_name='doctors')
    op.drop_table('doctors')