'use client';
import { Info, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          <Info size={24} style={{ display: 'inline', marginRight: 8 }} />
          About BIS SmartSpec AI
        </h1>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--color-primary)' }}>
          SIH 2026 — Problem Statement PS108
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, fontSize: 14 }}>
          {[
            { label: 'Problem Statement', value: 'SIH26108 / PS108' },
            { label: 'Title', value: 'AI-Powered Recommendation Engine for Identifying Applicable Indian Standards for Procurement Specifications' },
            { label: 'Department', value: 'Bureau of Indian Standards (BIS)' },
            { label: 'Ministry', value: 'Ministry of Consumer Affairs, Food & Public Distribution' },
            { label: 'Theme', value: 'Smart Automation' },
            { label: 'Category', value: 'Software' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{label}</div>
              <div style={{ fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: 'var(--color-primary)' }}>Architecture</h2>
        <div style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.8 }}>
          <p style={{ marginBottom: 10 }}>
            <strong>Frontend:</strong> Next.js 15 (App Router) + TypeScript — bilingual UI (English/Hindi), responsive design
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>Backend:</strong> FastAPI + Python — async, fast, OpenAPI documented
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>Retrieval:</strong> Hybrid search combining semantic vector similarity (ChromaDB), lexical BM25, and metadata scoring
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>Embeddings:</strong> sentence-transformers (all-MiniLM-L6-v2) with deterministic hash-based fallback for demo mode
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>LLM Explanations:</strong> MockProvider (template-based, hallucination-safe) or OllamaProvider (local LLM)
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>Database:</strong> SQLAlchemy ORM with SQLite (demo) — ready for PostgreSQL for production
          </p>
          <p>
            <strong>Document Analysis:</strong> pypdf + python-docx parsing with IS reference regex extraction
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: 'var(--color-primary)' }}>
          Key Features
        </h2>
        <ul style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 2, paddingLeft: 20 }}>
          <li>Semantic search across Indian Standards catalog</li>
          <li>Hybrid retrieval (vector + lexical + metadata)</li>
          <li>Bilingual support: English and Hindi queries</li>
          <li>Document analyzer: upload tender PDFs/DOCXs to detect IS references</li>
          <li>Gap analysis: identify missing standards in tender specifications</li>
          <li>Compliance checklist builder with PDF/Excel export</li>
          <li>Version currency checker for IS references</li>
          <li>Allied standards graph (normative references, test methods, safety)</li>
          <li>Hallucination prevention: LLM cannot invent IS numbers</li>
          <li>MSME Mode: simplified language for small businesses</li>
          <li>DEMO data labeling: all demo records clearly marked</li>
          <li>Runs fully offline with Ollama (no paid API dependencies)</li>
        </ul>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: 'var(--color-primary)' }}>
          Important Disclaimer
        </h2>
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 'var(--radius-md)', padding: '16px 20px',
          fontSize: 14, color: '#92400e', lineHeight: 1.7,
        }}>
          <p style={{ marginBottom: 10 }}>
            This prototype is an <strong>independent academic project</strong> developed for Smart India Hackathon 2026.
            It is <strong>NOT officially endorsed by or affiliated with</strong> the Bureau of Indian Standards (BIS),
            Ministry of Consumer Affairs, or any Government of India authority.
          </p>
          <p style={{ marginBottom: 10 }}>
            All data records labeled <strong>DEMO</strong> are illustrative only. They use IS number identifiers
            but the metadata (titles, descriptions, editions, certification requirements) is NOT verified official BIS data.
          </p>
          <p>
            <strong>Procurement officials must verify</strong> applicable standards, current editions, amendments,
            and certification requirements against authoritative BIS/government sources before finalizing any procurement specifications.
          </p>
        </div>
        <div style={{ marginTop: 16, fontSize: 13 }}>
          <a
            href="https://www.bis.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            <ExternalLink size={13} />
            Official BIS Website
          </a>
        </div>
      </div>
    </div>
  );
}
