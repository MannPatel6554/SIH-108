"""
SQLAlchemy Database Models for BIS SmartSpec AI
"""
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class Standard(Base):
    """Core BIS Standard record"""
    __tablename__ = "standards"

    id = Column(String, primary_key=True, default=generate_uuid)
    standard_number = Column(String, nullable=False, unique=True, index=True)
    title = Column(String, nullable=False, index=True)
    title_hindi = Column(String, nullable=True)
    part = Column(String, nullable=True)
    section = Column(String, nullable=True)
    edition_year = Column(Integer, nullable=True)
    publication_date = Column(String, nullable=True)
    revision_date = Column(String, nullable=True)
    status = Column(String, default="UNKNOWN", index=True)  # CURRENT, SUPERSEDED, WITHDRAWN, AMENDED, UNKNOWN, DEMO
    standard_type = Column(String, default="OTHER", index=True)  # PRODUCT, TEST_METHOD, SAFETY, TERMINOLOGY, INSTALLATION, MANAGEMENT, OTHER
    sector = Column(String, default="GENERAL", index=True)  # CONSTRUCTION, ELECTRICAL, etc.
    description = Column(Text, nullable=True)
    description_hindi = Column(Text, nullable=True)
    keywords = Column(JSON, default=list)
    scope = Column(Text, nullable=True)
    source_url = Column(String, nullable=True)
    verification_status = Column(String, default="DEMO")  # VERIFIED, DEMO, USER_PROVIDED, UNVERIFIED
    ics_code = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    pages = Column(Integer, nullable=True)
    
    # Provenance and Official Verification Fields
    standard_number_normalized = Column(String, nullable=True, index=True)
    source_name = Column(String, default="Bureau of Indian Standards")
    source_type = Column(String, default="OFFICIAL_BIS")
    retrieved_at = Column(String, nullable=True)
    last_checked_at = Column(String, nullable=True)
    content_access = Column(String, default="PUBLIC_METADATA")
    content_hash = Column(String, nullable=True)
    license_status = Column(String, default="PUBLIC_METADATA")
    review_date = Column(String, nullable=True)
    product_manual_url = Column(String, nullable=True)
    product_manual_title = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    versions = relationship("StandardVersion", back_populates="standard", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="standard", cascade="all, delete-orphan")
    source_relationships = relationship(
        "StandardRelationship",
        foreign_keys="StandardRelationship.source_id",
        back_populates="source",
        cascade="all, delete-orphan"
    )
    target_relationships = relationship(
        "StandardRelationship",
        foreign_keys="StandardRelationship.target_id",
        back_populates="target"
    )
    clauses = relationship("StandardClause", back_populates="standard", cascade="all, delete-orphan")


class StandardVersion(Base):
    """Version history of a standard"""
    __tablename__ = "standard_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    standard_id = Column(String, ForeignKey("standards.id"), nullable=False)
    edition_year = Column(Integer, nullable=True)
    amendment_number = Column(String, nullable=True)
    amendment_date = Column(String, nullable=True)
    amendment_title = Column(String, nullable=True)
    is_current = Column(Boolean, default=True)
    superseded_by = Column(String, nullable=True)  # standard_number
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    standard = relationship("Standard", back_populates="versions")


class StandardRelationship(Base):
    """Graph edges between standards"""
    __tablename__ = "standard_relationships"

    id = Column(String, primary_key=True, default=generate_uuid)
    source_id = Column(String, ForeignKey("standards.id"), nullable=False, index=True)
    target_id = Column(String, ForeignKey("standards.id"), nullable=False, index=True)
    relationship_type = Column(String, nullable=False)
    # NORMATIVE_REFERENCE, TEST_METHOD, TERMINOLOGY, SAFETY, INSTALLATION,
    # MATERIAL, COMPONENT, RELATED_PRODUCT, QUALITY_MANAGEMENT,
    # REFERENCE, SUPERSEDES, AMENDED_BY
    description = Column(Text, nullable=True)
    verification_status = Column(String, default="DEMO")
    source_url = Column(String, nullable=True)
    retrieved_at = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("Standard", foreign_keys=[source_id], back_populates="source_relationships")
    target = relationship("Standard", foreign_keys=[target_id], back_populates="target_relationships")


class Certification(Base):
    """BIS Certification / Compliance data"""
    __tablename__ = "certifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    standard_id = Column(String, ForeignKey("standards.id"), nullable=False, index=True)
    product_category = Column(String, nullable=True)
    certification_type = Column(String, nullable=True)  # ISI_MARK, HALLMARK, CRS, OTHER
    is_mandatory = Column(String, default="UNKNOWN")  # MANDATORY, VOLUNTARY, UNKNOWN
    scheme = Column(String, nullable=True)
    effective_date = Column(String, nullable=True)
    verification_status = Column(String, default="DEMO")
    source = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    retrieved_at = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    standard = relationship("Standard", back_populates="certifications")


class Document(Base):
    """Uploaded tender/specification documents"""
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx, txt
    file_size = Column(Integer, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, PROCESSING, DONE, ERROR
    extracted_text = Column(Text, nullable=True)
    detected_standards = Column(JSON, default=list)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    references = relationship("DocumentReference", back_populates="document", cascade="all, delete-orphan")


class DocumentReference(Base):
    """Standards referenced in a document"""
    __tablename__ = "document_references"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    standard_number = Column(String, nullable=False)
    referenced_year = Column(Integer, nullable=True)
    context_snippet = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_standard_id = Column(String, ForeignKey("standards.id"), nullable=True)
    is_outdated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="references")


class SearchHistory(Base):
    """Search query history"""
    __tablename__ = "search_history"

    id = Column(String, primary_key=True, default=generate_uuid)
    query = Column(Text, nullable=False)
    language = Column(String, default="en")
    top_k = Column(Integer, default=5)
    result_count = Column(Integer, default=0)
    latency_ms = Column(Float, nullable=True)
    filters = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class ComplianceChecklist(Base):
    """User compliance checklists"""
    __tablename__ = "compliance_checklists"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=True)
    query = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("ComplianceItem", back_populates="checklist", cascade="all, delete-orphan")


class ComplianceItem(Base):
    """Individual compliance checklist item"""
    __tablename__ = "compliance_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    checklist_id = Column(String, ForeignKey("compliance_checklists.id"), nullable=False)
    standard_id = Column(String, ForeignKey("standards.id"), nullable=True)
    standard_number = Column(String, nullable=True)
    standard_title = Column(String, nullable=True)
    item_type = Column(String, nullable=False)
    # PRODUCT_STANDARD, TEST_METHOD, SAFETY, INSTALLATION, CERTIFICATION, VERSION, SPECIFICATION
    status = Column(String, default="PENDING")  # PENDING, VERIFIED, NOT_APPLICABLE
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    checklist = relationship("ComplianceChecklist", back_populates="items")


class DataSource(Base):
    """Data provenance tracking"""
    __tablename__ = "data_sources"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=True)  # OFFICIAL_BIS, DEMO, USER_UPLOAD
    source_url = Column(String, nullable=True)
    record_count = Column(Integer, default=0)
    verification_status = Column(String, default="DEMO")
    last_ingested = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class IngestionAudit(Base):
    """Audit history and change detection across ingestion runs"""
    __tablename__ = "ingestion_audits"

    id = Column(String, primary_key=True, default=generate_uuid)
    run_id = Column(String, nullable=False, index=True)
    standard_number = Column(String, nullable=False, index=True)
    change_type = Column(String, nullable=False)  # NEW_STANDARD, UPDATED_STANDARD, REVISED_STANDARD, AMENDMENT_UPDATED, STATUS_CHANGED, REMOVED_FROM_SOURCE, UNCHANGED
    details = Column(Text, nullable=True)
    snapshot_file = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    """User account with Role-Based Access Control (RBAC)"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="PROCUREMENT_OFFICER", nullable=False)
    # Roles: PROCUREMENT_OFFICER, TECHNICAL_EXPERT, COMPLIANCE_ADMIN, BIDDER_MSME
    department = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class StandardClause(Base):
    """Specific technical clause/specification chunk of a standard for Deep Spec Search"""
    __tablename__ = "standard_clauses"

    id = Column(String, primary_key=True, default=generate_uuid)
    standard_id = Column(String, ForeignKey("standards.id"), nullable=False, index=True)
    standard_number = Column(String, nullable=False, index=True)
    clause_number = Column(String, nullable=False)  # e.g., "Clause 4.1", "Clause 7.2", "Clause 9.1"
    clause_title = Column(String, nullable=False)  # e.g., "Tensile and Elongation", "Galvanizing Coating Mass"
    clause_text = Column(Text, nullable=False)
    key_tolerances = Column(String, nullable=True)  # e.g., "Min 360 g/m2 zinc, 5 MPa pressure"
    created_at = Column(DateTime, default=datetime.utcnow)

    standard = relationship("Standard", back_populates="clauses")


class SearchFeedback(Base):
    """Procurement Officer / Bidder feedback on retrieval relevance for Active Learning & Fine-Tuning"""
    __tablename__ = "search_feedback"

    id = Column(String, primary_key=True, default=generate_uuid)
    query = Column(String, nullable=False, index=True)
    standard_id = Column(String, ForeignKey("standards.id"), nullable=False, index=True)
    standard_number = Column(String, nullable=False)
    is_relevant = Column(Boolean, default=True)  # True = helpful/selected, False = irrelevant
    rating = Column(Integer, default=5)  # 1 to 5
    user_comment = Column(Text, nullable=True)
    user_role = Column(String, default="PROCUREMENT_OFFICER")
    created_at = Column(DateTime, default=datetime.utcnow)
