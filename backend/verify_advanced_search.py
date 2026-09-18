"""
Verification Suite for 5 Advanced Semantic Search Features:
1. Two-Stage Retrieval with Cross-Encoder Re-ranking
2. Graph-Augmented Retrieval (GraphRAG) with companion bundles
3. CPWD Delhi Schedule of Rates (DSR 2023) & GeM Thesaurus
4. Clause-Level Chunking & Deep Spec Search
5. Active Learning User Feedback Loop & Training Pair Export
"""
import urllib.request
import json
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode("utf-8"))


print("=" * 70)
print("BIS SmartSpec AI — ADVANCED SEMANTIC SEARCH VERIFICATION")
print("=" * 70)

# ----------------------------------------------------
# 1. Two-Stage Retrieval with Cross-Encoder
# ----------------------------------------------------
print("\n[Test 1] Two-Stage Retrieval with Cross-Encoder Re-Ranking")
res1 = post("http://127.0.0.1:8000/api/search", {
    "query": "mild steel pipes for potable water distribution",
    "top_k": 3
})
print(f"  Latency: {res1['search_time_ms']} ms (Real-Time)")
top_hit = res1["results"][0]
print(f"  Rank 1: {top_hit['standard_number']} — {top_hit['title'][:55]}")
bd = top_hit.get("score_breakdown", {})
print(f"  Stage 1 Semantic Score: {bd.get('semantic_score')}")
print(f"  Stage 1 Lexical BM25:   {bd.get('lexical_score')}")
print(f"  Stage 2 Cross-Encoder:  {bd.get('cross_encoder_score')}")
print(f"  Final Fused Score:      {bd.get('final_score')} (Confidence: {top_hit['confidence']})")
assert any(x in top_hit["standard_number"] for x in ["1239", "3589"]), "Expected IS 1239 or IS 3589 at Rank 1"
assert bd.get("cross_encoder_score") is not None, "Expected cross_encoder_score"
print("  --> [PASS] Stage 2 Cross-Encoder executed and scored successfully.")

# ----------------------------------------------------
# 2. Graph-Augmented Retrieval (GraphRAG)
# ----------------------------------------------------
print("\n[Test 2] Graph-Augmented Retrieval (GraphRAG Allied Bundle)")
is1239_hit = next((r for r in res1["results"] if "1239" in r["standard_number"]), top_hit)
allied_bundle = is1239_hit.get("allied_bundle", [])
print(f"  Target Standard: {is1239_hit['standard_number']}")
print(f"  Companion Standards Automatically Bundled: {len(allied_bundle)}")
for comp in allied_bundle[:4]:
    print(f"    * [{comp.get('relationship_type')}] {comp.get('standard_number')}: {comp.get('title')[:45]}")
assert len(allied_bundle) > 0, "Expected allied companion standards bundled via GraphRAG"
print("  --> [PASS] GraphRAG successfully traversed relationships and co-retrieved companion standards.")

# ----------------------------------------------------
# 3. CPWD DSR 2023 & GeM Thesaurus Resolution
# ----------------------------------------------------
print("\n[Test 3] CPWD DSR & GeM Thesaurus Mapping")
# Test CPWD item code 18.1.1 (15 mm G.I. pipes)
res3_cpwd = post("http://127.0.0.1:8000/api/search", {
    "query": "CPWD item 18.1.1 plumbing work",
    "top_k": 2
})
cpwd_top = res3_cpwd["results"][0]
print(f"  Query: 'CPWD item 18.1.1 plumbing work'")
print(f"  Thesaurus Source: {cpwd_top.get('thesaurus_source')}")
print(f"  Resolved Standard: {cpwd_top['standard_number']} — {cpwd_top['title'][:50]}")
assert "1239" in cpwd_top["standard_number"], "Expected IS 1239 for CPWD 18.1.1"

# Test CPWD item code 5.22.3 (Fe 500D TMT bars)
res3_tmt = post("http://127.0.0.1:8000/api/search", {
    "query": "DSR 5.22.3 reinforcement steel for RCC",
    "top_k": 2
})
tmt_top = res3_tmt["results"][0]
print(f"  Query: 'DSR 5.22.3 reinforcement steel for RCC'")
print(f"  Resolved Standard: {tmt_top['standard_number']} — {tmt_top['title'][:50]}")
assert "1786" in tmt_top["standard_number"], "Expected IS 1786 for DSR 5.22.3"
print("  --> [PASS] CPWD DSR codes resolved directly to authoritative Indian Standards.")

# ----------------------------------------------------
# 4. Clause-Level Chunking & Deep Spec Search
# ----------------------------------------------------
print("\n[Test 4] Clause-Level Chunking & Deep Spec Search")
res4 = post("http://127.0.0.1:8000/api/search", {
    "query": "IS 1239 hot dip zinc coating mass 360 g/m2 for galvanized tubes",
    "top_k": 2
})
clause_top = res4["results"][0]
print(f"  Query: 'IS 1239 hot dip zinc coating mass 360 g/m2 for galvanized tubes'")
print(f"  Matched Standard: {clause_top['standard_number']}")
matched_clauses = clause_top.get("matched_clauses", [])
print(f"  Matched Clauses Count: {len(matched_clauses)}")
for cl in matched_clauses:
    print(f"    * {cl.get('clause_number')}: {cl.get('clause_title')} (Tolerances: {cl.get('key_tolerances')})")
assert any("9.1" in cl.get("clause_number", "") or "Galvanizing" in cl.get("clause_title", "") for cl in matched_clauses), "Expected Clause 9.1 for galvanizing mass"

# Test standard clauses endpoint
clauses_endpoint = get(f"http://127.0.0.1:8000/api/standards/{clause_top['standard_id']}/clauses")
print(f"  Full Clauses Loaded via API: {len(clauses_endpoint)} clauses")
assert len(clauses_endpoint) >= 3, "Expected at least 3 clauses from API"
print("  --> [PASS] Clause-level chunking and deep specification search verified.")

# ----------------------------------------------------
# 5. Active Learning Feedback & Training Export
# ----------------------------------------------------
print("\n[Test 5] Active Learning Feedback & Fine-Tuning Export")
fb_payload = {
    "query": "potable water supply pipes",
    "standard_id": top_hit["standard_id"],
    "standard_number": top_hit["standard_number"],
    "is_relevant": True,
    "rating": 5,
    "user_comment": "Exact match for municipal water pipeline tender",
    "user_role": "PROCUREMENT_OFFICER"
}
fb_res = post("http://127.0.0.1:8000/api/search/feedback", fb_payload)
print(f"  Feedback Submission: {fb_res.get('status')} — {fb_res.get('message')}")
assert fb_res.get("status") == "SUCCESS", "Expected SUCCESS on feedback submission"

# Test export of training pairs
training_pairs = get("http://127.0.0.1:8000/api/search/feedback/export-training-pairs")
print(f"  Exported Training Pairs for Fine-Tuning: {len(training_pairs)} pairs")
if training_pairs:
    print(f"    Sample: Anchor='{training_pairs[0]['anchor_query']}' -> Positive='{training_pairs[0]['positive_standard']}'")
assert len(training_pairs) >= 1, "Expected exported training pairs"
print("  --> [PASS] Active learning feedback recorded and exported for domain retraining.")

print("\n" + "=" * 70)
print("ALL 5 ADVANCED SEARCH FEATURES VERIFIED WITH 100% SUCCESS!")
print("=" * 70)
