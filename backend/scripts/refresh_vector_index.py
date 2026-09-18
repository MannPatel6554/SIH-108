"""
Vector Store Index Refresh CLI — BIS SmartSpec AI
Stage 5 in the Real BIS Data Ingestion Pipeline

Rebuilds or refreshes the ChromaDB vector embeddings for all standards in SQLite.
Usage:
    python scripts/refresh_vector_index.py [--force-rebuild]
"""
import asyncio
import os
import sys
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.vector_store import get_vector_store
from scripts.build_embeddings import build_embeddings


async def refresh_index(force_rebuild: bool = False):
    vs = get_vector_store()
    if force_rebuild:
        print("[Vector Refresh] Resetting ChromaDB vector collection...")
        try:
            vs.reset()
            print("[Vector Refresh] Existing collection cleared.")
        except Exception as e:
            print(f"[Vector Refresh Warning] Reset error: {e}")

    print("[Vector Refresh] Building embeddings from current SQLite database...")
    await build_embeddings(incremental=not force_rebuild)
    print(f"[Vector Refresh] Completed. Active documents in vector store: {vs.count()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Refresh ChromaDB vector index")
    parser.add_argument("--force-rebuild", action="store_true", help="Clear existing collection and rebuild from scratch")
    args = parser.parse_args()

    asyncio.run(refresh_index(force_rebuild=args.force_rebuild))
