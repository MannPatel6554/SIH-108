"""
Evaluation Script for BIS SmartSpec AI Retrieval Engine

Metrics:
- Recall@K: Fraction of expected standards found in top-K results
- Precision@K: Fraction of top-K results that are expected
- MRR: Mean Reciprocal Rank (rank of first relevant result)

IMPORTANT: These metrics are computed against the DEMO dataset only.
They do NOT represent performance on real BIS data.
"""
import asyncio
import json
import sys
import os
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)
os.environ["VECTOR_DB_PATH"] = os.path.join(backend_dir, "chroma_db")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{os.path.join(backend_dir, 'data', 'bis_smartspec.db')}"

import httpx


def recall_at_k(retrieved: list, expected: list, k: int) -> float:
    """Fraction of expected items found in top-K."""
    if not expected:
        return 1.0
    top_k = retrieved[:k]
    hits = sum(1 for e in expected if any(e.lower() in r.lower() for r in top_k))
    return hits / len(expected)


def precision_at_k(retrieved: list, expected: list, k: int) -> float:
    """Fraction of top-K that are expected."""
    if not retrieved or k == 0:
        return 0.0
    top_k = retrieved[:k]
    hits = sum(1 for r in top_k if any(e.lower() in r.lower() for e in expected))
    return hits / min(k, len(top_k))


def mrr(retrieved: list, expected: list) -> float:
    """Mean Reciprocal Rank — rank of first hit."""
    for i, r in enumerate(retrieved, 1):
        if any(e.lower() in r.lower() for e in expected):
            return 1.0 / i
    return 0.0


async def run_evaluation():
    """Run evaluation on demo queries."""
    queries_file = os.path.join(os.path.dirname(__file__), "queries.json")
    
    with open(queries_file, encoding="utf-8") as f:
        queries = json.load(f)

    # Check if live server is reachable
    use_api = False
    import httpx
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get("http://127.0.0.1:8000/health")
            if resp.status_code == 200:
                use_api = True
    except Exception:
        use_api = False

    retriever = None
    if not use_api:
        from app.retrieval.hybrid_retriever import get_retriever
        retriever = get_retriever()
    
    print("\n" + "=" * 70)
    print("BIS SmartSpec AI — Retrieval Evaluation")
    print(f"Mode: {'Live API (http://127.0.0.1:8000)' if use_api else 'Direct Hybrid Retriever'}")
    print("Dataset: DEMO (not official BIS data)")
    print("=" * 70)
    
    K = 5
    all_recall = []
    all_precision = []
    all_mrr = []
    total_latency = 0.0

    async with httpx.AsyncClient(timeout=30.0) as client:
        for q in queries:
            start = time.time()
            if use_api:
                resp = await client.post(
                    "http://127.0.0.1:8000/api/search",
                    json={"query": q["query"], "top_k": K, "language": q.get("language", "en")},
                )
                data = resp.json()
                retrieved_numbers = [r["standard_number"] for r in data.get("results", [])]
                latency = data.get("search_time_ms", (time.time() - start) * 1000)
            else:
                candidates, latency = retriever.retrieve(q["query"], top_k=K)
                retrieved_numbers = [c.standard_number for c in candidates]
            elapsed = time.time() - start
            total_latency += elapsed
            expected = q["expected_standards"]

            r_at_k = recall_at_k(retrieved_numbers, expected, K)
            p_at_k = precision_at_k(retrieved_numbers, expected, K)
            mrr_val = mrr(retrieved_numbers, expected)

            all_recall.append(r_at_k)
            all_precision.append(p_at_k)
            all_mrr.append(mrr_val)

            print(f"\nQuery [{q['id']}]: {q['query'][:60]}")
            print(f"  Language: {q['language']}")
            print(f"  Expected: {expected}")
            print(f"  Retrieved: {retrieved_numbers}")
            print(f"  Recall@{K}: {r_at_k:.3f} | Precision@{K}: {p_at_k:.3f} | MRR: {mrr_val:.3f}")
            print(f"  Latency: {latency:.1f}ms")

    print("\n" + "=" * 70)
    print(f"AGGREGATE METRICS (K={K}, N={len(queries)} queries)")
    print(f"  Mean Recall@{K}:    {sum(all_recall)/len(all_recall):.3f}")
    print(f"  Mean Precision@{K}: {sum(all_precision)/len(all_precision):.3f}")
    print(f"  Mean MRR:          {sum(all_mrr)/len(all_mrr):.3f}")
    print(f"  Mean Latency:      {(total_latency/len(queries))*1000:.1f}ms")
    print("=" * 70)
    print("\nNOTE: Metrics computed on DEMO dataset only.")
    print("Vector store must be indexed for meaningful results.")
    print("Run seed_demo_data.py + build_embeddings.py first.")


if __name__ == "__main__":
    asyncio.run(run_evaluation())
