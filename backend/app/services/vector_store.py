"""
Vector Store Service — ChromaDB implementation for BIS SmartSpec AI
Provides an abstraction layer over ChromaDB for storing and querying embeddings.
"""
from typing import List, Dict, Any, Optional, Tuple
from loguru import logger
import os

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


class LocalChromaStore(VectorStore):
    """
    ChromaDB-based local vector store.
    Stores embeddings + metadata for semantic search.
    """

    def __init__(self, persist_dir: str = None, collection_name: str = None):
        self.persist_dir = persist_dir or settings.VECTOR_DB_PATH
        self.collection_name = collection_name or settings.COLLECTION_NAME
        self._client = None
        self._collection = None
        self._available = False
        os.makedirs(self.persist_dir, exist_ok=True)

    def _init_client(self):
        if self._client is not None:
            return
        try:
            import chromadb
            self._client = chromadb.PersistentClient(path=self.persist_dir)
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            self._available = True
            logger.info(f"ChromaDB initialized at {self.persist_dir}")
        except ImportError:
            logger.warning("ChromaDB not installed. Vector search unavailable.")
            self._available = False
        except Exception as e:
            logger.error(f"ChromaDB init failed: {e}")
            self._available = False

    @property
    def is_available(self) -> bool:
        self._init_client()
        return self._available

    def add_documents(
        self,
        ids: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict],
        documents: List[str],
    ):
        self._init_client()
        if not self._available:
            return
        
        try:
            # Process in batches to avoid memory issues
            batch_size = 100
            for i in range(0, len(ids), batch_size):
                batch_ids = ids[i:i+batch_size]
                batch_emb = embeddings[i:i+batch_size]
                batch_meta = metadatas[i:i+batch_size]
                batch_docs = documents[i:i+batch_size]
                
                # Sanitize metadata (ChromaDB requires str/int/float/bool values)
                clean_meta = []
                for m in batch_meta:
                    clean = {}
                    for k, v in m.items():
                        if isinstance(v, (str, int, float, bool)):
                            clean[k] = v
                        elif v is None:
                            clean[k] = ""
                        else:
                            clean[k] = str(v)
                    clean_meta.append(clean)
                
                self._collection.upsert(
                    ids=batch_ids,
                    embeddings=[e.tolist() if hasattr(e, 'tolist') else e for e in batch_emb],
                    metadatas=clean_meta,
                    documents=batch_docs,
                )
            logger.info(f"Added {len(ids)} documents to vector store")
        except Exception as e:
            logger.error(f"Failed to add documents to vector store: {e}")

    def query(
        self,
        query_embedding: List[float],
        n_results: int = 10,
        where: Optional[Dict] = None,
    ) -> List[Dict]:
        self._init_client()
        if not self._available or self._collection is None:
            return []
        
        try:
            count = self._collection.count()
            if count == 0:
                return []
            
            kwargs = {
                "query_embeddings": [query_embedding if not hasattr(query_embedding, 'tolist') else query_embedding.tolist()],
                "n_results": min(n_results, count),
                "include": ["metadatas", "documents", "distances"],
            }
            if where:
                kwargs["where"] = where
            
            results = self._collection.query(**kwargs)
            
            output = []
            if results and results.get("ids"):
                ids = results["ids"][0]
                distances = results["distances"][0]
                metadatas = results["metadatas"][0]
                documents = results["documents"][0]
                
                for i, doc_id in enumerate(ids):
                    # Convert cosine distance to similarity score
                    similarity = max(0.0, 1.0 - distances[i])
                    output.append({
                        "id": doc_id,
                        "similarity": similarity,
                        "metadata": metadatas[i],
                        "document": documents[i],
                    })
            return output
        except Exception as e:
            logger.error(f"Vector query failed: {e}")
            return []

    def count(self) -> int:
        self._init_client()
        if not self._available or self._collection is None:
            return 0
        try:
            return self._collection.count()
        except:
            return 0

    def reset(self):
        """Delete and recreate the collection"""
        self._init_client()
        if not self._available or self._client is None:
            return
        try:
            self._client.delete_collection(self.collection_name)
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("Vector store reset")
        except Exception as e:
            logger.error(f"Vector store reset failed: {e}")


# Singleton
_vector_store: Optional[LocalChromaStore] = None


def get_vector_store() -> LocalChromaStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = LocalChromaStore()
    return _vector_store
