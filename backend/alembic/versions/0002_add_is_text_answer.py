"""Add is_text_answer to questions

Revision ID: 0002_add_is_text_answer
Revises: 0001_initial
Create Date: 2026-04-24

"""
from alembic import op
import sqlalchemy as sa

revision = '0002_add_is_text_answer'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('questions', sa.Column('is_text_answer', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('questions', 'is_text_answer')