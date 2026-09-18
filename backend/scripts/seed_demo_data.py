"""
Demo Data Seeder for BIS SmartSpec AI
Seeds the SQLite database and ChromaDB vector store with demo records.
"""
import asyncio
import json
import os
import sys
import uuid
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.database import Base, Standard, StandardRelationship, Certification, DataSource


DATABASE_URL = "sqlite+aiosqlite:///./data/bis_smartspec.db"


async def seed_demo_data():
    """Seed the database with demo standards data."""
    os.makedirs("data", exist_ok=True)
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Load demo data
    demo_file = os.path.join(os.path.dirname(__file__), "..", "data", "demo", "demo_standards.json")
    with open(demo_file, "r", encoding="utf-8") as f:
        demo_data = json.load(f)

    async with async_session() as session:
        # Check if already seeded
        from sqlalchemy import select
        result = await session.execute(select(Standard).limit(1))
        existing = result.scalars().first()
        if existing:
            print("Demo data already seeded. Skipping.")
            await session.close()
            await engine.dispose()
            return

        standard_map = {}  # standard_number -> Standard object

        # First pass: insert standards
        for s_data in demo_data["standards"]:
            std = Standard(
                id=str(uuid.uuid4()),
                standard_number=s_data["standard_number"],
                title=s_data["title"],
                title_hindi=s_data.get("title_hindi"),
                part=s_data.get("part"),
                edition_year=s_data.get("edition_year"),
                status=s_data.get("status", "DEMO"),
                standard_type=s_data.get("standard_type", "PRODUCT"),
                sector=s_data.get("sector", "GENERAL"),
                description=s_data.get("description", ""),
                description_hindi=s_data.get("description_hindi"),
                keywords=s_data.get("keywords", []),
                scope=s_data.get("scope"),
                source_url=s_data.get("source_url"),
                verification_status=s_data.get("verification_status", "DEMO"),
                ics_code=s_data.get("ics_code"),
            )
            session.add(std)
            standard_map[s_data["standard_number"]] = std

            # Add certifications
            for cert_data in s_data.get("certifications", []):
                cert = Certification(
                    id=str(uuid.uuid4()),
                    standard_id=std.id,
                    product_category=cert_data.get("product_category"),
                    certification_type=cert_data.get("certification_type"),
                    is_mandatory=cert_data.get("is_mandatory", "UNKNOWN"),
                    scheme=cert_data.get("scheme"),
                    verification_status=cert_data.get("verification_status", "DEMO"),
                    notes=cert_data.get("notes"),
                )
                session.add(cert)

        await session.flush()

        # Second pass: insert relationships
        for s_data in demo_data["standards"]:
            source_std = standard_map.get(s_data["standard_number"])
            if not source_std:
                continue

            for rel in s_data.get("related", []):
                target_std = standard_map.get(rel["target"])
                if not target_std:
                    continue
                relationship = StandardRelationship(
                    id=str(uuid.uuid4()),
                    source_id=source_std.id,
                    target_id=target_std.id,
                    relationship_type=rel["type"],
                    verification_status="DEMO",
                )
                session.add(relationship)

        # Add data source record
        for ds_data in demo_data.get("data_sources", []):
            ds = DataSource(
                id=str(uuid.uuid4()),
                name=ds_data["name"],
                source_type=ds_data.get("source_type"),
                source_url=ds_data.get("source_url"),
                record_count=ds_data.get("record_count", 0),
                verification_status=ds_data.get("verification_status", "DEMO"),
                notes=ds_data.get("notes"),
                last_ingested=datetime.now(),
            )
            session.add(ds)

        await session.commit()
        print(f"[OK] Seeded {len(demo_data['standards'])} demo standards")
        print(f"[OK] Standards are clearly marked as DEMO - not official BIS data")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
