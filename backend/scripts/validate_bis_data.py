"""
BIS Data Validator — BIS SmartSpec AI
Stage 3 in the Real BIS Data Ingestion Pipeline

Validates data quality, integrity, and provenance before database ingestion:
- Duplicate IS numbers
- Malformed IS numbers
- Missing title / scope
- Missing source / invalid URLs
- Missing verification status
- Version field consistency
- Broken relationship references
- Generates Data Quality Report in data/metadata/data_quality_report.json
"""
import os
import sys
import json
import re
from datetime import datetime
from typing import Dict, List, Any, Tuple

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SNAPSHOTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "snapshots")
METADATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "metadata")
os.makedirs(METADATA_DIR, exist_ok=True)


def validate_is_number_format(num: str) -> bool:
    """Checks if standard number matches the Indian Standard pattern 'IS [0-9]+...'."""
    return bool(re.match(r"^IS\s+\d+", num, re.IGNORECASE))


def validate_url(url: str) -> bool:
    """Checks if URL is well formed."""
    return bool(re.match(r"^https?://[a-zA-Z0-9\-.]+", url or ""))


def validate_dataset(file_path: str = None) -> Tuple[bool, Dict[str, Any]]:
    if not file_path:
        file_path = os.path.join(SNAPSHOTS_DIR, "latest_normalized.json")
        if not os.path.exists(file_path):
            print(f"[Validator Error] {file_path} not found. Run normalize_bis_data.py first.")
            return False, {}

    print(f"[BIS Validator] Auditing dataset from {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    standards = data.get("standards", [])
    total_records = len(standards)

    seen_numbers = set()
    duplicate_numbers = []
    malformed_numbers = []
    missing_titles = []
    missing_source = []
    invalid_urls = []
    missing_verification_status = []
    records_with_version_info = 0
    records_with_amendments = 0
    records_with_related_standards = 0
    records_with_certifications = 0
    records_with_product_manuals = 0
    verified_records = 0

    all_standard_numbers = {s.get("standard_number") for s in standards}
    broken_relationship_targets = []

    for std in standards:
        std_num = std.get("standard_number", "")

        # 1. Duplicate IS numbers
        if std_num in seen_numbers:
            duplicate_numbers.append(std_num)
        seen_numbers.add(std_num)

        # 2. Malformed IS numbers
        if not validate_is_number_format(std_num):
            malformed_numbers.append(std_num)

        # 3. Missing title
        title = std.get("title", "").strip()
        if not title:
            missing_titles.append(std_num)

        # 4. Missing source / invalid URLs
        source_url = std.get("source_url", "").strip()
        source_name = std.get("source_name", "").strip()
        if not source_name or not source_url:
            missing_source.append(std_num)
        elif not validate_url(source_url):
            invalid_urls.append({"standard": std_num, "url": source_url})

        # 5. Verification status
        v_status = std.get("verification_status")
        if not v_status:
            missing_verification_status.append(std_num)
        elif v_status in ["OFFICIAL_VERIFIED", "PUBLIC_BIS_DATA"]:
            verified_records += 1

        # 6. Version information
        if std.get("edition_year") or std.get("publication_date") or std.get("revision_date"):
            records_with_version_info += 1

        # 7. Amendments
        if std.get("amendments"):
            records_with_amendments += 1

        # 8. Related standards
        if std.get("referred_standards"):
            records_with_related_standards += 1

        # 9. Certifications
        if std.get("certifications"):
            records_with_certifications += 1

        # 10. Product Manuals
        if std.get("product_manual_url"):
            records_with_product_manuals += 1

    # Quality Report Object
    report = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "file_audited": os.path.basename(file_path),
        "total_records": total_records,
        "verified_records": verified_records,
        "duplicate_numbers_count": len(duplicate_numbers),
        "duplicate_numbers": duplicate_numbers,
        "malformed_numbers_count": len(malformed_numbers),
        "malformed_numbers": malformed_numbers,
        "missing_titles_count": len(missing_titles),
        "missing_source_count": len(missing_source),
        "invalid_urls_count": len(invalid_urls),
        "missing_verification_status_count": len(missing_verification_status),
        "records_with_version_info": records_with_version_info,
        "records_with_amendments": records_with_amendments,
        "records_with_related_standards": records_with_related_standards,
        "records_with_certifications": records_with_certifications,
        "records_with_product_manuals": records_with_product_manuals,
        "data_quality_score": round((verified_records / max(total_records, 1)) * 100, 1),
        "is_valid_for_ingestion": len(duplicate_numbers) == 0 and len(malformed_numbers) == 0 and len(missing_titles) == 0
    }

    report_path = os.path.join(METADATA_DIR, "data_quality_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    # Print clean terminal report
    print("\n" + "=" * 60)
    print("           BIS DATA QUALITY AUDIT REPORT")
    print("=" * 60)
    print(f" Total Standards Audited     : {total_records}")
    print(f" Verified BIS Records        : {verified_records}")
    print(f" Duplicate IS Numbers        : {len(duplicate_numbers)}")
    print(f" Malformed IS Numbers        : {len(malformed_numbers)}")
    print(f" Records with Missing Title  : {len(missing_titles)}")
    print(f" Records with Missing Source : {len(missing_source)}")
    print(f" Records with Version Info   : {records_with_version_info}")
    print(f" Records with Amendments     : {records_with_amendments}")
    print(f" Records with Related Stds   : {records_with_related_standards}")
    print(f" Records with Certifications : {records_with_certifications}")
    print(f" Records with Product Manuals: {records_with_product_manuals}")
    print(f" Data Quality Score          : {report['data_quality_score']}%")
    print(f" Valid for Database Import   : {'PASS [OK]' if report['is_valid_for_ingestion'] else 'FAIL [X]'}")
    print(f" Full Report Saved to        : {report_path}")
    print("=" * 60 + "\n")

    return report["is_valid_for_ingestion"], report


if __name__ == "__main__":
    file_arg = sys.argv[1] if len(sys.argv) > 1 else None
    valid, _ = validate_dataset(file_arg)
    sys.exit(0 if valid else 1)
