"""
Search and Recommendation API endpoints
"""
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import get_db
from app.schemas.schemas import SearchRequest, SearchResponse
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


@router.post("/recommend", response_model=SearchResponse)
async def recommend_standards(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Alias for /search — dedicated recommendation endpoint.
    Same pipeline, may use different default parameters in future.
    """
    return await search_standards(request, db)
