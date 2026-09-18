"""
Real BIS Data Ingestion & Change Detection Engine — BIS SmartSpec AI
Stage 4 in the Real BIS Data Ingestion Pipeline

Reads validated normalized data and performs:
1. Safe database upsert (Standard, Version, Relationship, Certification, DataSource)
2. Differential change detection (NEW_STANDARD, UPDATED_STANDARD, REVISED_STANDARD, AMENDMENT_UPDATED, STATUS_CHANGED, UNCHANGED)
3. Audit logging in IngestionAudit table
4. Re-linking of referred standards (OFFICIAL_REFERRED_STANDARD)
5. Incremental vector embeddings generation for new/changed records
"""
import asyncio
import os
import sys
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, and_
from app.models.database import (
    Base, Standard, StandardVersion, StandardRelationship,
    Certification, DataSource, IngestionAudit
)
from app.models.session import async_url, init_db
from app.services.embedding_service import get_embedding_service
from app.services.vector_store import get_vector_store

SNAPSHOTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "snapshots")


async def ingest_validated_bis_data(input_file: Optional[str] = None, rebuild_embeddings: bool = True):
    if not input_file:
        input_file = os.path.join(SNAPSHOTS_DIR, "latest_normalized.json")
        if not os.path.exists(input_file):
            print(f"[Ingestion Error] {input_file} not found. Run normalize_bis_data.py first.")
            return

    # Ensure database schema is initialized and up to date
    await init_db()

    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    standards_list = data.get("standards", [])
    if not standards_list:
        print("[Ingestion] No standards found in file.")
        return

    print(f"[Ingestion Engine] Ingesting {len(standards_list)} verified records from {input_file}...")

    engine = create_async_engine(async_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    run_id = f"RUN_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"

    changed_or_new_standard_ids = []
    audits_to_record = []

    counts = {
        "NEW_STANDARD": 0,
        "UPDATED_STANDARD": 0,
        "REVISED_STANDARD": 0,
        "AMENDMENT_UPDATED": 0,
        "STATUS_CHANGED": 0,
        "UNCHANGED": 0,
    }

    async with async_session() as session:
        # Pass 1: Upsert standards, versions, certifications
        standards_by_number = {}

        for s_data in standards_list:
            std_num = s_data.get("standard_number", "").strip()
            if not std_num:
                continue

            res = await session.execute(select(Standard).where(Standard.standard_number == std_num))
            existing: Optional[Standard] = res.scalars().first()

            incoming_hash = s_data.get("content_hash")
            incoming_edition = s_data.get("edition_year")
            incoming_status = s_data.get("status", "CURRENT")

            if existing:
                # Detect change type
                change_type = "UNCHANGED"
                details = []

                if existing.edition_year != incoming_edition:
                    change_type = "REVISED_STANDARD"
                    details.append(f"Edition changed from {existing.edition_year} to {incoming_edition}")
                elif existing.status != incoming_status:
                    change_type = "STATUS_CHANGED"
                    details.append(f"Status changed from {existing.status} to {incoming_status}")
                elif existing.content_hash != incoming_hash:
                    change_type = "UPDATED_STANDARD"
                    details.append("Content hash changed: updated scope/title/keywords")
                else:
                    change_type = "UNCHANGED"
                    details.append("Identical content hash")

                counts[change_type] += 1

                # Update existing standard fields
                existing.title = s_data.get("title", existing.title)
                existing.title_hindi = s_data.get("title_hindi", existing.title_hindi)
                existing.part = s_data.get("part", existing.part)
                existing.standard_number_normalized = s_data.get("standard_number_normalized")
                existing.edition_year = incoming_edition
                existing.publication_date = s_data.get("publication_date", existing.publication_date)
                existing.revision_date = s_data.get("revision_date", existing.revision_date)
                existing.review_date = s_data.get("review_date", existing.review_date)
                existing.status = incoming_status
                existing.standard_type = s_data.get("standard_type", existing.standard_type)
                existing.sector = s_data.get("sector", existing.sector)
                existing.description = s_data.get("description", existing.description)
                existing.description_hindi = s_data.get("description_hindi", existing.description_hindi)
                existing.keywords = s_data.get("keywords", existing.keywords)
                existing.scope = s_data.get("scope", existing.scope)
                existing.source_url = s_data.get("source_url", existing.source_url)
                existing.source_name = s_data.get("source_name", "Bureau of Indian Standards")
                existing.source_type = s_data.get("source_type", "OFFICIAL_BIS")
                existing.retrieved_at = s_data.get("retrieved_at", existing.retrieved_at)
                existing.last_checked_at = datetime.utcnow().isoformat() + "Z"
                existing.verification_status = s_data.get("verification_status", "OFFICIAL_VERIFIED")
                existing.license_status = s_data.get("license_status", "PUBLIC_METADATA")
                existing.content_access = s_data.get("content_access", "PUBLIC_METADATA")
                existing.content_hash = incoming_hash
                existing.product_manual_url = s_data.get("product_manual_url", existing.product_manual_url)
                existing.product_manual_title = s_data.get("product_manual_title", existing.product_manual_title)

                standards_by_number[std_num] = existing

                if change_type != "UNCHANGED":
                    changed_or_new_standard_ids.append(existing.id)

                audits_to_record.append(IngestionAudit(
                    id=str(uuid.uuid4()),
                    run_id=run_id,
                    standard_number=std_num,
                    change_type=change_type,
                    details="; ".join(details),
                    snapshot_file=os.path.basename(input_file)
                ))

            else:
                # Insert New Standard
                change_type = "NEW_STANDARD"
                counts["NEW_STANDARD"] += 1

                std = Standard(
                    id=str(uuid.uuid4()),
                    standard_number=std_num,
                    standard_number_normalized=s_data.get("standard_number_normalized"),
                    title=s_data.get("title", ""),
                    title_hindi=s_data.get("title_hindi"),
                    part=s_data.get("part"),
                    edition_year=incoming_edition,
                    publication_date=s_data.get("publication_date"),
                    revision_date=s_data.get("revision_date"),
                    review_date=s_data.get("review_date"),
                    status=incoming_status,
                    standard_type=s_data.get("standard_type", "PRODUCT"),
                    sector=s_data.get("sector", "GENERAL"),
                    description=s_data.get("description"),
                    description_hindi=s_data.get("description_hindi"),
                    keywords=s_data.get("keywords", []),
                    scope=s_data.get("scope"),
                    source_url=s_data.get("source_url", "https://standards.bis.gov.in"),
                    source_name=s_data.get("source_name", "Bureau of Indian Standards"),
                    source_type=s_data.get("source_type", "OFFICIAL_BIS"),
                    retrieved_at=s_data.get("retrieved_at", datetime.utcnow().isoformat() + "Z"),
                    last_checked_at=datetime.utcnow().isoformat() + "Z",
                    verification_status=s_data.get("verification_status", "OFFICIAL_VERIFIED"),
                    license_status=s_data.get("license_status", "PUBLIC_METADATA"),
                    content_access=s_data.get("content_access", "PUBLIC_METADATA"),
                    content_hash=incoming_hash,
                    product_manual_url=s_data.get("product_manual_url"),
                    product_manual_title=s_data.get("product_manual_title"),
                )
                session.add(std)
                standards_by_number[std_num] = std
                changed_or_new_standard_ids.append(std.id)

                audits_to_record.append(IngestionAudit(
                    id=str(uuid.uuid4()),
                    run_id=run_id,
                    standard_number=std_num,
                    change_type="NEW_STANDARD",
                    details=f"Inserted new verified BIS record {std_num}",
                    snapshot_file=os.path.basename(input_file)
                ))

        await session.flush()

        # Pass 2: Upsert Certifications and Amendments
        for s_data in standards_list:
            std_num = s_data.get("standard_number")
            std = standards_by_number.get(std_num)
            if not std:
                continue

            # Certifications
            for c in s_data.get("certifications", []):
                # Check if already exists for this standard and category
                cert_res = await session.execute(
                    select(Certification).where(
                        and_(
                            Certification.standard_id == std.id,
                            Certification.certification_type == c.get("certification_type")
                        )
                    )
                )
                existing_cert = cert_res.scalars().first()
                if not existing_cert:
                    new_cert = Certification(
                        id=str(uuid.uuid4()),
                        standard_id=std.id,
                        product_category=c.get("product_category"),
                        certification_type=c.get("certification_type", "ISI_MARK"),
                        is_mandatory=c.get("is_mandatory", "MANDATORY"),
                        scheme=c.get("scheme", "Scheme-I"),
                        effective_date=c.get("effective_date"),
                        verification_status=c.get("verification_status", "OFFICIAL_VERIFIED"),
                        source=c.get("source"),
                        source_url=c.get("source_url"),
                        notes=c.get("notes")
                    )
                    session.add(new_cert)

            # Amendments (StandardVersion)
            for am in s_data.get("amendments", []):
                am_num = am.get("amendment_number")
                if not am_num:
                    continue
                ver_res = await session.execute(
                    select(StandardVersion).where(
                        and_(
                            StandardVersion.standard_id == std.id,
                            StandardVersion.amendment_number == am_num
                        )
                    )
                )
                existing_ver = ver_res.scalars().first()
                if not existing_ver:
                    new_ver = StandardVersion(
                        id=str(uuid.uuid4()),
                        standard_id=std.id,
                        edition_year=std.edition_year,
                        amendment_number=am_num,
                        amendment_date=am.get("amendment_date"),
                        amendment_title=am.get("title"),
                        is_current=True,
                        notes=f"Official BIS Amendment: {am.get('title') or am_num}"
                    )
                    session.add(new_ver)

        await session.flush()

        # Pass 3: Re-link official relationships (OFFICIAL_REFERRED_STANDARD)
        # Fetch all existing standards to allow cross-linking
        all_std_res = await session.execute(select(Standard.id, Standard.standard_number))
        lookup_map = {num: sid for sid, num in all_std_res.all()}

        relationship_count = 0
        for s_data in standards_list:
            src_num = s_data.get("standard_number")
            src_id = lookup_map.get(src_num)
            if not src_id:
                continue

            for ref in s_data.get("referred_standards", []):
                target_num = ref.get("target_standard_number")
                target_id = lookup_map.get(target_num)

                # If target standard isn't in DB yet, create a placeholder stub so the graph edge is preserved
                if not target_id:
                    stub_std = Standard(
                        id=str(uuid.uuid4()),
                        standard_number=target_num,
                        title=f"Referred Standard: {target_num}",
                        status="CURRENT",
                        standard_type="OTHER",
                        sector=s_data.get("sector", "GENERAL"),
                        verification_status="PUBLIC_BIS_DATA",
                        source_name="Bureau of Indian Standards",
                        source_url="https://standards.bis.gov.in",
                        content_access="PUBLIC_METADATA",
                    )
                    session.add(stub_std)
                    await session.flush()
                    target_id = stub_std.id
                    lookup_map[target_num] = target_id

                # Check if relationship already exists
                rel_res = await session.execute(
                    select(StandardRelationship).where(
                        and_(
                            StandardRelationship.source_id == src_id,
                            StandardRelationship.target_id == target_id,
                            StandardRelationship.relationship_type == ref.get("relationship_type", "OFFICIAL_REFERRED_STANDARD")
                        )
                    )
                )
                if not rel_res.scalars().first():
                    new_rel = StandardRelationship(
                        id=str(uuid.uuid4()),
                        source_id=src_id,
                        target_id=target_id,
                        relationship_type=ref.get("relationship_type", "OFFICIAL_REFERRED_STANDARD"),
                        description=ref.get("description"),
                        verification_status="OFFICIAL_VERIFIED",
                        source_url=s_data.get("source_url")
                    )
                    session.add(new_rel)
                    relationship_count += 1

        # Pass 4: Save Ingestion Audits and Data Source record
        for audit in audits_to_record:
            session.add(audit)

        data_source = DataSource(
            id=str(uuid.uuid4()),
            name="Bureau of Indian Standards Official Portal & Gazette QCOs",
            source_type="OFFICIAL_BIS",
            source_url="https://standards.bis.gov.in / https://www.bis.gov.in",
            record_count=len(standards_list),
            verification_status="OFFICIAL_VERIFIED",
            last_ingested=datetime.utcnow(),
            notes=f"Run {run_id}: {counts['NEW_STANDARD']} new, {counts['UPDATED_STANDARD']} updated, {counts['REVISED_STANDARD']} revised"
        )
        session.add(data_source)

        await session.commit()

    await engine.dispose()

    # Ingestion Summary
    print("\n" + "=" * 60)
    print("        REAL BIS DATA INGESTION SUMMARY")
    print("=" * 60)
    print(f" Run ID                : {run_id}")
    print(f" Total Records Audited : {len(standards_list)}")
    print(f" NEW Standards Added   : {counts['NEW_STANDARD']}")
    print(f" UPDATED Standards     : {counts['UPDATED_STANDARD']}")
    print(f" REVISED Standards     : {counts['REVISED_STANDARD']}")
    print(f" STATUS Changes        : {counts['STATUS_CHANGED']}")
    print(f" UNCHANGED Standards   : {counts['UNCHANGED']}")
    print(f" Relationships Linked  : {relationship_count}")
    print(f" Candidates to Embed   : {len(changed_or_new_standard_ids)}")
    print("=" * 60 + "\n")

    if rebuild_embeddings:
        print("[Ingestion] Refreshing vector embeddings for all standards in ChromaDB...")
        from scripts.build_embeddings import build_embeddings
        await build_embeddings()
        print("[Ingestion] Vector embeddings refreshed successfully!")


if __name__ == "__main__":
    file_arg = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(ingest_validated_bis_data(file_arg))
