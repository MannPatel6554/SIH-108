"""
Standards API endpoints for BIS SmartSpec AI
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.models.session import get_db
from app.models.database import Standard, StandardRelationship
from app.schemas.schemas import StandardSummary, StandardDetail, RelatedStandardSchema, StandardClauseSchema

router = APIRouter(prefix="/standards", tags=["standards"])


@router.get("", response_model=List[StandardSummary])
async def list_standards(
    q: Optional[str] = Query(None, description="Search query"),
    sector: Optional[str] = None,
    standard_type: Optional[str] = None,
    status: Optional[str] = None,
    verification_status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List standards with optional filtering and pagination."""
    stmt = select(Standard).options(selectinload(Standard.certifications))
    
    if q:
        search_term = f"%{q}%"
        stmt = stmt.where(
            or_(
                Standard.standard_number.ilike(search_term),
                Standard.title.ilike(search_term),
                Standard.description.ilike(search_term),
            )
        )
    if sector:
        stmt = stmt.where(Standard.sector == sector.upper())
    if standard_type:
        stmt = stmt.where(Standard.standard_type == standard_type.upper())
    if status:
        stmt = stmt.where(Standard.status == status.upper())
    if verification_status:
        stmt = stmt.where(Standard.verification_status == verification_status.upper())
    
    stmt = stmt.offset(skip).limit(limit).order_by(Standard.standard_number)
    result = await db.execute(stmt)
    standards = result.scalars().all()
    
    return [StandardSummary.model_validate(s) for s in standards]


@router.get("/count")
async def count_standards(
    db: AsyncSession = Depends(get_db),
):
    """Get count of standards with verification breakdown."""
    total_res = await db.execute(select(func.count(Standard.id)))
    total = total_res.scalar() or 0

    verified_res = await db.execute(
        select(func.count(Standard.id)).where(Standard.verification_status == "OFFICIAL_VERIFIED")
    )
    verified = verified_res.scalar() or 0

    demo_res = await db.execute(
        select(func.count(Standard.id)).where(Standard.verification_status == "DEMO")
    )
    demo = demo_res.scalar() or 0

    public_res = await db.execute(
        select(func.count(Standard.id)).where(Standard.verification_status == "PUBLIC_BIS_DATA")
    )
    public_bis = public_res.scalar() or 0

    return {
        "total": total,
        "verified": verified,
        "demo": demo,
        "public_bis": public_bis,
        "active_real_records": verified + public_bis
    }


@router.get("/{standard_id}", response_model=StandardDetail)
async def get_standard(
    standard_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get full details of a standard."""
    result = await db.execute(
        select(Standard)
        .options(
            selectinload(Standard.certifications),
            selectinload(Standard.versions),
            selectinload(Standard.source_relationships).selectinload(
                StandardRelationship.target
            ),
        )
        .where(or_(Standard.id == standard_id, Standard.standard_number == standard_id))
    )
    standard = result.scalars().first()
    
    if not standard:
        raise HTTPException(status_code=404, detail=f"Standard not found: {standard_id}")

    # Build related standards
    related = []
    for rel in (standard.source_relationships or []):
        if rel.target:
            related.append(RelatedStandardSchema(
                id=rel.target.id,
                standard_number=rel.target.standard_number,
                title=rel.target.title,
                relationship_type=rel.relationship_type,
                description=rel.description,
                status=rel.target.status,
                verification_status=rel.target.verification_status,
            ))
    
    detail = StandardDetail.model_validate(standard)
    detail.related_standards = related
    return detail


@router.get("/{standard_id}/related", response_model=List[RelatedStandardSchema])
async def get_related_standards(
    standard_id: str,
    relationship_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get standards related to a given standard."""
    result = await db.execute(
        select(Standard)
        .where(or_(Standard.id == standard_id, Standard.standard_number == standard_id))
    )
    standard = result.scalars().first()
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found")

    stmt = (
        select(StandardRelationship)
        .options(selectinload(StandardRelationship.target))
        .where(StandardRelationship.source_id == standard.id)
    )
    if relationship_type:
        stmt = stmt.where(StandardRelationship.relationship_type == relationship_type.upper())
    
    rels = await db.execute(stmt)
    relationships = rels.scalars().all()

    return [
        RelatedStandardSchema(
            id=r.target.id,
            standard_number=r.target.standard_number,
            title=r.target.title,
            relationship_type=r.relationship_type,
            description=r.description,
            status=r.target.status,
            verification_status=r.target.verification_status,
        )
        for r in relationships
        if r.target
    ]

@router.get("/{id}/clauses", response_model=List[StandardClauseSchema])
async def get_standard_clauses(
    id: str,
    db: AsyncSession = Depends(get_db),
):
    """Deep Spec Search: Retrieve technical clauses and engineering tolerances for a standard."""
    from app.models.database import StandardClause
    res_std = await db.execute(select(Standard).where(or_(Standard.id == id, Standard.standard_number == id)))
    std = res_std.scalars().first()
    if not std:
        raise HTTPException(status_code=404, detail=f"Standard not found: {id}")
    
    stmt = select(StandardClause).where(StandardClause.standard_id == std.id).order_by(StandardClause.clause_number)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/sources/provenance")
async def get_data_provenance(db: AsyncSession = Depends(get_db)):
    """Get authoritative data sources and recent ingestion audit history."""
    from app.models.database import DataSource, IngestionAudit
    
    src_res = await db.execute(select(DataSource).order_by(DataSource.created_at.desc()).limit(10))
    sources = src_res.scalars().all()
    
    audit_res = await db.execute(select(IngestionAudit).order_by(IngestionAudit.created_at.desc()).limit(20))
    audits = audit_res.scalars().all()

    return {
        "authoritative_source": "Bureau of Indian Standards",
        "portal_url": "https://standards.bis.gov.in / https://www.bis.gov.in",
        "data_sources": [
            {
                "id": s.id,
                "name": s.name,
                "source_type": s.source_type,
                "source_url": s.source_url,
                "record_count": s.record_count,
                "verification_status": s.verification_status,
                "last_ingested": s.last_ingested.isoformat() if s.last_ingested else None,
                "notes": s.notes
            }
            for s in sources
        ],
        "recent_audits": [
            {
                "run_id": a.run_id,
                "standard_number": a.standard_number,
                "change_type": a.change_type,
                "details": a.details,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in audits
        ]
    }
