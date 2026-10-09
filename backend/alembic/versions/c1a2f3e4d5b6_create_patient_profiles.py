"""create patient_profiles table

Revision ID: c1a2f3e4d5b6
Revises: e3f4c1b20d33
Create Date: 2026-10-09

Crea `patient_profiles`: el one-to-one con `users` donde cada paciente guarda
los datos que necesita la consulta (documento, nacimiento, cobertura, contacto
y contacto de emergencia). Todo nullable porque el perfil se completa de a
poco; `is_complete` es calculado en la app, no una columna.

Igual que las revisiones anteriores, la base del proyecto es PostgreSQL: SQLite
solo se usa en tests, que arman el esquema desde los modelos.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = 'c1a2f3e4d5b6'
down_revision: Union[str, Sequence[str], None] = 'e3f4c1b20d33'
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
        'patient_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('dni', sa.String(length=8), nullable=True),
        sa.Column('birth_date', sa.Date(), nullable=True),
        sa.Column('sex', sa.String(length=30), nullable=True),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('address', sa.String(length=200), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('insurance_provider', sa.String(length=120), nullable=True),
        sa.Column('insurance_plan', sa.String(length=120), nullable=True),
        sa.Column('insurance_member_number', sa.String(length=60), nullable=True),
        sa.Column('emergency_contact_name', sa.String(length=120), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=30), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_patient_profiles_id'), 'patient_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_patient_profiles_user_id'), 'patient_profiles', ['user_id'], unique=True)
    op.create_index(op.f('ix_patient_profiles_dni'), 'patient_profiles', ['dni'], unique=True)


def downgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name != 'postgresql':
        raise RuntimeError(
            f"La migracion {revision} solo corre en PostgreSQL, no en "
            f"{bind.dialect.name}."
        )

    op.drop_index(op.f('ix_patient_profiles_dni'), table_name='patient_profiles')
    op.drop_index(op.f('ix_patient_profiles_user_id'), table_name='patient_profiles')
    op.drop_index(op.f('ix_patient_profiles_id'), table_name='patient_profiles')
    op.drop_table('patient_profiles')
