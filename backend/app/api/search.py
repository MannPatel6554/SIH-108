"""
Search and Recommendation API endpoints
"""
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from typing import List
from app.models.session import get_db
from app.schemas.schemas import (
    SearchRequest, SearchResponse,
    SearchFeedbackCreate, SearchFeedbackResponse, TrainingPairExport
)
from app.services.recommendation_engine import get_recommendation_engine
from app.models.database import SearchHistory
import uuid

router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search_standards(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Semantic search for applicable Indian Standards.
    
    Combines vector similarity, lexical matching, and metadata scoring.
    Returns ranked recommendations with explanations.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    engine = get_recommendation_engine()
    
    start = time.time()
    response = await engine.search(
        query=request.query,
        db=db,
        top_k=request.top_k,
        filters=request.filters,
        language=request.language,
    )
    
    # Log to history
    history_entry = SearchHistory(
        id=str(uuid.uuid4()),
        query=request.query,
        language=response.language,
        top_k=request.top_k,
        result_count=len(response.results),
        latency_ms=response.search_time_ms,
        filters=request.filters or {},
    )
    db.add(history_entry)
    await db.commit()
    
    return response


@router.post("/search/feedback", response_model=SearchFeedbackResponse)
@router.post("/feedback", response_model=SearchFeedbackResponse)
async def submit_search_feedback(
    feedback: SearchFeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Active Learning: Log user click-through and relevance ratings.
    Used for domain contrastive fine-tuning and continuous learning.
    """
    from app.models.database import SearchFeedback
    fb_entry = SearchFeedback(
        id=str(uuid.uuid4()),
        query=feedback.query,
        standard_id=feedback.standard_id,
        standard_number=feedback.standard_number,
        is_relevant=feedback.is_relevant,
        rating=feedback.rating,
        user_comment=feedback.user_comment,
        user_role=feedback.user_role or "PROCUREMENT_OFFICER",
    )
    db.add(fb_entry)
    await db.commit()
    return SearchFeedbackResponse(
        id=fb_entry.id,
        status="SUCCESS",
        message=f"Relevance signal recorded for {feedback.standard_number}. Added to domain training queue.",
    )


@router.get("/search/feedback/export-training-pairs", response_model=List[TrainingPairExport])
@router.get("/feedback/export-training-pairs", response_model=List[TrainingPairExport])
async def export_training_pairs(
    db: AsyncSession = Depends(get_db),
):
    """
    Export verified positive click-through feedback into contrastive training pairs
    for continuous fine-tuning via scripts/finetune_domain_embeddings.py.
    """
    from app.models.database import SearchFeedback
    from sqlalchemy import select
    stmt = select(SearchFeedback).where(SearchFeedback.is_relevant == True)
    res = await db.execute(stmt)
    feedbacks = res.scalars().all()
    pairs = [
        TrainingPairExport(
            anchor_query=fb.query,
            positive_standard=fb.standard_number,
            source="USER_FEEDBACK_LOOP",
            rating=fb.rating,
        )
        for fb in feedbacks
    ]
    return pairs
