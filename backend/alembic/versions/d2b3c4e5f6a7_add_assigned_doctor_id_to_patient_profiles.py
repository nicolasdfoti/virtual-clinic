"""add assigned_doctor_id to patient_profiles

Revision ID: d2b3c4e5f6a7
Revises: c1a2f3e4d5b6
Create Date: 2026-10-09

Agrega `assigned_doctor_id` a `patient_profiles`: el medico que tiene asignado
el paciente. Hoy no hay endpoint que lo setee (llega con turnos), pero el
filtro `doctor_id` del listado de pacientes del admin ya lo necesita.

Igual que las revisiones anteriores, la base del proyecto es PostgreSQL: SQLite
solo se usa en tests, que arman el esquema desde los modelos.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = 'd2b3c4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'c1a2f3e4d5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


FK_NAME = 'fk_patient_profiles_assigned_doctor_id'


def _ensure_postgres() -> None:
    bind = op.get_bind()

    if bind.dialect.name != 'postgresql':
        raise RuntimeError(
            f"La migracion {revision} solo corre en PostgreSQL, no en "
            f"{bind.dialect.name}."
        )


def upgrade() -> None:
    _ensure_postgres()

    op.add_column(
        'patient_profiles',
        sa.Column('assigned_doctor_id', sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        FK_NAME,
        'patient_profiles',
        'doctors',
        ['assigned_doctor_id'],
        ['id'],
    )
    op.create_index(
        op.f('ix_patient_profiles_assigned_doctor_id'),
        'patient_profiles',
        ['assigned_doctor_id'],
        unique=False,
    )


def downgrade() -> None:
    _ensure_postgres()

    op.drop_index(
        op.f('ix_patient_profiles_assigned_doctor_id'),
        table_name='patient_profiles',
    )
    op.drop_constraint(FK_NAME, 'patient_profiles', type_='foreignkey')
    op.drop_column('patient_profiles', 'assigned_doctor_id')
