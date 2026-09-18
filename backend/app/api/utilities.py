"""
Version Check, Compliance, Stats, and Export API endpoints
"""
import io
import uuid
import time
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.models.session import get_db
from app.models.database import (
    Standard, SearchHistory, Document,
    ComplianceChecklist, ComplianceItem, DataSource
)
from sqlalchemy.orm import selectinload
from app.schemas.schemas import (
    VersionCheckRequest, VersionCheckResponse, StandardSummary,
    ComplianceChecklistCreate, ComplianceChecklistOut, ComplianceItemOut,
    ComplianceItemUpdate, StatsResponse, ExportRequest,
)

router = APIRouter(tags=["utilities"])


# ─────────────────────────────────────────
# Version Check
# ─────────────────────────────────────────

@router.post("/version-check", response_model=VersionCheckResponse)
async def version_check(
    request: VersionCheckRequest,
    db: AsyncSession = Depends(get_db),
):
    """Check if a standard reference is potentially outdated."""
    # Normalize standard number
    std_num = request.standard_number.strip().upper()
    if not std_num.startswith("IS"):
        std_num = f"IS {std_num}"

    result = await db.execute(
        select(Standard)
        .options(selectinload(Standard.certifications))
        .where(Standard.standard_number.ilike(f"%{std_num.split()[-1]}%"))
    )
    std = result.scalars().first()

    if not std:
        return VersionCheckResponse(
            standard_number=request.standard_number,
            found=False,
            is_potentially_outdated=False,
            message=f"Standard '{request.standard_number}' not found in demo database. "
                    "Verify directly at https://www.bis.gov.in",
        )

    is_outdated = False
    newer_year = None
    
    if request.referenced_year and std.edition_year:
        if request.referenced_year < std.edition_year:
            is_outdated = True
            newer_year = std.edition_year

    message_parts = [f"Found in demo database as: {std.standard_number}"]
    
    if std.verification_status == "DEMO":
        message_parts.append("⚠ DEMO record — verify from official BIS source.")
    
    if is_outdated:
        message_parts.append(
            f"⚠ Potential outdated reference: You referenced year {request.referenced_year}, "
            f"but demo database has edition year {newer_year}. Verify latest edition from BIS."
        )
    elif std.edition_year:
        message_parts.append(f"Demo database edition year: {std.edition_year}")
    
    if std.status == "SUPERSEDED":
        message_parts.append("⚠ This standard may be superseded. Check BIS for current version.")

    return VersionCheckResponse(
        standard_number=request.standard_number,
        found=True,
        current_record=StandardSummary.model_validate(std),
        is_potentially_outdated=is_outdated,
        newer_record_year=newer_year,
        message=" ".join(message_parts),
    )


# ─────────────────────────────────────────
# Compliance Checklist
# ─────────────────────────────────────────

@router.post("/compliance-check", response_model=ComplianceChecklistOut)
async def create_checklist(
    request: ComplianceChecklistCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a compliance checklist from search results."""
    checklist = ComplianceChecklist(
        id=str(uuid.uuid4()),
        name=request.name or f"Checklist {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
        query=request.query,
    )
    db.add(checklist)
    await db.flush()

    for item_data in request.items:
        item = ComplianceItem(
            id=str(uuid.uuid4()),
            checklist_id=checklist.id,
            standard_id=item_data.standard_id,
            standard_number=item_data.standard_number,
            standard_title=item_data.standard_title,
            item_type=item_data.item_type,
            status="PENDING",
            notes=item_data.notes,
        )
        db.add(item)

    await db.commit()
    await db.refresh(checklist)

    # Re-load with items
    result = await db.execute(
        select(ComplianceChecklist)
        .where(ComplianceChecklist.id == checklist.id)
    )
    checklist = result.scalars().first()
    # Load items
    items_result = await db.execute(
        select(ComplianceItem).where(ComplianceItem.checklist_id == checklist.id)
    )
    items = items_result.scalars().all()

    return ComplianceChecklistOut(
        id=checklist.id,
        name=checklist.name,
        query=checklist.query,
        items=[ComplianceItemOut.model_validate(i) for i in items],
        created_at=checklist.created_at,
    )


@router.patch("/compliance-check/{checklist_id}/items/{item_id}")
async def update_checklist_item(
    checklist_id: str,
    item_id: str,
    update: ComplianceItemUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a compliance checklist item status."""
    result = await db.execute(
        select(ComplianceItem)
        .where(ComplianceItem.id == item_id, ComplianceItem.checklist_id == checklist_id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    item.status = update.status.value
    if update.notes is not None:
        item.notes = update.notes
    await db.commit()
    return ComplianceItemOut.model_validate(item)


# ─────────────────────────────────────────
# Stats
# ─────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get application statistics."""
    total = (await db.execute(select(func.count(Standard.id)))).scalar() or 0
    verified = (await db.execute(
        select(func.count(Standard.id)).where(Standard.verification_status == "VERIFIED")
    )).scalar() or 0
    demo = (await db.execute(
        select(func.count(Standard.id)).where(Standard.verification_status == "DEMO")
    )).scalar() or 0
    from app.models.database import StandardRelationship
    rels = (await db.execute(
        select(func.count(StandardRelationship.id))
    )).scalar() or 0
    searches = (await db.execute(select(func.count(SearchHistory.id)))).scalar() or 0
    docs = (await db.execute(select(func.count(Document.id)))).scalar() or 0
    checklists = (await db.execute(
        select(func.count(ComplianceChecklist.id))
    )).scalar() or 0

    return StatsResponse(
        total_standards=total,
        verified_standards=verified,
        demo_standards=demo,
        total_relationships=rels,
        searches_performed=searches,
        documents_analyzed=docs,
        checklists_created=checklists,
        mode="DEMO",
    )


# ─────────────────────────────────────────
# Data Sources
# ─────────────────────────────────────────

@router.get("/data-sources")
async def get_data_sources(db: AsyncSession = Depends(get_db)):
    """Get data source information."""
    result = await db.execute(select(DataSource))
    sources = result.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "source_type": s.source_type,
            "source_url": s.source_url,
            "record_count": s.record_count,
            "verification_status": s.verification_status,
            "last_ingested": s.last_ingested.isoformat() if s.last_ingested else None,
            "notes": s.notes,
        }
        for s in sources
    ]


# ─────────────────────────────────────────
# Export
# ─────────────────────────────────────────

@router.post("/export/pdf")
async def export_pdf(request: ExportRequest):
    """Export recommendation report as PDF."""
    try:
        pdf_bytes = _generate_pdf_report(request)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=bis_smartspec_report.pdf"
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.post("/export/excel")
async def export_excel(request: ExportRequest):
    """Export recommendation report as Excel."""
    try:
        excel_bytes = _generate_excel_report(request)
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=bis_smartspec_report.xlsx"
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel generation failed: {str(e)}")


def _generate_pdf_report(request: ExportRequest) -> bytes:
    """Generate PDF report using reportlab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title', parent=styles['Heading1'],
        fontSize=16, textColor=colors.HexColor('#1a3c5e'),
        spaceAfter=12,
    )
    heading_style = ParagraphStyle(
        'Heading', parent=styles['Heading2'],
        fontSize=12, textColor=colors.HexColor('#2563EB'),
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        'Body', parent=styles['Normal'],
        fontSize=9, leading=14,
        spaceAfter=4,
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer', parent=styles['Normal'],
        fontSize=8, textColor=colors.HexColor('#6b7280'),
        borderColor=colors.HexColor('#f59e0b'), borderWidth=1,
        borderPadding=6, backColor=colors.HexColor('#fffbeb'),
    )
    
    story = []
    
    # Header
    story.append(Paragraph("BIS SmartSpec AI", title_style))
    story.append(Paragraph("Recommendation Report", styles['Heading2']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1a3c5e')))
    story.append(Spacer(1, 12))

    # Report info
    story.append(Paragraph(f"<b>Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", body_style))
    story.append(Paragraph(f"<b>Query:</b> {request.query}", body_style))
    story.append(Spacer(1, 12))

    # Disclaimer
    disclaimer_text = (
        "⚠ DISCLAIMER: This prototype provides decision-support recommendations only. "
        "Procurement officials must verify applicable standards, current editions, amendments, "
        "and certification requirements against authoritative BIS/government sources before "
        "finalizing procurement specifications. All records marked DEMO are not verified official BIS data."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))
    story.append(Spacer(1, 16))

    # Results
    story.append(Paragraph(f"Recommended Standards ({len(request.results)} results)", heading_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e5e7eb')))
    story.append(Spacer(1, 8))

    for i, result in enumerate(request.results, 1):
        story.append(Paragraph(
            f"{i}. {result.standard_number} — {result.title}",
            styles['Heading3']
        ))
        
        # Score table
        score_data = [
            ["Field", "Value"],
            ["Semantic Relevance Score", f"{result.score:.4f}"],
            ["Confidence", result.confidence.upper()],
            ["Status", result.status],
            ["Sector", result.sector],
            ["Type", result.standard_type],
            ["Edition Year", str(result.edition_year) if result.edition_year else "Unknown"],
            ["Verification Status", result.verification_status],
        ]
        
        if result.score_breakdown:
            score_data.extend([
                ["  Semantic Score", f"{result.score_breakdown.semantic_score:.4f}"],
                ["  Lexical Score", f"{result.score_breakdown.lexical_score:.4f}"],
                ["  Metadata Score", f"{result.score_breakdown.metadata_score:.4f}"],
            ])

        t = Table(score_data, colWidths=[4*cm, 12*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a3c5e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
        ]))
        story.append(t)
        story.append(Spacer(1, 6))

        if request.include_explanations and result.why_relevant:
            story.append(Paragraph("<b>AI-generated explanation:</b>", body_style))
            story.append(Paragraph(result.why_relevant[:500], body_style))

        if result.certifications:
            cert_text = "; ".join([
                f"{c.certification_type} ({c.is_mandatory})"
                for c in result.certifications
            ])
            story.append(Paragraph(f"<b>Certification:</b> {cert_text}", body_style))

        story.append(Spacer(1, 12))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e5e7eb')))
        story.append(Spacer(1, 8))

    # Checklist section
    if request.checklist_items:
        story.append(Spacer(1, 12))
        story.append(Paragraph("Compliance Checklist", heading_style))
        
        cl_data = [["Item Type", "Standard", "Status", "Notes"]]
        for item in request.checklist_items:
            cl_data.append([
                item.item_type,
                item.standard_number or "",
                item.status,
                (item.notes or "")[:50],
            ])
        
        cl_table = Table(cl_data, colWidths=[4*cm, 5*cm, 3*cm, 5*cm])
        cl_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
        ]))
        story.append(cl_table)

    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "Generated by BIS SmartSpec AI — SIH 2026 Prototype | "
        "Not an official BIS/Government document | "
        "Verify all information from authoritative sources",
        body_style
    ))

    doc.build(story)
    return buffer.getvalue()


def _generate_excel_report(request: ExportRequest) -> bytes:
    """Generate Excel report using openpyxl."""
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, numbers
    
    wb = openpyxl.Workbook()
    
    # ── Sheet 1: Recommendations
    ws = wb.active
    ws.title = "Recommendations"
    
    # Styling
    header_font = Font(bold=True, color="FFFFFF", size=10)
    header_fill = PatternFill("solid", fgColor="1a3c5e")
    alt_fill = PatternFill("solid", fgColor="F1F5F9")
    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    
    # Header info
    ws['A1'] = "BIS SmartSpec AI — Recommendation Report"
    ws['A1'].font = Font(bold=True, size=14, color="1a3c5e")
    ws['A2'] = f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
    ws['A3'] = f"Query: {request.query}"
    ws['A4'] = "⚠ DEMO data — Not official BIS data. Verify from authoritative sources."
    ws['A4'].font = Font(color="B45309")
    
    # Column headers
    headers = [
        "Standard Number", "Title", "Relevance Score", "Confidence",
        "Type", "Sector", "Status", "Edition Year",
        "Certification", "Verification Status", "Semantic Score", "Lexical Score"
    ]
    
    header_row = 6
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=header_row, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_align
    
    # Data rows
    for row_idx, result in enumerate(request.results, header_row + 1):
        fill = alt_fill if row_idx % 2 == 0 else PatternFill("solid", fgColor="FFFFFF")
        
        cert_text = "; ".join([
            f"{c.certification_type} ({c.is_mandatory})"
            for c in result.certifications
        ]) if result.certifications else "Not identified"
        
        row_data = [
            result.standard_number,
            result.title,
            result.score,
            result.confidence.upper(),
            result.standard_type,
            result.sector,
            result.status,
            result.edition_year or "",
            cert_text,
            result.verification_status,
            result.score_breakdown.semantic_score if result.score_breakdown else "",
            result.score_breakdown.lexical_score if result.score_breakdown else "",
        ]
        
        for col, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col, value=value)
            cell.fill = fill
            if col == 3 and isinstance(value, float):
                cell.number_format = "0.0000"
    
    # Column widths
    widths = [18, 50, 18, 12, 15, 15, 12, 12, 35, 20, 15, 15]
    for col, width in enumerate(widths, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(col)].width = width

    # ── Sheet 2: Checklist
    if request.checklist_items:
        ws2 = wb.create_sheet("Compliance Checklist")
        cl_headers = ["Item Type", "Standard Number", "Standard Title", "Status", "Notes"]
        for col, h in enumerate(cl_headers, 1):
            cell = ws2.cell(row=1, column=col, value=h)
            cell.font = header_font
            cell.fill = PatternFill("solid", fgColor="2563EB")
        
        for row_idx, item in enumerate(request.checklist_items, 2):
            ws2.cell(row=row_idx, column=1, value=item.item_type)
            ws2.cell(row=row_idx, column=2, value=item.standard_number or "")
            ws2.cell(row=row_idx, column=3, value=item.standard_title or "")
            ws2.cell(row=row_idx, column=4, value=item.status)
            ws2.cell(row=row_idx, column=5, value=item.notes or "")

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
