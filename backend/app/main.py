"""
BIS SmartSpec AI — FastAPI Application Entry Point

AI-Powered Recommendation Engine for Identifying Applicable Indian Standards
SIH 2026 — Problem Statement PS108
Department: Bureau of Indian Standards (BIS)
"""
import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.core.config import settings
from app.models.session import init_db
from app.api import search, standards, documents, utilities


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    # ── Startup
    logger.info("=" * 60)
    logger.info("BIS SmartSpec AI — Starting up")
    logger.info(f"LLM Provider: {settings.LLM_PROVIDER}")
    logger.info(f"Embedding Model: {settings.EMBEDDING_MODEL}")
    logger.info("=" * 60)

    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs("data", exist_ok=True)

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Check vector store
    from app.services.vector_store import get_vector_store
    vs = get_vector_store()
    if vs.is_available:
        count = vs.count()
        logger.info(f"Vector store ready — {count} documents indexed")
        if count == 0:
            logger.warning(
                "Vector store is empty. Run scripts/seed_demo_data.py then scripts/build_embeddings.py"
            )
    else:
        logger.warning("Vector store not available — semantic search will be limited")

    yield  # Application runs here

    # ── Shutdown
    logger.info("BIS SmartSpec AI — Shutting down")


app = FastAPI(
    title="BIS SmartSpec AI",
    description=(
        "AI-Powered Recommendation Engine for Identifying Applicable Indian Standards.\n\n"
        "SIH 2026 — Problem Statement PS108\n"
        "Department: Bureau of Indian Standards (BIS)\n\n"
        "**DISCLAIMER**: This prototype provides decision-support recommendations. "
        "Procurement officials must verify applicable standards, current editions, amendments, "
        "and certification requirements against authoritative BIS/government sources before "
        "finalizing procurement specifications."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],  # Relaxed for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    logger.info(
        f"{request.method} {request.url.path} — {response.status_code} — {duration:.1f}ms"
    )
    return response


# ── Global error handler
@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal error occurred. Please try again.",
            "path": str(request.url.path),
        },
    )


# ── Health endpoint
@app.get("/health", tags=["system"])
async def health():
    """Health check endpoint."""
    from app.services.vector_store import get_vector_store
    from app.services.embedding_service import get_embedding_service
    from app.rag.llm_provider import get_llm_provider

    vs = get_vector_store()
    emb = get_embedding_service()
    llm = get_llm_provider()

    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "mode": "DEMO",
        "services": {
            "vector_store": {
                "available": vs.is_available,
                "document_count": vs.count(),
            },
            "embedding_model": {
                "available": emb.is_available,
                "model": emb.model_name,
            },
            "llm": {
                "provider": settings.LLM_PROVIDER,
                "available": llm.is_available(),
            },
        },
        "disclaimer": (
            "All demo data records are NOT verified official BIS data. "
            "This is an independent SIH 2026 prototype."
        ),
    }


# ── Register routers
prefix = settings.API_PREFIX
app.include_router(search.router, prefix=prefix)
app.include_router(standards.router, prefix=prefix)
app.include_router(documents.router, prefix=prefix)
app.include_router(utilities.router, prefix=prefix)


# ── Root redirect
@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": "BIS SmartSpec AI",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
        "message": "AI-Powered Recommendation Engine for Indian Standards",
    }
