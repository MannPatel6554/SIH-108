"""
Embedding Service for BIS SmartSpec AI
Uses sentence-transformers for generating text embeddings.
Supports multilingual queries (English + Hindi).
"""
from typing import List, Optional
import numpy as np
from loguru import logger
from app.core.config import settings


class EmbeddingService:
    """
    Wrapper around sentence-transformers for generating embeddings.
    The model 'all-MiniLM-L6-v2' has good performance on CPU and
    supports multilingual text through the multilingual variant.
    
    For best multilingual (Hindi+English) support, use:
    'paraphrase-multilingual-MiniLM-L12-v2'
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self._model = None
        self._available = False

    def _load_model(self):
        """Lazy-load the embedding model."""
        if self._model is not None:
            return
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {self.model_name}")
            self._model = SentenceTransformer(self.model_name)
            self._available = True
            logger.info(f"Embedding model loaded successfully: {self.model_name}")
        except ImportError:
            logger.warning("sentence-transformers not installed. Using fallback embeddings.")
            self._available = False
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            self._available = False

    @property
    def is_available(self) -> bool:
        self._load_model()
        return self._available

    def embed(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts.
        
        Falls back to TF-IDF style random embeddings if model unavailable.
        """
        self._load_model()

        if self._available and self._model is not None:
            embeddings = self._model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            return embeddings
        else:
            # Deterministic fallback: hash-based pseudo-embeddings
            # This allows the app to run without sentence-transformers
            logger.warning("Using hash-based fallback embeddings (not semantic)")
            return self._hash_embeddings(texts)

    def embed_single(self, text: str) -> np.ndarray:
        """Generate embedding for a single text."""
        return self.embed([text])[0]

    def _hash_embeddings(self, texts: List[str], dim: int = 384) -> np.ndarray:
        """
        Deterministic hash-based fallback embeddings.
        NOT semantically meaningful but allows the app to function.
        """
        embeddings = []
        for text in texts:
            # Create a deterministic vector from the text
            import hashlib
            hash_bytes = hashlib.sha256(text.lower().encode()).digest()
            # Expand to required dimensions by cycling
            extended = (hash_bytes * (dim // len(hash_bytes) + 1))[:dim]
            vec = np.frombuffer(extended, dtype=np.uint8).astype(np.float32)
            vec = vec / (vec.sum() + 1e-8)  # normalize
            # Add word-count features for crude similarity
            words = text.lower().split()
            for i, word in enumerate(words[:min(len(words), 20)]):
                idx = hash(word) % dim
                vec[idx] += 0.1
            # L2 normalize
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            embeddings.append(vec)
        return np.array(embeddings)


# Singleton instance
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
