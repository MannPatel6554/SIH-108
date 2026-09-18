"""
Build and index embeddings for all standards in the database.
Run this script after seeding demo data.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.database import Standard
from app.services.embedding_service import get_embedding_service
from app.services.vector_store import get_vector_store


DATABASE_URL = "sqlite+aiosqlite:///./data/bis_smartspec.db"


def build_document_text(standard: Standard) -> str:
    """Build a rich text document for embedding."""
    parts = [
        f"Standard Number: {standard.standard_number}",
        f"Title: {standard.title}",
    ]
    if standard.title_hindi:
        parts.append(f"Hindi Title: {standard.title_hindi}")
    if standard.description:
        parts.append(f"Description: {standard.description}")
    if standard.description_hindi:
        parts.append(f"Hindi Description: {standard.description_hindi}")
    if standard.scope:
        parts.append(f"Scope: {standard.scope}")
    if standard.keywords:
        parts.append(f"Keywords: {', '.join(standard.keywords)}")
    parts.append(f"Sector: {standard.sector}")
    parts.append(f"Type: {standard.standard_type}")
    return "\n".join(parts)


async def build_embeddings(incremental: bool = False):
    """Generate and index embeddings for standards."""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    embedding_service = get_embedding_service()
    vector_store = get_vector_store()

    print(f"Embedding model available: {embedding_service.is_available}")
    print(f"Vector store available: {vector_store.is_available}")

    async with async_session() as session:
        result = await session.execute(select(Standard))
        standards = result.scalars().all()

    if not standards:
        print("No standards found in database.")
        await engine.dispose()
        return

    print(f"Processing embeddings for {len(standards)} standards...")

    ids = []
    texts = []
    metadatas = []

    for std in standards:
        doc_text = build_document_text(std)
        ids.append(std.id)
        texts.append(doc_text)
        metadatas.append({
            "standard_id": std.id,
            "standard_number": std.standard_number,
            "title": std.title,
            "sector": std.sector or "GENERAL",
            "standard_type": std.standard_type or "OTHER",
            "status": std.status or "CURRENT",
            "verification_status": std.verification_status or "DEMO",
            "edition_year": std.edition_year or 0,
            "source_name": std.source_name or "Bureau of Indian Standards",
            "source_url": std.source_url or "",
            "content_access": std.content_access or "PUBLIC_METADATA",
        })

    # Generate embeddings
    embeddings = embedding_service.embed(texts)

    # Store in vector DB
    vector_store.add_documents(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=texts,
    )

    print(f"[OK] Indexed {len(ids)} standards in vector store")
    print(f"[OK] Vector store count: {vector_store.count()}")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(build_embeddings())
