# BIS SmartSpec AI

**AI-Powered Recommendation Engine for Identifying Applicable Indian Standards for Procurement Specifications**

> **Smart India Hackathon 2026 — Problem Statement SIH26108 / PS 108**  
> **Organization:** Bureau of Indian Standards (BIS)  
> **Ministry:** Ministry of Consumer Affairs, Food & Public Distribution  
> **Theme:** Smart Automation | **Category:** Software  

---

## Overview

Government procurement officers handle thousands of tenders annually across departments. Identifying the exact Indian Standards (IS) applicable to a given product or technical specification currently requires manually searching through 20,000+ BIS standards, often leading to missing normative references, citing outdated editions, or overlooking mandatory certification requirements.

**BIS SmartSpec AI** bridges this gap by automatically converting natural-language procurement requirements into ranked, applicable Indian Standards with transparent evidence, allied standards relationship graphs, version validity checks, and compliance checklists.

---

## Key Features

1. **Semantic & Hybrid Search**:
   - Vector similarity search via ChromaDB embeddings (`sentence-transformers/all-MiniLM-L6-v2`)
   - BM25 lexical search for exact keyword & number matching
   - Metadata filtering by sector, standard type, and verification status
   - Weighted score breakdown (Semantic + Lexical + Metadata)

2. **Allied Standards Graph**:
   - Identifies normative references, test methods, installation practices, materials, and safety codes
   - Provides procurement officers with a complete compliance ecosystem, not just isolated numbers

3. **Version & Outdated Reference Checker**:
   - Detects cited edition years in specifications or tenders
   - Flags potentially superseded or outdated standards against current database records
   - Clear guidance to verify against authoritative BIS sources

4. **Tender Document Analyzer**:
   - Supports upload of **PDF**, **DOCX**, and **TXT** tenders (up to 20MB)
   - Automatically extracts text and detects cited Indian Standards via regex patterns
   - Recommends missing standards (gap analysis) and flags potential version discrepancies

5. **Compliance Checklist & Export**:
   - Create and track compliance checklists directly from search results
   - Export structured reports to **PDF** (via ReportLab) and **Excel** (via openpyxl)

6. **Bilingual Support (English + Hindi)**:
   - Multilingual query processing with Hindi procurement synonym expansion
   - Fully localized bilingual UI (English / Hindi toggle)

7. **MSME Mode**:
   - Plain-language mode simplifying dense bureaucratic and technical terminology for small businesses

8. **Deterministic / Offline LLM Fallback**:
   - Template-based honest explanations from database evidence
   - Operates 100% offline without requiring paid external LLM APIs

---

## System Architecture

```
[ Next.js 15 Frontend (App Router, TailwindCSS, TypeScript) ]
                          │
                   REST APIs (HTTP)
                          │
          [ FastAPI Backend (Python 3.14/3.11+) ]
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
[ ChromaDB Vector DB ] [ SQLite Database ] [ Document Processor ]
(Embeddings Index)     (SQLAlchemy Async)  (PDF / DOCX / TXT)
```

---

## Quick Start Guide

### Prerequisites
- Python 3.10+ (Python 3.11/3.12/3.14 supported)
- Node.js 18+ and npm

### 1. Backend Setup & Run

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run the Real BIS Data Ingestion Pipeline (Step-by-step)
python scripts/fetch_bis_data.py       # 1. Fetch official BIS records into data/raw/
python scripts/normalize_bis_data.py   # 2. Normalize and compute SHA-256 hashes into data/normalized/
python scripts/validate_bis_data.py    # 3. Audit data quality and save report
python scripts/ingest_bis_data.py      # 4. Upsert into SQLite & refresh ChromaDB vector embeddings

# Start backend server (runs on http://127.0.0.1:8000)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup & Run

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start development server (runs on http://localhost:3000)
npm run dev
```

### 3. Production Build Check

```bash
cd frontend
npm run build
```

---

## Real BIS Data Architecture & Ingestion Pipeline

### 1. Ingestion Pipeline Workflow
```
Bureau of Indian Standards Official Portal & Gazette QCOs
                          ↓
[ scripts/fetch_bis_data.py ]      → Stores immutable snapshots in data/raw/
                          ↓
[ scripts/normalize_bis_data.py ]  → Normalizes IS numbers, sectors, SHA-256 hash
                          ↓
[ scripts/validate_bis_data.py ]   → Checks duplicates, formats, produces data_quality_report.json
                          ↓
[ scripts/ingest_bis_data.py ]     → Upserts DB, links referred standards, logs IngestionAudit
                          ↓
[ scripts/refresh_vector_index.py] → Incremental indexing in ChromaDB vector store
                          ↓
Hybrid Retrieval Engine & RAG      → Semantic + Lexical + Metadata Search in UI
```

### 2. Official Data Sources & Provenance Model
- **Primary Source**: Official Bureau of Indian Standards standards portal (`https://standards.bis.gov.in`), `https://services.bis.gov.in`, and official Gazette of India Quality Control Orders (QCOs).
- **Mandatory Provenance Fields on Every Record**:
  - `source_name`: "Bureau of Indian Standards"
  - `source_url`: Direct URL to standard details on BIS portal or gazette notification
  - `source_type`: `OFFICIAL_BIS`
  - `retrieved_at`: ISO UTC timestamp of retrieval
  - `last_checked_at`: Timestamp of last verification check
  - `verification_status`: `OFFICIAL_VERIFIED` or `PUBLIC_BIS_DATA`
  - `content_access`: `PUBLIC_METADATA`
  - `content_hash`: Deterministic SHA-256 content hash for auditability and change tracking
  - `license_status`: `PUBLIC_METADATA`

### 3. Data Status Model
The application strictly distinguishes between data tiers:
- **`OFFICIAL_VERIFIED`**: Directly imported from authoritative BIS gazette QCOs or official BIS portal records with verified certification schemes and publication dates (e.g. `IS 1239 (Part 1)`, `IS 694`, `IS 10322 (Part 5/Sec 3)`, `IS 269`, `IS 2925`, `IS 12701`).
- **`PUBLIC_BIS_DATA`**: Stubs and referred standards captured from official references.
- **`DEMO`**: Synthetic or exploratory test records clearly badged in the UI.
- **`USER_PROVIDED`**: User-uploaded tender extracts or specification inputs.
- **`UNVERIFIED`**: Records pending authoritative source cross-referencing.

### 4. Differential Version Tracking & Change Detection
Each ingestion run compares incoming records against the database:
- `NEW_STANDARD`: New verified Indian Standard added
- `UPDATED_STANDARD`: Standard metadata, scope, or keywords updated (detected via SHA-256 hash)
- `REVISED_STANDARD`: Edition year changed
- `STATUS_CHANGED`: Status changed (e.g. CURRENT to WITHDRAWN or SUPERSEDED)
- `UNCHANGED`: Record matches existing data exactly
Every change is recorded in the `ingestion_audits` table with run ID and snapshot source.

### 5. Legal Access & Copyright Compliance
- **No Access Control Bypass**: The system does **NOT** bypass CAPTCHA, authentication, paywalls, anti-bot mechanisms, or technical restrictions.
- **Metadata and Scope Only**: BIS standard full texts and PDFs are copyrighted works of the Bureau of Indian Standards. The system stores and indexes publicly accessible metadata, scope definitions, amendment notices, product manual references, and compulsory certification schemes. Procurement officials are provided direct official portal links to view or purchase complete licensed documents.

---

## Running Tests & Evaluation

### Backend Integration Tests (17 Tests)
```bash
cd backend
venv\Scripts\pytest.exe tests/test_api.py -v
```

### Retrieval Evaluation Script
Computes Recall@K, Precision@K, and Mean Reciprocal Rank (MRR) across English and Hindi benchmark queries on the live system:
```bash
# Run from repository root with backend server running
backend\venv\Scripts\python.exe evaluation/evaluate.py
```

---

## Data Integrity & Disclaimer

> **DISCLAIMER**: BIS SmartSpec AI is an advanced decision-support tool developed for Smart India Hackathon 2026. While official records are ingested with complete provenance from published BIS sources, procurement officers must verify applicable standards, current editions, and statutory Quality Control Orders directly against the authoritative Bureau of Indian Standards portal at [https://www.bis.gov.in](https://www.bis.gov.in) before finalizing tender specifications.
