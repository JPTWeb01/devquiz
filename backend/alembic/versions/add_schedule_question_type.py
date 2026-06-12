"""add question_type to weekly_schedules

Revision ID: add_schedule_question_type
Revises: add_editor_role
Create Date: 2026-06-11

"""
import sqlalchemy as sa
from alembic import op

revision = 'add_schedule_question_type'
down_revision = 'add_editor_role'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'weekly_schedules',
        sa.Column('question_type', sa.String(30), nullable=False, server_default=''),
    )


def downgrade():
    op.drop_column('weekly_schedules', 'question_type')
