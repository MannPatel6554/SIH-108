"""
BIS Data Normalizer — BIS SmartSpec AI
Stage 2 in the Real BIS Data Ingestion Pipeline

Reads raw snapshots from data/raw/ or data/snapshots/latest_raw_snapshot.json,
normalizes IS numbers, titles, sectors, dates, and relationships,
computes deterministic SHA-256 content hashes, and outputs clean normalized records.
"""
import os
import sys
import json
import re
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw")
NORMALIZED_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "normalized")
SNAPSHOTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "snapshots")

for d in [NORMALIZED_DIR, SNAPSHOTS_DIR]:
    os.makedirs(d, exist_ok=True)


VALID_SECTORS = {
    "CONSTRUCTION", "ELECTRICAL", "ELECTRONICS", "MECHANICAL",
    "FOOD", "TEXTILE", "CHEMICAL", "AGRICULTURE", "WATER",
    "AUTOMOTIVE", "HEALTHCARE", "GENERAL", "SAFETY", "OTHER"
}

VALID_TYPES = {
    "PRODUCT", "TEST_METHOD", "SAFETY", "TERMINOLOGY",
    "INSTALLATION", "MANAGEMENT", "OTHER"
}


def normalize_is_number(num: str) -> str:
    """Standardizes IS standard numbers (e.g., 'is  1239 (part 1)' -> 'IS 1239 (Part 1)')."""
    cleaned = re.sub(r"\s+", " ", num.strip())
    cleaned = re.sub(r"^(?i:is)\s*", "IS ", cleaned)
    cleaned = re.sub(r"(?i:part)\s*", "Part ", cleaned)
    cleaned = re.sub(r"(?i:sec|section)\s*", "Sec ", cleaned)
    return cleaned


def normalize_is_key(num: str) -> str:
    """Creates a normalized lookup key without spaces or punctuation, e.g. IS1239-1"""
    s = num.upper()
    s = re.sub(r"[()/\s]+", "-", s).strip("-")
    return s


def compute_content_hash(record: Dict[str, Any]) -> str:
    """Computes a deterministic SHA256 content hash of the record data."""
    hash_payload = {
        "standard_number": record.get("standard_number"),
        "title": record.get("title"),
        "edition_year": record.get("edition_year"),
        "status": record.get("status"),
        "sector": record.get("sector"),
        "scope": record.get("scope"),
        "keywords": sorted(record.get("keywords", [])),
    }
    serialized = json.dumps(hash_payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def normalize_record(raw_record: Dict[str, Any]) -> Dict[str, Any]:
    """Normalizes a single standard record."""
    std_num = normalize_is_number(raw_record.get("standard_number", ""))
    std_key = raw_record.get("standard_number_normalized") or normalize_is_key(std_num)

    sector = (raw_record.get("sector") or "GENERAL").upper().strip()
    if sector not in VALID_SECTORS:
        sector = "GENERAL"

    std_type = (raw_record.get("standard_type") or "PRODUCT").upper().strip()
    if std_type not in VALID_TYPES:
        std_type = "OTHER"

    status = (raw_record.get("status") or "CURRENT").upper().strip()
    v_status = raw_record.get("verification_status") or "OFFICIAL_VERIFIED"
    if v_status not in ["OFFICIAL_VERIFIED", "PUBLIC_BIS_DATA", "DEMO", "USER_PROVIDED", "UNVERIFIED"]:
        v_status = "PUBLIC_BIS_DATA"

    title = raw_record.get("title", "").strip()
    title_hindi = raw_record.get("title_hindi")
    if title_hindi:
        title_hindi = title_hindi.strip()

    keywords = [k.strip().lower() for k in raw_record.get("keywords", []) if k.strip()]

    # Normalize certifications
    norm_certs = []
    for cert in raw_record.get("certifications", []):
        norm_certs.append({
            "product_category": cert.get("product_category"),
            "certification_type": cert.get("certification_type", "ISI_MARK"),
            "is_mandatory": cert.get("is_mandatory", "MANDATORY").upper(),
            "scheme": cert.get("scheme", "Scheme-I"),
            "effective_date": cert.get("effective_date"),
            "verification_status": cert.get("verification_status", v_status),
            "source": cert.get("source", "Official BIS Gazette"),
            "source_url": cert.get("source_url", raw_record.get("source_url", "https://www.bis.gov.in")),
            "notes": cert.get("notes")
        })

    # Normalize referred standards
    norm_referred = []
    for ref in raw_record.get("referred_standards", []):
        target_num = normalize_is_number(ref.get("target_standard_number", ""))
        if target_num:
            norm_referred.append({
                "target_standard_number": target_num,
                "relationship_type": ref.get("relationship_type", "OFFICIAL_REFERRED_STANDARD"),
                "description": ref.get("description"),
                "verification_status": v_status
            })

    # Normalize amendments
    norm_amendments = []
    for am in raw_record.get("amendments", []):
        norm_amendments.append({
            "amendment_number": am.get("amendment_number", ""),
            "amendment_date": am.get("amendment_date"),
            "title": am.get("title"),
            "source_url": am.get("source_url", raw_record.get("source_url")),
            "verification_status": v_status
        })

    norm_record = {
        "standard_number": std_num,
        "standard_number_normalized": std_key,
        "title": title,
        "title_hindi": title_hindi,
        "part": raw_record.get("part"),
        "edition_year": raw_record.get("edition_year"),
        "publication_date": raw_record.get("publication_date"),
        "revision_date": raw_record.get("revision_date"),
        "review_date": raw_record.get("review_date"),
        "status": status,
        "standard_type": std_type,
        "sector": sector,
        "description": raw_record.get("description"),
        "description_hindi": raw_record.get("description_hindi"),
        "scope": raw_record.get("scope"),
        "keywords": keywords,
        "source_name": raw_record.get("source_name", "Bureau of Indian Standards"),
        "source_url": raw_record.get("source_url", "https://www.bis.gov.in"),
        "source_type": raw_record.get("source_type", "OFFICIAL_BIS"),
        "retrieved_at": raw_record.get("retrieved_at"),
        "last_checked_at": raw_record.get("last_checked_at"),
        "verification_status": v_status,
        "license_status": raw_record.get("license_status", "PUBLIC_METADATA"),
        "content_access": raw_record.get("content_access", "PUBLIC_METADATA"),
        "product_manual_url": raw_record.get("product_manual_url"),
        "product_manual_title": raw_record.get("product_manual_title"),
        "certifications": norm_certs,
        "referred_standards": norm_referred,
        "amendments": norm_amendments,
    }

    norm_record["content_hash"] = compute_content_hash(norm_record)
    return norm_record


def normalize_bis_dataset(input_file: Optional[str] = None) -> str:
    """Normalizes raw BIS data and produces the normalized artifact."""
    if not input_file:
        input_file = os.path.join(SNAPSHOTS_DIR, "latest_raw_snapshot.json")
        if not os.path.exists(input_file):
            print("[BIS Normalizer] No latest_raw_snapshot found. Running fetch_bis_data first...")
            from scripts.fetch_bis_data import fetch_authoritative_bis_data
            input_file = fetch_authoritative_bis_data()

    print(f"[BIS Normalizer] Reading raw snapshot from {input_file}...")
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    raw_standards = data.get("standards", [])
    normalized_records = []
    seen_is = set()

    for r in raw_standards:
        norm = normalize_record(r)
        num = norm["standard_number"]
        if num in seen_is:
            print(f"  [Warning] Deduplicating repeated record for {num}")
            continue
        seen_is.add(num)
        normalized_records.append(norm)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    out_filename = f"bis_standards_normalized_{timestamp}.json"
    out_path = os.path.join(NORMALIZED_DIR, out_filename)

    payload = {
        "metadata": {
            "source_name": "Bureau of Indian Standards",
            "normalization_timestamp": datetime.utcnow().isoformat() + "Z",
            "total_records": len(normalized_records),
            "pipeline_stage": "NORMALIZED"
        },
        "standards": normalized_records
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    latest_normalized_path = os.path.join(SNAPSHOTS_DIR, "latest_normalized.json")
    with open(latest_normalized_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"[BIS Normalizer] Normalized {len(normalized_records)} records into {out_path}")
    print(f"[BIS Normalizer] Updated {latest_normalized_path}")
    return out_path


if __name__ == "__main__":
    file_arg = sys.argv[1] if len(sys.argv) > 1 else None
    normalize_bis_dataset(file_arg)
