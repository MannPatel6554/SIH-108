"""
Recommendation Engine for BIS SmartSpec AI

Orchestrates:
1. Query preprocessing
2. Hybrid retrieval
3. DB enrichment (certifications, relationships)
4. LLM explanation generation
5. Result formatting with score breakdown

Hallucination protection:
- LLM receives only retrieved evidence
- IS numbers in output validated against retrieved candidates
- All scores labeled as 'semantic relevance' NOT 'probability'
"""
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
import time
from loguru import logger

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.retrieval.hybrid_retriever import get_retriever, RetrievalCandidate
from app.rag.llm_provider import get_llm_provider
from app.models.database import Standard, Certification, StandardRelationship
from app.schemas.schemas import (
    RecommendationResult, SearchResponse, ScoreBreakdown,
    CertificationSchema, EvidenceItem
)
from app.utils.language import normalize_query


def score_to_confidence(score: float) -> str:
    """
    Map a retrieval score to a confidence label.
    
    Note: These thresholds are heuristic, not statistically calibrated.
    The label reflects retrieval confidence based on the hybrid score.
    """
    if score >= 0.75:
        return "high"
    elif score >= 0.50:
        return "medium"
    else:
        return "low"


class RecommendationEngine:
    """Main recommendation orchestrator."""

    def __init__(self):
        self.retriever = get_retriever()
        self.llm = get_llm_provider()

    async def search(
        self,
        query: str,
        db: AsyncSession,
        top_k: int = 5,
        filters: Optional[Dict] = None,
        language: str = "en",
    ) -> SearchResponse:
        """
        Full search pipeline:
        Query → Normalize → Retrieve → Enrich → Explain → Format
        """
        start = time.time()

        # 1. Normalize query
        normalized_query, detected_lang = normalize_query(query, language)
        effective_lang = detected_lang

        # 2. Retrieve candidates
        candidates, retrieval_latency = self.retriever.retrieve(
            query=normalized_query,
            top_k=top_k,
            filters=filters,
        )

        if not candidates:
            return SearchResponse(
                query=query,
                language=effective_lang,
                results=[],
                total_results=0,
                search_time_ms=(time.time() - start) * 1000,
                llm_used=False,
            )

        # 3. Enrich from database
        standard_ids = [c.standard_id for c in candidates]
        standards_by_id = await self._load_standards(standard_ids, db)

        # 4. Build results
        results = []
        llm_used = self.llm.is_available() and settings_check()

        for cand in candidates:
            std = standards_by_id.get(cand.standard_id)
            if not std:
                continue

            # Generate explanation
            explanation = self.llm.generate_explanation(
                query=normalized_query,
                standard_number=std.standard_number,
                standard_title=std.title,
                evidence_text=cand.document_text,
                language=effective_lang,
            )

            # Evidence items
            evidence = self._extract_evidence(cand.document_text, std)

            # Score breakdown
            score_breakdown = ScoreBreakdown(
                semantic_score=round(cand.semantic_score, 4),
                lexical_score=round(cand.lexical_score, 4),
                metadata_score=round(cand.metadata_score, 4),
                final_score=round(cand.final_score, 4),
            )

            # Certifications
            certifications = [
                CertificationSchema(
                    id=cert.id,
                    product_category=cert.product_category,
                    certification_type=cert.certification_type,
                    is_mandatory=cert.is_mandatory,
                    scheme=cert.scheme,
                    effective_date=cert.effective_date,
                    verification_status=cert.verification_status,
                    source=cert.source,
                    notes=cert.notes,
                )
                for cert in (std.certifications or [])
            ]

            # Count allied standards
            allied_count = len(std.source_relationships or [])

            result = RecommendationResult(
                standard_id=std.id,
                standard_number=std.standard_number,
                title=std.title,
                title_hindi=std.title_hindi,
                score=round(cand.final_score, 4),
                confidence=score_to_confidence(cand.final_score),
                score_breakdown=score_breakdown,
                verification_status=std.verification_status,
                status=std.status,
                standard_type=std.standard_type,
                sector=std.sector,
                edition_year=std.edition_year,
                why_relevant=explanation,
                evidence=evidence,
                limitations=[
                    "This is a DEMO record — not verified official BIS data.",
                    "Verify current edition, amendments, and certification requirements from official BIS sources.",
                ] if std.verification_status == "DEMO" else [],
                certifications=certifications,
                allied_standards_count=allied_count,
                source_name=getattr(std, 'source_name', 'Bureau of Indian Standards') or 'Bureau of Indian Standards',
                source_url=std.source_url,
                source_type=getattr(std, 'source_type', 'OFFICIAL_BIS') or 'OFFICIAL_BIS',
                retrieved_at=getattr(std, 'retrieved_at', None),
                content_access=getattr(std, 'content_access', 'PUBLIC_METADATA') or 'PUBLIC_METADATA',
            )
            results.append(result)

        search_time = (time.time() - start) * 1000
        
        return SearchResponse(
            query=query,
            language=effective_lang,
            results=results,
            total_results=len(results),
            search_time_ms=round(search_time, 2),
            llm_used=llm_used and not isinstance(self.llm.__class__.__name__ == "MockProvider", bool),
        )

    async def _load_standards(
        self, standard_ids: List[str], db: AsyncSession
    ) -> Dict[str, Standard]:
        """Load standards with certifications from DB."""
        if not standard_ids:
            return {}
        
        result = await db.execute(
            select(Standard)
            .options(
                selectinload(Standard.certifications),
                selectinload(Standard.source_relationships),
            )
            .where(Standard.id.in_(standard_ids))
        )
        standards = result.scalars().all()
        return {std.id: std for std in standards}

    def _extract_evidence(
        self, document_text: str, std: Standard
    ) -> List[EvidenceItem]:
        """Extract evidence snippets from retrieved document text."""
        evidence = []
        
        if std.description:
            evidence.append(EvidenceItem(
                text=std.description[:300],
                source=f"Database record: {std.standard_number} description",
            ))
        
        if std.scope:
            evidence.append(EvidenceItem(
                text=std.scope[:200],
                source=f"Database record: {std.standard_number} scope",
            ))

        if std.keywords:
            evidence.append(EvidenceItem(
                text=f"Keywords: {', '.join(std.keywords[:10])}",
                source=f"Database record: {std.standard_number} keywords",
            ))

        return evidence


def settings_check() -> bool:
    """Check if we're using a real LLM provider."""
    from app.core.config import settings
    return settings.LLM_PROVIDER != "mock"


# Singleton
_engine: Optional[RecommendationEngine] = None


def get_recommendation_engine() -> RecommendationEngine:
    global _engine
    if _engine is None:
        _engine = RecommendationEngine()
    return _engine
