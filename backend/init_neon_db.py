"""
Script to initialize the Neon database with all tables.
Run with: python init_neon_db.py
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from app.config import settings

def init_db():
    print(f"Connecting to: {settings.DATABASE_URL[:50]}...")

    engine = create_engine(settings.DATABASE_URL, connect_args={"sslmode": "require"})

    with engine.connect() as conn:
        # Create users table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                hashed_password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        print("✓ Created users table")

        # Create quizzes table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS quizzes (
                id SERIAL PRIMARY KEY,
                host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """))
        print("✓ Created quizzes table")

        # Create questions table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
                order_index INTEGER NOT NULL DEFAULT 0,
                text TEXT NOT NULL,
                image_url VARCHAR(512),
                time_limit_seconds INTEGER NOT NULL DEFAULT 20,
                points INTEGER NOT NULL DEFAULT 1000,
                is_text_answer BOOLEAN NOT NULL DEFAULT FALSE,
                answers JSONB NOT NULL DEFAULT '[]'
            )
        """))
        print("✓ Created questions table")

        # Create rooms table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                room_code VARCHAR(6) NOT NULL UNIQUE,
                quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
                host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) NOT NULL DEFAULT 'waiting',
                created_at TIMESTAMP DEFAULT NOW(),
                finished_at TIMESTAMP
            )
        """))
        print("✓ Created rooms table")

        conn.commit()
        print("\n✅ Database initialized successfully!")

if __name__ == "__main__":
    init_db()