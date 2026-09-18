"""
Real Data Ingestion Script for BIS SmartSpec AI
Allows importing official or verified BIS standards from a JSON file into SQLite and ChromaDB.

Usage:
    python scripts/ingest_standards.py path/to/real_standards.json [--rebuild-index]
"""
import asyncio
import json
import os
import sys
import uuid
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.database import Base, Standard, StandardRelationship, Certification, DataSource
from app.models.session import async_url


async def ingest_file(file_path: str, rebuild_embeddings: bool = True):
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    standards_list = data.get("standards", data if isinstance(data, list) else [])
    if not standards_list:
        print("No standards found in JSON file.")
        return

    print(f"Found {len(standards_list)} standards to ingest.")

    engine = create_async_engine(async_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        count_added = 0
        count_updated = 0

        for s_data in standards_list:
            std_num = s_data.get("standard_number", "").strip().upper()
            if not std_num:
                continue

            # Check if standard already exists
            res = await session.execute(select(Standard).where(Standard.standard_number == std_num))
            existing = res.scalars().first()

            v_status = s_data.get("verification_status", "VERIFIED").upper()

            if existing:
                # Update existing record
                existing.title = s_data.get("title", existing.title)
                existing.title_hindi = s_data.get("title_hindi", existing.title_hindi)
                existing.part = s_data.get("part", existing.part)
                existing.edition_year = s_data.get("edition_year", existing.edition_year)
                existing.status = s_data.get("status", existing.status)
                existing.standard_type = s_data.get("standard_type", existing.standard_type)
                existing.sector = s_data.get("sector", existing.sector)
                existing.description = s_data.get("description", existing.description)
                existing.description_hindi = s_data.get("description_hindi", existing.description_hindi)
                existing.keywords = s_data.get("keywords", existing.keywords)
                existing.scope = s_data.get("scope", existing.scope)
                existing.source_url = s_data.get("source_url", existing.source_url)
                existing.verification_status = v_status
                count_updated += 1
            else:
                # Insert new standard
                std = Standard(
                    id=str(uuid.uuid4()),
                    standard_number=std_num,
                    title=s_data.get("title", ""),
                    title_hindi=s_data.get("title_hindi"),
                    part=s_data.get("part"),
                    edition_year=s_data.get("edition_year"),
                    status=s_data.get("status", "CURRENT"),
                    standard_type=s_data.get("standard_type", "PRODUCT"),
                    sector=s_data.get("sector", "GENERAL"),
                    description=s_data.get("description"),
                    description_hindi=s_data.get("description_hindi"),
                    keywords=s_data.get("keywords", []),
                    scope=s_data.get("scope"),
                    source_url=s_data.get("source_url", "https://www.bis.gov.in"),
                    verification_status=v_status,
                )
                session.add(std)
                count_added += 1

        # Record data source
        source_entry = DataSource(
            id=str(uuid.uuid4()),
            name=data.get("metadata", {}).get("source_name", os.path.basename(file_path)),
            source_type="CUSTOM_IMPORT",
            source_url=data.get("metadata", {}).get("source_url", "https://www.bis.gov.in"),
            record_count=count_added + count_updated,
            verification_status="VERIFIED",
            notes=f"Imported from {os.path.basename(file_path)}",
        )
        session.add(source_entry)
        await session.commit()

    await engine.dispose()
    print(f"Ingestion complete: {count_added} added, {count_updated} updated.")

    if rebuild_embeddings:
        print("Rebuilding vector search embeddings...")
        from scripts.build_embeddings import build_embeddings
        await build_embeddings()
        print("Embeddings rebuilt successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest BIS standards into database")
    parser.add_argument("file", help="Path to JSON file containing standards")
    parser.add_argument("--no-index", action="store_true", help="Skip rebuilding vector embeddings")
    args = parser.parse_args()

    asyncio.run(ingest_file(args.file, rebuild_embeddings=not args.no_index))
