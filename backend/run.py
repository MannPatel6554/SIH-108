"""
Convenience script to run the BIS SmartSpec AI backend.
Usage: python run.py
"""
import subprocess
import sys
import os


def main():
    """Initialize and run the application."""
    print("=" * 60)
    print("BIS SmartSpec AI — Backend Server")
    print("=" * 60)

    # 1. Seed demo data
    print("\n[1/3] Seeding demo data...")
    result = subprocess.run(
        [sys.executable, "scripts/seed_demo_data.py"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )
    if result.returncode != 0:
        print("Warning: Demo data seeding failed or already seeded.")

    # 2. Build embeddings
    print("\n[2/3] Building embeddings...")
    result = subprocess.run(
        [sys.executable, "scripts/build_embeddings.py"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )
    if result.returncode != 0:
        print("Warning: Embedding building failed. Semantic search may be limited.")

    # 3. Start server
    print("\n[3/3] Starting FastAPI server...")
    print("API docs: http://localhost:8000/docs")
    print("Health:   http://localhost:8000/health")
    print("=" * 60)

    os.execv(
        sys.executable,
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
            "--reload",
        ],
    )


if __name__ == "__main__":
    main()
