# BIS SmartSpec AI — Demo Script

## 3-Minute Live Demonstration Flow

---

## 0:00–0:20 — Open Dashboard & Explain Problem

**What to say:**
> "Government procurement officers handle thousands of tenders. Currently, there's no automated way to match procurement specifications to applicable Indian Standards. Officers must manually search through 20,000+ BIS standards, often missing relevant standards or citing outdated editions."

**What to show:**
- Open the dashboard at `http://localhost:3000`
- Point to the headline: "From Procurement Specification to Applicable Indian Standards — Intelligently"
- Show the demo data status indicator (DEMO badge visible)

---

## 0:20–0:50 — Enter a Procurement Query

**Click the demo query:** "Steel pipes for water supply"

**OR** type it in the search box and press Enter.

**What to show:**
- Results appear within 1-2 seconds
- Show the semantic relevance scores (e.g., 0.91, 0.83)
- Point out: these are **not** probabilities — they are semantic retrieval scores
- Show the confidence indicator (High/Medium/Low)
- Show the ⚠ DEMO badge on each result (honest labeling)

**What to say:**
> "Within seconds, the system identifies IS 1239, IS 3589, and IS 6392 as the most semantically relevant standards. It explains WHY each standard applies, based on retrieved database evidence — not hallucinated text."

---

## 0:50–1:20 — Open a Standard's Detail Page

**Click "View Details" on IS 1239**

**What to show:**
- Standard number, title, sector, type, status
- Relevance explanation (labeled: "AI-generated explanation")
- Evidence snippets (labeled: "Source evidence")
- Allied/Related standards graph — IS 1387 (Test Method), IS 6392 (Installation), IS 9542 (Terminology)
- Version information
- Certification information (ISI Mark, marked UNKNOWN until verified)

**What to say:**
> "The Allied Standards graph shows normative references, test methods, and installation standards — so the procurement officer gets a complete picture, not just a single standard."

---

## 1:20–1:50 — Upload a Tender Document

**Navigate to Tender Analyzer**

**Upload the sample PDF from:** `docs/sample_tender.pdf` (or any PDF with "IS 3589" mentioned)

**What to show:**
- Document being processed
- Detected IS references extracted by regex + NLP
- Recommendations based on document content
- Potential gaps: standards recommended but not in document
- Potential outdated references if year is older

**What to say:**
> "The tender analyzer parses the document, extracts existing IS citations, then identifies additional relevant standards the procurement team may have missed — reducing specification gaps."

---

## 1:50–2:15 — Compliance Checklist

**Click "Add to Checklist" for IS 1239 and IS 3589**

**Navigate to Compliance Checker**

**What to show:**
- Checklist with items:
  - ☐ Applicable product standard (IS 1239)
  - ☐ Test method (IS 1387)
  - ☐ Installation standard (IS 6392)
  - ☐ Certification requirement
  - ☐ Latest edition verified
- Change one item to "Verified"
- Change one to "Not Applicable"

**What to say:**
> "Officers can build a compliance checklist during specification preparation, track verification status, and export a full report."

---

## 2:15–2:35 — Hindi Query

**Go back to Search**

**Click the Hindi demo button:** "पानी की सप्लाई के लिए स्टील पाइप"

**What to show:**
- Same standards retrieved as English query
- Language detection indicator showing "Hindi detected"
- Explanations in English (bilingual support)

**What to say:**
> "BIS SmartSpec AI supports bilingual queries. A Hindi-speaking procurement officer gets the same quality recommendations."

---

## 2:35–3:00 — Export & Scalability

**Click Export → PDF Report**

**What to show:**
- PDF downloading with: query, results, scores, explanations, compliance checklist, disclaimer

**What to say:**
> "The exported report documents the complete recommendation chain for audit trails and tender preparation."

**Final pitch:**
> "This architecture is built to scale to the full 20,000+ BIS standards catalog once officially obtained. The ingestion pipeline handles JSON, CSV, and PDF. The semantic search will improve with a larger, verified dataset. BIS SmartSpec AI can integrate with GeM and CPPP procurement portals through their APIs."

---

## Key Talking Points for Judges

1. **No hallucinations**: LLM cannot invent IS numbers — output is validated against retrieved candidates
2. **Honest data labeling**: DEMO badges clearly distinguish prototype data from verified data
3. **No paid dependencies**: Runs entirely locally with Ollama + open-source models
4. **Bilingual**: Hindi and English natively supported
5. **Scalable architecture**: Ready for 20,000+ standards with ingestion pipeline built
6. **Export for audit trail**: PDF and Excel reports for procurement documentation
7. **MSME-friendly**: Simple mode with plain-language explanations
