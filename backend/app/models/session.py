"""Database session management"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.database import Base
import os

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# Convert sqlite URL to async
async_url = settings.DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")

engine = create_async_engine(
    async_url,
    connect_args={"check_same_thread": False},
    echo=False,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db():
    """Create all tables and safely migrate any new columns"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Safe column migration for SQLite
        def migrate_sqlite_columns(connection):
            import sqlite3
            # Check standards table columns
            cursor = connection.connection.cursor()
            cursor.execute("PRAGMA table_info(standards)")
            existing_cols = {row[1] for row in cursor.fetchall()}
            
            new_standards_cols = {
                "standard_number_normalized": "TEXT",
                "source_name": "TEXT DEFAULT 'Bureau of Indian Standards'",
                "source_type": "TEXT DEFAULT 'OFFICIAL_BIS'",
                "retrieved_at": "TEXT",
                "last_checked_at": "TEXT",
                "content_access": "TEXT DEFAULT 'PUBLIC_METADATA'",
                "content_hash": "TEXT",
                "license_status": "TEXT DEFAULT 'PUBLIC_METADATA'",
                "review_date": "TEXT",
                "product_manual_url": "TEXT",
                "product_manual_title": "TEXT",
            }
            for col, col_type in new_standards_cols.items():
                if col not in existing_cols:
                    cursor.execute(f"ALTER TABLE standards ADD COLUMN {col} {col_type}")

            # Check standard_relationships
            cursor.execute("PRAGMA table_info(standard_relationships)")
            existing_rel_cols = {row[1] for row in cursor.fetchall()}
            for col, col_type in [("source_url", "TEXT"), ("retrieved_at", "TEXT")]:
                if col not in existing_rel_cols:
                    cursor.execute(f"ALTER TABLE standard_relationships ADD COLUMN {col} {col_type}")

            # Check certifications
            cursor.execute("PRAGMA table_info(certifications)")
            existing_cert_cols = {row[1] for row in cursor.fetchall()}
            for col, col_type in [("source_url", "TEXT"), ("retrieved_at", "TEXT"), ("qco_order_ref", "TEXT")]:
                if col not in existing_cert_cols:
                    cursor.execute(f"ALTER TABLE certifications ADD COLUMN {col} {col_type}")

        await conn.run_sync(migrate_sqlite_columns)


async def get_db():
    """Dependency for FastAPI endpoints"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
