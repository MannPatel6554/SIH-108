"""
Vector Store Service — Dual ChromaDB & Pure NumPy Implementation
Provides high-speed, zero-dependency semantic vector search for BIS SmartSpec AI.

Supports:
1. ChromaDB (when available)
2. Pure NumPy Persistent Vector Store (Zero C++ compiler required, 100% Python 3.13 compatible)
"""
import os
import json
from typing import List, Dict, Any, Optional
import numpy as np
from loguru import logger

from app.core.config import settings


class VectorStore:
    """Abstract interface for vector storage"""

    def add_documents(self, ids: List[str], embeddings, metadatas: List[Dict], documents: List[str]):
        raise NotImplementedError

    def query(self, query_embedding, n_results: int = 10, where: Optional[Dict] = None) -> List[Dict]:
        raise NotImplementedError

    def count(self) -> int:
        raise NotImplementedError

    def reset(self):
        raise NotImplementedError

    @property
    def is_available(self) -> bool:
        raise NotImplementedError


class NumpyVectorStore(VectorStore):
    """
    Zero-C++ High-Performance In-Process Vector Store using NumPy.
    Persists embeddings (.npz) and documents/metadata (.json) to disk.
    100% compatible with Python 3.13 on Windows without MSVC Build Tools.
    """

    def __init__(self, persist_dir: str = None):
        self.persist_dir = persist_dir or settings.VECTOR_DB_PATH
        os.makedirs(self.persist_dir, exist_ok=True)
        self.npz_path = os.path.join(self.persist_dir, "embeddings.npz")
        self.meta_path = os.path.join(self.persist_dir, "metadata.json")

        self.ids: List[str] = []
        self.embeddings: Optional[np.ndarray] = None
        self.metadatas: List[Dict] = []
        self.documents: List[str] = []
        self._load()

    def _load(self):
        """Load persisted embeddings and metadata from disk."""
        try:
            if os.path.exists(self.npz_path) and os.path.exists(self.meta_path):
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.ids = data.get("ids", [])
                    self.metadatas = data.get("metadatas", [])
                    self.documents = data.get("documents", [])

                npz = np.load(self.npz_path)
                self.embeddings = npz["embeddings"]
                logger.info(f"Loaded NumpyVectorStore with {len(self.ids)} standards from {self.persist_dir}")
        except Exception as e:
            logger.warning(f"Could not load vector store from disk: {e}")

    def _save(self):
        """Save embeddings and metadata to disk."""
        try:
            if self.embeddings is not None and len(self.ids) > 0:
                np.savez_compressed(self.npz_path, embeddings=self.embeddings)
                with open(self.meta_path, "w", encoding="utf-8") as f:
                    json.dump(
                        {
                            "ids": self.ids,
                            "metadatas": self.metadatas,
                            "documents": self.documents,
                        },
                        f,
                        ensure_ascii=False,
                    )
                logger.info(f"Persisted {len(self.ids)} vectors to {self.persist_dir}")
        except Exception as e:
            logger.error(f"Failed to persist vector store: {e}")

    @property
    def is_available(self) -> bool:
        return True

    def count(self) -> int:
        return len(self.ids)

    def add_documents(
        self,
        ids: List[str],
        embeddings,
        metadatas: List[Dict],
        documents: List[str],
    ):
        """Add or update documents with normalized embeddings."""
        new_emb = np.array(embeddings, dtype=np.float32)
        # Normalize embeddings for cosine similarity
        norms = np.linalg.norm(new_emb, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        new_emb = new_emb / norms

        if self.embeddings is None or len(self.ids) == 0:
            self.ids = list(ids)
            self.embeddings = new_emb
            self.metadatas = list(metadatas)
            self.documents = list(documents)
        else:
            # Upsert logic
            existing_id_map = {id_: idx for idx, id_ in enumerate(self.ids)}
            for i, doc_id in enumerate(ids):
                if doc_id in existing_id_map:
                    idx = existing_id_map[doc_id]
                    self.embeddings[idx] = new_emb[i]
                    self.metadatas[idx] = metadatas[i]
                    self.documents[idx] = documents[i]
                else:
                    self.ids.append(doc_id)
                    self.embeddings = np.vstack([self.embeddings, new_emb[i]])
                    self.metadatas.append(metadatas[i])
                    self.documents.append(documents[i])

        self._save()
        logger.info(f"NumpyVectorStore: Added {len(ids)} items. Total: {len(self.ids)}")

    def query(
        self,
        query_embedding,
        n_results: int = 10,
        where: Optional[Dict] = None,
    ) -> List[Dict]:
        """Perform exact cosine similarity search."""
        if self.embeddings is None or len(self.ids) == 0:
            return []

        q_vec = np.array(query_embedding, dtype=np.float32).flatten()
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        # Cosine similarity via dot product of normalized vectors
        scores = np.dot(self.embeddings, q_vec)

        # Apply where metadata filters if provided
        valid_indices = []
        for idx in range(len(self.ids)):
            if where:
                match = True
                meta = self.metadatas[idx]
                for k, v in where.items():
                    if meta.get(k) != v:
                        match = False
                        break
                if not match:
                    continue
            valid_indices.append(idx)

        if not valid_indices:
            return []

        # Sort indices by score descending
        valid_scores = scores[valid_indices]
        top_k_indices = np.argsort(valid_scores)[::-1][:n_results]

        output = []
        for top_idx in top_k_indices:
            actual_idx = valid_indices[top_idx]
            sim = float(valid_scores[top_idx])
            output.append({
                "id": self.ids[actual_idx],
                "similarity": max(0.0, min(1.0, sim)),
                "metadata": self.metadatas[actual_idx],
                "document": self.documents[actual_idx],
            })

        return output

    def reset(self):
        """Reset the vector index."""
        self.ids = []
        self.embeddings = None
        self.metadatas = []
        self.documents = []
        if os.path.exists(self.npz_path):
            os.remove(self.npz_path)
        if os.path.exists(self.meta_path):
            os.remove(self.meta_path)
        logger.info("NumpyVectorStore reset completed.")


class LocalChromaStore(VectorStore):
    """ChromaDB implementation with automatic fallback to NumpyVectorStore."""

    def __init__(self, persist_dir: str = None, collection_name: str = None):
        self.persist_dir = persist_dir or settings.VECTOR_DB_PATH
        self.collection_name = collection_name or settings.COLLECTION_NAME
        self._fallback_store = NumpyVectorStore(persist_dir=self.persist_dir)
        self._use_chroma = False

        try:
            import chromadb
            self._client = chromadb.PersistentClient(path=self.persist_dir)
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            self._use_chroma = True
            logger.info(f"ChromaDB initialized successfully at {self.persist_dir}")
        except Exception:
            self._use_chroma = False
            logger.info("Using high-speed native NumPy Vector Store (Zero-C++ build requirements)")

    @property
    def is_available(self) -> bool:
        return True

    def add_documents(self, ids: List[str], embeddings, metadatas: List[Dict], documents: List[str]):
        if self._use_chroma:
            try:
                clean_meta = []
                for m in metadatas:
                    clean = {k: v if isinstance(v, (str, int, float, bool)) else str(v or "") for k, v in m.items()}
                    clean_meta.append(clean)
                self._collection.upsert(
                    ids=ids,
                    embeddings=[e.tolist() if hasattr(e, 'tolist') else e for e in embeddings],
                    metadatas=clean_meta,
                    documents=documents,
                )
                return
            except Exception as e:
                logger.warning(f"ChromaDB upsert failed, falling back to NumPy store: {e}")

        self._fallback_store.add_documents(ids, embeddings, metadatas, documents)

    def query(self, query_embedding, n_results: int = 10, where: Optional[Dict] = None) -> List[Dict]:
        if self._use_chroma:
            try:
                count = self._collection.count()
                if count > 0:
                    kwargs = {
                        "query_embeddings": [query_embedding if not hasattr(query_embedding, 'tolist') else query_embedding.tolist()],
                        "n_results": min(n_results, count),
                        "include": ["metadatas", "documents", "distances"],
                    }
                    if where:
                        kwargs["where"] = where
                    results = self._collection.query(**kwargs)
                    if results and results.get("ids") and results["ids"][0]:
                        output = []
                        for i, doc_id in enumerate(results["ids"][0]):
                            dist = results["distances"][0][i]
                            output.append({
                                "id": doc_id,
                                "similarity": max(0.0, 1.0 - dist),
                                "metadata": results["metadatas"][0][i],
                                "document": results["documents"][0][i],
                            })
                        return output
            except Exception as e:
                logger.warning(f"ChromaDB query failed, using NumPy store: {e}")

        return self._fallback_store.query(query_embedding, n_results, where)

    def count(self) -> int:
        if self._use_chroma:
            try:
                c = self._collection.count()
                if c > 0:
                    return c
            except Exception:
                pass
        return self._fallback_store.count()

    def reset(self):
        if self._use_chroma:
            try:
                self._client.delete_collection(self.collection_name)
                self._collection = self._client.get_or_create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
            except Exception:
                pass
        self._fallback_store.reset()


_vector_store: Optional[LocalChromaStore] = None


def get_vector_store() -> LocalChromaStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = LocalChromaStore()
    return _vector_store
