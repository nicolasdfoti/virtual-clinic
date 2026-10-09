"""create care_relationships and audit_logs

Revision ID: a5c6d7e8f9b0
Revises: d2b3c4e5f6a7
Create Date: 2026-10-09

Agrega dos tablas:

- `care_relationships`: vinculo medico-paciente con estado ACTIVE/ENDED. Un
  indice unico por par `(doctor_id, patient_id)` evita duplicados; desvincular
  es pasar a ENDED, no borrar. Es la tabla que habilita al medico a ver el
  perfil de un paciente.
- `audit_logs`: trazabilidad de acciones sensibles. La columna se llama
  `metadata` en la base (el atributo Python es `extra` porque `metadata` esta
  reservado por SQLAlchemy). Nunca guarda datos de salud.

Como el resto de las migraciones del proyecto, solo corre en PostgreSQL: SQLite
se usa unicamente en los tests, que arman el esquema desde los modelos.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = 'a5c6d7e8f9b0'
down_revision: Union[str, Sequence[str], None] = 'd2b3c4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


care_relationship_status = postgresql.ENUM(
    'ACTIVE',
    'ENDED',
    name='care_relationship_status',
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

    op.create_table(
        'care_relationships',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column(
            'status',
            care_relationship_status,
            nullable=False,
            server_default=sa.text("'ACTIVE'"),
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id']),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'doctor_id',
            'patient_id',
            name='uq_care_relationships_doctor_patient',
        ),
    )
    op.create_index(op.f('ix_care_relationships_id'), 'care_relationships', ['id'], unique=False)
    op.create_index(op.f('ix_care_relationships_doctor_id'), 'care_relationships', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_care_relationships_patient_id'), 'care_relationships', ['patient_id'], unique=False)

    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('actor_user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('ip', sa.String(length=45), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['actor_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_actor_user_id'), 'audit_logs', ['actor_user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_entity_type'), 'audit_logs', ['entity_type'], unique=False)
    op.create_index(op.f('ix_audit_logs_entity_id'), 'audit_logs', ['entity_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)


def downgrade() -> None:
    _ensure_postgres()

    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_entity_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_entity_type'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_actor_user_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')

    op.drop_index(op.f('ix_care_relationships_patient_id'), table_name='care_relationships')
    op.drop_index(op.f('ix_care_relationships_doctor_id'), table_name='care_relationships')
    op.drop_index(op.f('ix_care_relationships_id'), table_name='care_relationships')
    op.drop_table('care_relationships')

    care_relationship_status.drop(op.get_bind(), checkfirst=True)
