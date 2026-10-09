"""create appointments, availability, time_off and exclusion

Revision ID: b1d2e3f4a5b6
Revises: a5c6d7e8f9b0
Create Date: 2026-10-09

Crea:

- `doctor_availabilities`: franjas semanales (weekday 0=lunes..6=domingo,
  start_time/end_time en hora local de la clinica). Permite que el medico defina
  su agenda.
- `doctor_time_off`: bloques puntuales en UTC (rango de instantes). Para
  vacaciones/congresos.
- `appointments`: turnos entre paciente y medico con estado y modalidad. Guarda
  `starts_at`/`ends_at` en UTC (timestamptz). Se agrega un constraint de
  exclusion con `btree_gist` para impedir que el mismo medico tenga dos turnos
  activos superpuestos.

El constraint de exclusion NO se puede emular en SQLite (dialecto usado solo en
tests): los tests validan la logica a nivel app; en PostgreSQL el DDL aplica la
regla fuerte.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = 'b1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'a5c6d7e8f9b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


appointment_status = postgresql.ENUM(
    'SCHEDULED',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED',
    'NO_SHOW',
    name='appointment_status',
)

appointment_modality = postgresql.ENUM(
    'VIDEO',
    'IN_PERSON',
    name='appointment_modality',
)


def _ensure_postgres() -> None:
    bind = op.get_bind()

    if bind.dialect.name != 'postgresql':
        raise RuntimeError(
            f"La migracion {revision} solo corre en PostgreSQL, no en "
            f"{bind.dialect.name}."
        )


def upgrade() -> None:
    _ensure_postgres()

    # Extension necesaria para EXCLUDE USING gist en Postgres
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist;")

    op.create_table(
        'doctor_availabilities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('weekday', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'doctor_id',
            'weekday',
            'start_time',
            name='uq_doctor_availabilities_doctor_weekday_start',
        ),
    )
    op.create_index(op.f('ix_doctor_availabilities_id'), 'doctor_availabilities', ['id'], unique=False)
    op.create_index(op.f('ix_doctor_availabilities_doctor_id'), 'doctor_availabilities', ['doctor_id'], unique=False)

    op.create_table(
        'doctor_time_off',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reason', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_doctor_time_off_id'), 'doctor_time_off', ['id'], unique=False)
    op.create_index(op.f('ix_doctor_time_off_doctor_id'), 'doctor_time_off', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_doctor_time_off_starts_at'), 'doctor_time_off', ['starts_at'], unique=False)

    op.create_table(
        'appointments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', appointment_status, nullable=False, server_default=sa.text("'SCHEDULED'")),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.Column('modality', appointment_modality, nullable=False, server_default=sa.text("'VIDEO'")),
        sa.Column('video_url', sa.String(length=500), nullable=True),
        sa.Column('cancelled_by', sa.Integer(), nullable=True),
        sa.Column('cancel_reason', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['cancelled_by'], ['users.id']),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id']),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_appointments_id'), 'appointments', ['id'], unique=False)
    op.create_index(op.f('ix_appointments_patient_id'), 'appointments', ['patient_id'], unique=False)
    op.create_index(op.f('ix_appointments_doctor_id'), 'appointments', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_appointments_starts_at'), 'appointments', ['starts_at'], unique=False)

    # Exclusion constraint: no superposicion de turnos ACTIVOS para el mismo medico
    op.execute(
        """
        ALTER TABLE appointments
        ADD CONSTRAINT exclude_active_appointments
        EXCLUDE USING gist (
            doctor_id WITH =,
            tstzrange(starts_at, ends_at, '[)') WITH &&
        )
        WHERE (status IN ('SCHEDULED', 'CONFIRMED'))
        """
    )


def downgrade() -> None:
    _ensure_postgres()

    op.execute('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS exclude_active_appointments')

    op.drop_index(op.f('ix_appointments_starts_at'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_doctor_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_patient_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_id'), table_name='appointments')
    op.drop_table('appointments')

    appointment_modality.drop(op.get_bind(), checkfirst=True)
    appointment_status.drop(op.get_bind(), checkfirst=True)

    op.drop_index(op.f('ix_doctor_time_off_starts_at'), table_name='doctor_time_off')
    op.drop_index(op.f('ix_doctor_time_off_doctor_id'), table_name='doctor_time_off')
    op.drop_index(op.f('ix_doctor_time_off_id'), table_name='doctor_time_off')
    op.drop_table('doctor_time_off')

    op.drop_index(op.f('ix_doctor_availabilities_doctor_id'), table_name='doctor_availabilities')
    op.drop_index(op.f('ix_doctor_availabilities_id'), table_name='doctor_availabilities')
    op.drop_table('doctor_availabilities')
