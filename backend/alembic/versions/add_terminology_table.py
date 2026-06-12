"""add terminology table

Revision ID: add_terminology_table
Revises: add_editor_role
Create Date: 2026-06-11

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_terminology_table'
down_revision = 'add_editor_role'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'terminology',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('topic_id', sa.String(36), sa.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False),
        sa.Column('term', sa.String(255), nullable=False),
        sa.Column('meaning', sa.Text, nullable=False),
        sa.Column('order', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_terminology_topic_id', 'terminology', ['topic_id'])


def downgrade():
    op.drop_index('ix_terminology_topic_id', table_name='terminology')
    op.drop_table('terminology')
