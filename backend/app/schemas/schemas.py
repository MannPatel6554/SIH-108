"""
Pydantic Schemas for BIS SmartSpec AI API
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ─────────────────────────────────────────
# Enums
# ─────────────────────────────────────────

class StandardStatus(str, Enum):
    CURRENT = "CURRENT"
    SUPERSEDED = "SUPERSEDED"
    WITHDRAWN = "WITHDRAWN"
    AMENDED = "AMENDED"
    UNKNOWN = "UNKNOWN"
    DEMO = "DEMO"


class StandardType(str, Enum):
    PRODUCT = "PRODUCT"
    TEST_METHOD = "TEST_METHOD"
    SAFETY = "SAFETY"
    TERMINOLOGY = "TERMINOLOGY"
    INSTALLATION = "INSTALLATION"
    MANAGEMENT = "MANAGEMENT"
    OTHER = "OTHER"


class Sector(str, Enum):
    CONSTRUCTION = "CONSTRUCTION"
    ELECTRICAL = "ELECTRICAL"
    ELECTRONICS = "ELECTRONICS"
    MECHANICAL = "MECHANICAL"
    FOOD = "FOOD"
    TEXTILE = "TEXTILE"
    CHEMICAL = "CHEMICAL"
    AGRICULTURE = "AGRICULTURE"
    WATER = "WATER"
    AUTOMOTIVE = "AUTOMOTIVE"
    HEALTHCARE = "HEALTHCARE"
    GENERAL = "GENERAL"
    OTHER = "OTHER"


class VerificationStatus(str, Enum):
    OFFICIAL_VERIFIED = "OFFICIAL_VERIFIED"
    PUBLIC_BIS_DATA = "PUBLIC_BIS_DATA"
    VERIFIED = "VERIFIED"
    DEMO = "DEMO"
    USER_PROVIDED = "USER_PROVIDED"
    UNVERIFIED = "UNVERIFIED"
    STALE = "STALE"
    ERROR = "ERROR"


class RelationshipType(str, Enum):
    OFFICIAL_REFERRED_STANDARD = "OFFICIAL_REFERRED_STANDARD"
    NORMATIVE_REFERENCE = "NORMATIVE_REFERENCE"
    TEST_METHOD = "TEST_METHOD"
    TERMINOLOGY = "TERMINOLOGY"
    SAFETY = "SAFETY"
    INSTALLATION = "INSTALLATION"
    MATERIAL = "MATERIAL"
    COMPONENT = "COMPONENT"
    RELATED_PRODUCT = "RELATED_PRODUCT"
    QUALITY_MANAGEMENT = "QUALITY_MANAGEMENT"
    REFERENCE = "REFERENCE"
    SUPERSEDES = "SUPERSEDES"
    AMENDED_BY = "AMENDED_BY"


class ItemStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


# ─────────────────────────────────────────
# Standard Schemas
# ─────────────────────────────────────────

class CertificationSchema(BaseModel):
    id: str
    product_category: Optional[str] = None
    certification_type: Optional[str] = None
    is_mandatory: str = "UNKNOWN"
    scheme: Optional[str] = None
    effective_date: Optional[str] = None
    verification_status: str = "DEMO"
    source: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class StandardVersionSchema(BaseModel):
    id: str
    edition_year: Optional[int] = None
    amendment_number: Optional[str] = None
    amendment_date: Optional[str] = None
    amendment_title: Optional[str] = None
    is_current: bool = True
    superseded_by: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class RelatedStandardSchema(BaseModel):
    id: str
    standard_number: str
    title: str
    relationship_type: str
    description: Optional[str] = None
    status: str
    verification_status: str

    class Config:
        from_attributes = True


class StandardBase(BaseModel):
    standard_number: str
    standard_number_normalized: Optional[str] = None
    title: str
    title_hindi: Optional[str] = None
    part: Optional[str] = None
    edition_year: Optional[int] = None
    status: str = "UNKNOWN"
    standard_type: str = "OTHER"
    sector: str = "GENERAL"
    description: Optional[str] = None
    description_hindi: Optional[str] = None
    keywords: List[str] = []
    verification_status: str = "DEMO"
    source_url: Optional[str] = None
    source_name: Optional[str] = "Bureau of Indian Standards"
    source_type: Optional[str] = "OFFICIAL_BIS"
    retrieved_at: Optional[str] = None
    last_checked_at: Optional[str] = None
    content_access: Optional[str] = "PUBLIC_METADATA"
    content_hash: Optional[str] = None
    license_status: Optional[str] = "PUBLIC_METADATA"
    review_date: Optional[str] = None
    product_manual_url: Optional[str] = None
    product_manual_title: Optional[str] = None


class StandardSummary(StandardBase):
    id: str
    certifications: List[CertificationSchema] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StandardDetail(StandardSummary):
    scope: Optional[str] = None
    versions: List[StandardVersionSchema] = []
    related_standards: List[RelatedStandardSchema] = []
    ics_code: Optional[str] = None
    pages: Optional[int] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# Search / Recommendation Schemas
# ─────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    language: str = "en"
    top_k: int = Field(default=5, ge=1, le=20)
    filters: Optional[Dict[str, Any]] = None
    # filters can have: sector, standard_type, status, verification_status


class ScoreBreakdown(BaseModel):
    semantic_score: float
    lexical_score: float
    metadata_score: float
    final_score: float


class EvidenceItem(BaseModel):
    text: str
    source: str


class RecommendationResult(BaseModel):
    standard_id: str
    standard_number: str
    title: str
    title_hindi: Optional[str] = None
    score: float
    confidence: str  # "high", "medium", "low"
    score_breakdown: Optional[ScoreBreakdown] = None
    verification_status: str
    status: str
    standard_type: str
    sector: str
    edition_year: Optional[int] = None
    why_relevant: str
    evidence: List[EvidenceItem] = []
    limitations: List[str] = []
    certifications: List[CertificationSchema] = []
    allied_standards_count: int = 0
    # Provenance fields
    source_name: Optional[str] = "Bureau of Indian Standards"
    source_url: Optional[str] = None
    source_type: Optional[str] = "OFFICIAL_BIS"
    retrieved_at: Optional[str] = None
    content_access: Optional[str] = "PUBLIC_METADATA"


class SearchResponse(BaseModel):
    query: str
    language: str
    results: List[RecommendationResult]
    total_results: int
    search_time_ms: float
    llm_used: bool
    disclaimer: str = (
        "This prototype provides decision-support recommendations. "
        "Procurement officials must verify applicable standards, current editions, "
        "amendments, and certification requirements against authoritative BIS/government "
        "sources before finalizing procurement specifications."
    )


# ─────────────────────────────────────────
# Document Analysis Schemas
# ─────────────────────────────────────────

class DocumentAnalysisResponse(BaseModel):
    document_id: str
    filename: str
    detected_standards: List[str]
    extracted_text_preview: str
    recommendations: List[RecommendationResult]
    potential_gaps: List[str]
    potential_outdated: List[Dict[str, str]]
    processing_time_ms: float


# ─────────────────────────────────────────
# Version Check Schemas
# ─────────────────────────────────────────

class VersionCheckRequest(BaseModel):
    standard_number: str
    referenced_year: Optional[int] = None


class VersionCheckResponse(BaseModel):
    standard_number: str
    found: bool
    current_record: Optional[StandardSummary] = None
    is_potentially_outdated: bool = False
    newer_record_year: Optional[int] = None
    message: str


# ─────────────────────────────────────────
# Compliance Schemas
# ─────────────────────────────────────────

class ComplianceItemCreate(BaseModel):
    standard_id: Optional[str] = None
    standard_number: Optional[str] = None
    standard_title: Optional[str] = None
    item_type: str
    notes: Optional[str] = None


class ComplianceItemUpdate(BaseModel):
    status: ItemStatus
    notes: Optional[str] = None


class ComplianceItemOut(ComplianceItemCreate):
    id: str
    status: str = "PENDING"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplianceChecklistCreate(BaseModel):
    name: Optional[str] = None
    query: Optional[str] = None
    items: List[ComplianceItemCreate] = []


class ComplianceChecklistOut(BaseModel):
    id: str
    name: Optional[str] = None
    query: Optional[str] = None
    items: List[ComplianceItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# Stats Schemas
# ─────────────────────────────────────────

class StatsResponse(BaseModel):
    total_standards: int
    verified_standards: int
    demo_standards: int
    total_relationships: int
    searches_performed: int
    documents_analyzed: int
    checklists_created: int
    mode: str = "DEMO"


# ─────────────────────────────────────────
# Export Schemas
# ─────────────────────────────────────────

class ExportRequest(BaseModel):
    query: str
    results: List[RecommendationResult]
    checklist_items: List[ComplianceItemOut] = []
    include_explanations: bool = True
