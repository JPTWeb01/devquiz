"""add editor role

Revision ID: add_editor_role
Revises: 2baae2689982
Create Date: 2026-06-09

"""
from alembic import op

revision = 'add_editor_role'
down_revision = '2baae2689982'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE users MODIFY COLUMN role ENUM('STUDENT','EDITOR','ADMIN') NOT NULL DEFAULT 'STUDENT'")


def downgrade():
    op.execute("ALTER TABLE users MODIFY COLUMN role ENUM('STUDENT','ADMIN') NOT NULL DEFAULT 'STUDENT'")
