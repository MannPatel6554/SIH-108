"""
Backend integration tests for BIS SmartSpec AI
Tests all core endpoints against the running server.
"""
import pytest
import httpx


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=30.0) as ac:
        yield ac


@pytest.mark.anyio
async def test_health(client):
    """Test health endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "services" in data
    assert data["services"]["vector_store"]["available"] is True


@pytest.mark.anyio
async def test_search_empty_query(client):
    """Test search with empty query returns 400/422."""
    response = await client.post("/api/search", json={"query": "", "top_k": 5})
    assert response.status_code in (400, 422)


@pytest.mark.anyio
async def test_search_valid_query(client):
    """Test search with valid query."""
    response = await client.post(
        "/api/search",
        json={"query": "steel pipes for water supply", "top_k": 5}
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "query" in data
    assert "search_time_ms" in data
    assert "disclaimer" in data
    assert len(data["results"]) > 0


@pytest.mark.anyio
async def test_search_hindi_query(client):
    """Test search with Hindi query."""
    response = await client.post(
        "/api/search",
        json={"query": "पानी की सप्लाई के लिए स्टील पाइप", "language": "hi", "top_k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) > 0


@pytest.mark.anyio
async def test_list_standards(client):
    """Test standards listing."""
    response = await client.get("/api/standards?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


@pytest.mark.anyio
async def test_stats(client):
    """Test stats endpoint."""
    response = await client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_standards" in data
    assert data["total_standards"] > 0
    assert "mode" in data


@pytest.mark.anyio
async def test_version_check_found_and_outdated(client):
    """Test version check for existing standard with outdated reference."""
    response = await client.post(
        "/api/version-check",
        json={"standard_number": "IS 1239", "referenced_year": 2000}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["found"] is True
    assert data["is_potentially_outdated"] is True
    assert data["current_record"] is not None


@pytest.mark.anyio
async def test_version_check_not_found(client):
    """Test version check for non-existent standard."""
    response = await client.post(
        "/api/version-check",
        json={"standard_number": "IS 99999", "referenced_year": 2000}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["found"] is False


@pytest.mark.anyio
async def test_compliance_checklist(client):
    """Test compliance checklist creation."""
    response = await client.post(
        "/api/compliance-check",
        json={
            "name": "Test Checklist",
            "query": "steel pipes",
            "items": [
                {
                    "standard_number": "IS 1239",
                    "standard_title": "Steel Tubes",
                    "item_type": "PRODUCT_STANDARD",
                }
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert len(data["items"]) == 1
    assert data["items"][0]["status"] == "PENDING"


@pytest.mark.anyio
async def test_data_sources(client):
    """Test data sources endpoint."""
    response = await client.get("/api/data-sources")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.anyio
async def test_search_with_filters(client):
    """Test search with sector filter."""
    response = await client.post(
        "/api/search",
        json={
            "query": "pipes",
            "top_k": 5,
            "filters": {"sector": "WATER"}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data


@pytest.mark.anyio
async def test_export_pdf(client):
    """Test PDF export."""
    response = await client.post(
        "/api/export/pdf",
        json={
            "query": "test query",
            "results": [],
            "checklist_items": [],
        }
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


@pytest.mark.anyio
async def test_export_excel(client):
    """Test Excel export."""
    response = await client.post(
        "/api/export/excel",
        json={
            "query": "test query",
            "results": [],
            "checklist_items": [],
        }
    )
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers["content-type"]


@pytest.mark.anyio
async def test_analyze_document(client):
    """Test document analysis endpoint."""
    txt_content = (
        "Technical Specifications for Tender:\n"
        "Supply and installation of Mild Steel Pipes for water supply.\n"
        "Pipes shall conform to IS 1239 (Part 1) : 1990 and IS 3589 : 2001.\n"
    ).encode("utf-8")
    files = {"file": ("tender.txt", txt_content, "text/plain")}
    response = await client.post("/api/analyze-document", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "detected_standards" in data
    assert "IS 1239" in data["detected_standards"]
    assert "recommendations" in data


@pytest.mark.anyio
async def test_real_bis_standards_count(client):
    """Test real BIS standards count and breakdown."""
    response = await client.get("/api/standards/count")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "verified" in data
    assert data["verified"] >= 20, f"Expected >= 20 verified records, got {data['verified']}"
    assert data["total"] >= 40


@pytest.mark.anyio
async def test_real_bis_standards_provenance(client):
    """Test data provenance and audit trail endpoint."""
    response = await client.get("/api/standards/sources/provenance")
    assert response.status_code == 200
    data = response.json()
    assert data["authoritative_source"] == "Bureau of Indian Standards"
    assert len(data["data_sources"]) > 0
    assert len(data["recent_audits"]) > 0


@pytest.mark.anyio
async def test_real_standard_details_with_provenance(client):
    """Test official standard retrieval with provenance metadata."""
    response = await client.get("/api/standards?q=IS 1239 (Part 1)")
    assert response.status_code == 200
    items = response.json()
    assert len(items) > 0
    target = items[0]
    assert target["verification_status"] == "OFFICIAL_VERIFIED"
    assert target["source_name"] == "Bureau of Indian Standards"
    assert "bis.gov.in" in target["source_url"]

