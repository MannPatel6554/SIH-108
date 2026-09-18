"""
Document Analysis API endpoint
"""
import os
import uuid
import time
import shutil
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.session import get_db
from app.models.database import Document, Standard
from app.schemas.schemas import DocumentAnalysisResponse
from app.documents.processor import get_document_processor
from app.services.recommendation_engine import get_recommendation_engine
from app.core.config import settings

router = APIRouter(tags=["documents"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


@router.post("/analyze-document", response_model=DocumentAnalysisResponse)
async def analyze_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload and analyze a tender/specification document.
    
    Extracts text, detects IS standard references, and provides recommendations.
    Supported: PDF, DOCX, TXT
    """
    start = time.time()

    # Validate file
    filename = file.filename or "upload"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    file_bytes = await file.read()
    
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_MB}MB"
        )

    # Save to temp
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    temp_id = str(uuid.uuid4())
    safe_filename = f"{temp_id}.{ext}"
    temp_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    try:
        with open(temp_path, "wb") as f_out:
            f_out.write(file_bytes)

        # Process document
        processor = get_document_processor()
        extracted_text, detected_standards = processor.process(temp_path, ext)

        # Save document record
        doc = Document(
            id=str(uuid.uuid4()),
            filename=filename,
            file_type=ext,
            file_size=len(file_bytes),
            status="DONE",
            extracted_text=extracted_text[:5000],  # Store preview only
            detected_standards=detected_standards,
            summary=extracted_text[:500],
        )
        db.add(doc)
        await db.flush()

        # Run recommendations on extracted text
        engine = get_recommendation_engine()
        
        # Use full text if short, else use first 2000 chars + detected standards
        search_text = extracted_text[:2000]
        
        search_response = await engine.search(
            query=search_text,
            db=db,
            top_k=8,
            language="en",
        )

        # Detect outdated references
        detected_numbers = [d["standard_number"] for d in detected_standards]
        potential_outdated = []
        potential_gaps = []

        # Check if detected standards exist in DB
        for det_std in detected_standards:
            std_num = det_std["standard_number"]
            result = await db.execute(
                select(Standard).where(Standard.standard_number.ilike(f"%{std_num.split()[-1]}%"))
            )
            db_std = result.scalars().first()
            
            if db_std and det_std.get("year") and db_std.edition_year:
                if det_std["year"] < db_std.edition_year:
                    potential_outdated.append({
                        "referenced": f"{std_num} : {det_std['year']}",
                        "newer_record": f"{db_std.standard_number} : {db_std.edition_year}",
                        "action": "Review latest edition from official BIS source",
                    })

        # Identify potential gaps (recommended standards not in detected)
        for rec in search_response.results[:5]:
            if rec.standard_number not in detected_numbers:
                potential_gaps.append(
                    f"{rec.standard_number}: {rec.title} "
                    f"(relevance: {rec.score:.0%}) — not referenced in document"
                )

        await db.commit()

    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return DocumentAnalysisResponse(
        document_id=doc.id,
        filename=filename,
        detected_standards=detected_numbers,
        extracted_text_preview=extracted_text[:500],
        recommendations=search_response.results,
        potential_gaps=potential_gaps,
        potential_outdated=potential_outdated,
        processing_time_ms=round((time.time() - start) * 1000, 2),
    )
