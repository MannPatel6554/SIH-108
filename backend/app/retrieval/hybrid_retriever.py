"""
Hybrid Retrieval Engine for BIS SmartSpec AI

Combines:
1. Vector/semantic search (ChromaDB)
2. BM25 lexical search
3. Metadata filtering

Configurable weights for scoring components.
"""
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import math
import time
from loguru import logger

from app.core.config import settings
from app.services.embedding_service import get_embedding_service
from app.services.vector_store import get_vector_store
from app.utils.language import normalize_query


@dataclass
class RetrievalCandidate:
    """Intermediate candidate during retrieval."""
    standard_id: str
    standard_number: str
    title: str
    document_text: str
    metadata: Dict[str, Any]
    semantic_score: float = 0.0
    lexical_score: float = 0.0
    metadata_score: float = 0.0
    final_score: float = 0.0


class HybridRetriever:
    """
    Hybrid retrieval combining vector search + BM25 + metadata matching.
    
    Scoring formula:
        final_score = (semantic_score * semantic_weight) 
                    + (lexical_score * lexical_weight) 
                    + (metadata_score * metadata_weight)
    
    Weights are configurable via Settings.
    Note: These weights are reasonable defaults, not statistically calibrated values.
    """

    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.vector_store = get_vector_store()
        self._bm25_corpus: Optional[List] = None
        self._bm25_model = None
        self._corpus_standards: Optional[List[Dict]] = None

    def _init_bm25(self, corpus_docs: List[str], corpus_standards: List[Dict]):
        """Initialize BM25 with corpus documents."""
        try:
            from rank_bm25 import BM25Okapi
            tokenized = [doc.lower().split() for doc in corpus_docs]
            self._bm25_model = BM25Okapi(tokenized)
            self._corpus_standards = corpus_standards
            logger.debug(f"BM25 initialized with {len(corpus_docs)} documents")
        except ImportError:
            logger.warning("rank_bm25 not available. Lexical search disabled.")
            self._bm25_model = None

    def retrieve(
        self,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict] = None,
        semantic_weight: Optional[float] = None,
        lexical_weight: Optional[float] = None,
        metadata_weight: Optional[float] = None,
    ) -> Tuple[List[RetrievalCandidate], float]:
        """
        Perform hybrid retrieval.
        
        Returns:
            (candidates_sorted_by_score, latency_ms)
        """
        start_time = time.time()
        
        # Use config weights if not overridden
        s_w = semantic_weight if semantic_weight is not None else settings.SEMANTIC_WEIGHT
        l_w = lexical_weight if lexical_weight is not None else settings.LEXICAL_WEIGHT
        m_w = metadata_weight if metadata_weight is not None else settings.METADATA_WEIGHT

        # Normalize query
        normalized_query, lang = normalize_query(query)
        
        # Expand n_results for fusion
        expanded_k = min(top_k * 3, 50)

        # 1. Vector Search
        vector_results = self._vector_search(normalized_query, expanded_k, filters)
        
        # 2. Merge candidates
        candidates: Dict[str, RetrievalCandidate] = {}
        
        for vr in vector_results:
            cid = vr["id"]
            meta = vr["metadata"]
            candidates[cid] = RetrievalCandidate(
                standard_id=cid,
                standard_number=meta.get("standard_number", ""),
                title=meta.get("title", ""),
                document_text=vr.get("document", ""),
                metadata=meta,
                semantic_score=vr["similarity"],
            )

        # 3. BM25 Lexical Search (against in-memory corpus from vector results)
        if candidates:
            corpus_docs = [c.document_text for c in candidates.values()]
            corpus_list = list(candidates.values())
            self._init_bm25(corpus_docs, [])
            
            if self._bm25_model:
                tokenized_query = normalized_query.lower().split()
                scores = self._bm25_model.get_scores(tokenized_query)
                max_score = max(scores) if max(scores) > 0 else 1.0
                for i, cand in enumerate(corpus_list):
                    if i < len(scores):
                        cand.lexical_score = scores[i] / max_score

        # 4. Metadata Score
        for cand in candidates.values():
            cand.metadata_score = self._metadata_score(query, cand.metadata, filters)

        # 5. Final score
        for cand in candidates.values():
            cand.final_score = (
                cand.semantic_score * s_w
                + cand.lexical_score * l_w
                + cand.metadata_score * m_w
            )

        # 6. Sort and return top_k
        sorted_candidates = sorted(
            candidates.values(),
            key=lambda c: c.final_score,
            reverse=True,
        )[:top_k]

        latency_ms = (time.time() - start_time) * 1000
        return sorted_candidates, latency_ms

    def _vector_search(
        self,
        query: str,
        n_results: int,
        filters: Optional[Dict],
    ) -> List[Dict]:
        """Run vector similarity search."""
        if not self.vector_store.is_available or self.vector_store.count() == 0:
            return []
        
        query_embedding = self.embedding_service.embed_single(query)
        
        # Build ChromaDB where filter
        where = None
        if filters:
            conditions = []
            if filters.get("sector"):
                conditions.append({"sector": {"$eq": filters["sector"]}})
            if filters.get("standard_type"):
                conditions.append({"standard_type": {"$eq": filters["standard_type"]}})
            if filters.get("status"):
                conditions.append({"status": {"$eq": filters["status"]}})
            if filters.get("verification_status"):
                conditions.append({"verification_status": {"$eq": filters["verification_status"]}})
            if len(conditions) == 1:
                where = conditions[0]
            elif len(conditions) > 1:
                where = {"$and": conditions}
        
        return self.vector_store.query(query_embedding, n_results=n_results, where=where)

    def _metadata_score(self, query: str, metadata: Dict, filters: Optional[Dict]) -> float:
        """
        Simple metadata relevance score.
        Checks query terms against standard metadata fields.
        """
        score = 0.0
        query_lower = query.lower()
        query_tokens = set(query_lower.split())
        
        # Check title match (English & Hindi)
        title = str(metadata.get("title", "")).lower()
        title_tokens = set(title.split())
        overlap = len(query_tokens & title_tokens)
        if overlap > 0:
            score += min(0.5, overlap * 0.15)

        title_hindi = str(metadata.get("title_hindi", "")).lower()
        if title_hindi:
            title_hindi_tokens = set(title_hindi.split())
            overlap_hi = len(query_tokens & title_hindi_tokens)
            if overlap_hi > 0:
                score += min(0.5, overlap_hi * 0.15)
        
        # Check sector relevance (English & Hindi)
        sector = str(metadata.get("sector", "")).lower()
        sector_keywords = {
            "WATER": ["water", "pipe", "supply", "sewage", "plumbing"],
            "ELECTRICAL": ["electric", "cable", "wire", "voltage", "power", "led", "light"],
            "CONSTRUCTION": ["cement", "concrete", "steel", "construction", "building"],
            "HEALTHCARE": ["safety", "helmet", "ppe", "protection"],
        }
        for sec, keywords in sector_keywords.items():
            if metadata.get("sector") == sec:
                for kw in keywords:
                    if kw in query_lower:
                        score += 0.1
                        break

        sector_keywords_hi = {
            "WATER": ["पानी", "सप्लाई", "पाइप", "सीवेज"],
            "ELECTRICAL": ["बिजली", "तार", "केबल", "लाइट"],
            "CONSTRUCTION": ["सीमेंट", "कंक्रीट", "स्टील", "भवन", "निर्माण"],
            "HEALTHCARE": ["सुरक्षा", "हेलमेट"],
        }
        for sec, keywords in sector_keywords_hi.items():
            if metadata.get("sector") == sec:
                for kw in keywords:
                    if kw in query_lower:
                        score += 0.1
                        break
        
        # Fresher records get slight boost (not claimed as meaningful signal)
        edition_year = metadata.get("edition_year", 0)
        if edition_year and edition_year > 2000:
            score += 0.05

        return min(1.0, score)

    def get_status(self) -> Dict[str, Any]:
        """Return status of the retrieval engine."""
        return {
            "vector_store_available": self.vector_store.is_available,
            "vector_store_count": self.vector_store.count(),
            "embedding_model_available": self.embedding_service.is_available,
            "embedding_model": self.embedding_service.model_name,
            "weights": {
                "semantic": settings.SEMANTIC_WEIGHT,
                "lexical": settings.LEXICAL_WEIGHT,
                "metadata": settings.METADATA_WEIGHT,
            },
        }


# Singleton
_retriever: Optional[HybridRetriever] = None


def get_retriever() -> HybridRetriever:
    global _retriever
    if _retriever is None:
        _retriever = HybridRetriever()
    return _retriever
