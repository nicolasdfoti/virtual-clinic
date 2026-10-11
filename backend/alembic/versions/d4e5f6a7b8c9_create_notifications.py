"""create notifications

Revision ID: d4e5f6a7b8c9
Revises: 58672ac73354
Create Date: 2026-10-11 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = '58672ac73354'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('related_type', sa.String(length=50), nullable=True),
        sa.Column('related_id', sa.Integer(), nullable=True),
        sa.Column(
            'is_read',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false'),
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_notifications_id'),
        'notifications',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_notifications_user_id'),
        'notifications',
        ['user_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_notifications_type'),
        'notifications',
        ['type'],
        unique=False,
    )
    op.create_index(
        op.f('ix_notifications_is_read'),
        'notifications',
        ['is_read'],
        unique=False,
    )
    op.create_index(
        op.f('ix_notifications_created_at'),
        'notifications',
        ['created_at'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f('ix_notifications_created_at'),
        table_name='notifications',
    )
    op.drop_index(
        op.f('ix_notifications_is_read'),
        table_name='notifications',
    )
    op.drop_index(
        op.f('ix_notifications_type'),
        table_name='notifications',
    )
    op.drop_index(
        op.f('ix_notifications_user_id'),
        table_name='notifications',
    )
    op.drop_index(
        op.f('ix_notifications_id'),
        table_name='notifications',
    )
    op.drop_table('notifications')
