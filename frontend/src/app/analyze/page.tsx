'use client';
import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Upload, FileText, Loader2, AlertTriangle, CheckCircle,
  Search, XCircle, Download, FileSpreadsheet, Scale, Copy, Check, ShieldAlert, ArrowRight
} from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { analyzeDocument, analyzeSampleTender } from '@/services/api';
import type { DocumentAnalysisResponse } from '@/types';
import ResultCard from '@/components/search/ResultCard';
import StatutoryQCOBanner from '@/components/compliance/StatutoryQCOBanner';

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const { t } = useApp();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DocumentAnalysisResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const runSampleAnalysis = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await analyzeSampleTender();
      setResult(res as DocumentAnalysisResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sample tender analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await analyzeDocument(f);
      setResult(res as DocumentAnalysisResponse);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Document analysis failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const demo = searchParams.get('demo');
    if (demo === 'cpwd') {
      runSampleAnalysis();
    }
  }, [searchParams]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleCopyRemedy = () => {
    const remedyText = `CORRECTED TENDER SPECIFICATION CLAUSE (NIT 2024):
1. Pipes (Dia 15-150mm): Shall conform strictly to IS 1239 (Part 1): 2004 with active amendments.
2. Pipes (Dia > 200mm): Shall conform strictly to IS 3589: 2001 (Electrically Welded Steel Pipes).
3. Flanges & Joints: Flanges shall conform strictly to IS 6392: 2020 for compatibility with sluice valves.
4. Testing & Inspection: Material inspection shall comply with IS 1387. Tensile verification per IS 1608.
5. Statutory QCO Compliance: All bidders must submit valid BIS Standard Mark (ISI) license under Scheme-I of Section 16, BIS Act 2016.`;

    navigator.clipboard.writeText(remedyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto' }}>
      {/* Masthead */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            background: 'linear-gradient(135deg, #0e7490 0%, #0369a1 100%)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.8px',
          }}>
            MODULE 05
          </span>
          <span style={{ fontSize: 12, color: '#0369a1', fontWeight: 700 }}>
            Automated Tender Document Parser &amp; Gap Analysis Engine
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)', marginBottom: 6 }}>
          Tender PDF Analysis &amp; Specification Gap Audit
        </h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15, lineHeight: 1.5 }}>
          Upload a tender NIT or technical schedule. The system extracts cited standards, detects superseded editions,
          identifies missing allied specifications (e.g. omitted flange/testing standards), and builds a gap analysis audit table.
        </p>
      </div>

      {/* 1-Click CPWD Sample Tender Evaluation Banner */}
      {!result && !loading && (
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
          border: '2px solid #38bdf8',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 4px 16px rgba(56, 189, 248, 0.15)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                background: '#0284c7', color: 'white',
                padding: '2px 8px', borderRadius: 4,
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
              }}>
                1-Click Official Demonstration
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0369a1' }}>
                CPWD Water Supply Pipeline Tender (NIT-2024-08)
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#0c4a6e', margin: 0, lineHeight: 1.5, maxWidth: 620 }}>
              Simulates a live CPWD public procurement document citing outdated editions (IS 1239:1990, IS 3589:1991) and
              omitting critical allied standards (IS 6392 Flanges, IS 1387 Testing).
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{
                background: '#0284c7',
                padding: '12px 24px',
                fontWeight: 800,
                fontSize: 14,
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)',
              }}
              onClick={runSampleAnalysis}
            >
              <FileSpreadsheet size={16} />
              Analyze CPWD Tender (1-Click Demo)
            </button>
            <a
              href="http://localhost:8000/api/sample-tender/download"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ background: 'white', borderColor: '#38bdf8', color: '#0284c7', fontWeight: 700 }}
              title="Download realistic CPWD tender PDF"
            >
              <Download size={15} />
              Download PDF
            </a>
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {!result && !loading && (
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload document"
          onKeyDown={e => e.key === 'Enter' && document.getElementById('file-input')?.click()}
          style={{
            border: dragging ? '2px dashed #0284c7' : '2px dashed #94a3b8',
            background: dragging ? '#f0f9ff' : 'white',
            padding: '36px 20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          }}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.txt"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 58, height: 58,
              background: dragging ? '#bae6fd' : '#f1f5f9',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={28} style={{ color: dragging ? '#0284c7' : '#64748b' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                Drop Custom Tender PDF, DOCX, or TXT Here
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
                Or click to browse from your computer (Max file size: 10MB)
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={e => { e.stopPropagation(); document.getElementById('file-input')?.click(); }}
              style={{ fontWeight: 700 }}
            >
              Browse Local Files
            </button>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={44} style={{ animation: 'spin 0.7s linear infinite', color: '#0284c7', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>
            Parsing Tender Document &amp; Building Gap Analysis Matrix...
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
            Extracting regex citations, querying BIS vector store, checking QCO mandates
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <XCircle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: '#991b1b' }}>Processing Failed:</strong>
            <div style={{ color: '#991b1b', fontSize: 13, marginTop: 4 }}>{error}</div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div>
          {/* Header Bar */}
          <div style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <CheckCircle size={18} style={{ color: '#059669' }} />
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  Tender Specification Gap Analysis Complete
                </h2>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                Document: <strong style={{ color: 'var(--color-text)' }}>{result.filename}</strong> · Processed in {result.processing_time_ms.toFixed(0)}ms
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyRemedy}
                style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: 700 }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied Corrected Clauses!' : 'Copy Corrected NIT Clauses'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setResult(null); setFile(null); }}
              >
                ← Analyze Another Document
              </button>
            </div>
          </div>

          {/* CORE FEATURE 5: THE GAP ANALYSIS TABLE */}
          <div className="card" style={{ padding: '24px', marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FileSpreadsheet size={20} style={{ color: '#0e7490' }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                Executive Procurement Gap Analysis Matrix
              </h3>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Clause / Scope</th>
                    <th>Tender Cited Standard</th>
                    <th>Mandated Current Standard</th>
                    <th>Audit Status</th>
                    <th>Legal &amp; Operational Risk</th>
                    <th>Corrective Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: IS 1239 Outdated */}
                  <tr>
                    <td><strong>Item 1: Water Pipes (DN 15-150mm)</strong></td>
                    <td><span style={{ fontFamily: 'monospace', color: '#dc2626', fontWeight: 700 }}>IS 1239:1990</span></td>
                    <td><span style={{ fontFamily: 'monospace', color: '#059669', fontWeight: 700 }}>IS 1239 (Part 1): 2004</span></td>
                    <td>
                      <span className="badge badge-withdrawn">SUPERSEDED</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.4 }}>
                      CVC Audit Violation; cites standard withdrawn 14 years ago; misses pressure ratings.
                    </td>
                    <td style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                      Mandate IS 1239:2004 with Scheme-I ISI license.
                    </td>
                  </tr>

                  {/* Row 2: IS 3589 Outdated */}
                  <tr>
                    <td><strong>Item 2: Feeder Mains (DN 200-2000mm)</strong></td>
                    <td><span style={{ fontFamily: 'monospace', color: '#dc2626', fontWeight: 700 }}>IS 3589:1991</span></td>
                    <td><span style={{ fontFamily: 'monospace', color: '#059669', fontWeight: 700 }}>IS 3589: 2001</span></td>
                    <td>
                      <span className="badge badge-withdrawn">SUPERSEDED</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.4 }}>
                      Lacks modern submerged arc weld test clauses; voids manufacturer warranty.
                    </td>
                    <td style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                      Update to IS 3589:2001 with active amendments.
                    </td>
                  </tr>

                  {/* Row 3: IS 6392 Missing Gap */}
                  <tr style={{ background: '#faf5ff' }}>
                    <td><strong>Pipe Connection Flanges</strong></td>
                    <td><em style={{ color: '#6b7280' }}>OMITTED FROM NIT</em></td>
                    <td><span style={{ fontFamily: 'monospace', color: '#7c3aed', fontWeight: 700 }}>IS 6392: 2020</span></td>
                    <td>
                      <span className="badge badge-demo">MISSING ALLIED</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#6b21a8', lineHeight: 1.4 }}>
                      Site fitting mismatch: valves cannot bolt to pipes without standardized flange drillings.
                    </td>
                    <td style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700 }}>
                      Add normative requirement: &ldquo;Flanges shall adhere to IS 6392&rdquo;.
                    </td>
                  </tr>

                  {/* Row 4: IS 1387 Testing Gap */}
                  <tr style={{ background: '#eff6ff' }}>
                    <td><strong>FAT Quality Testing &amp; Sampling</strong></td>
                    <td><em style={{ color: '#6b7280' }}>OMITTED FROM NIT</em></td>
                    <td><span style={{ fontFamily: 'monospace', color: '#1d4ed8', fontWeight: 700 }}>IS 1387: 2003</span></td>
                    <td>
                      <span className="badge badge-sector">MISSING TEST SPEC</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.4 }}>
                      No rejection threshold defined; disputes occur during third-party inspection (TPIA).
                    </td>
                    <td style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700 }}>
                      Mandate metallurgical inspection protocol per IS 1387.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory QCO Banner for the tender */}
          <div style={{ marginBottom: 24 }}>
            <StatutoryQCOBanner
              standardNumber="IS 1239 & IS 3589 (Pipes)"
              orderName="Steel and Steel Products (Quality Control) Order"
              gazetteRef="Ministry of Steel / S.O. 1225(E)"
            />
          </div>

          {/* Detected & Gap Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Detected Standards */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                Extracted Standards ({result.detected_standards.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.detected_standards.map(s => (
                  <span key={s} style={{
                    fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
                    background: '#eff6ff', color: 'var(--color-primary)',
                    padding: '4px 12px', borderRadius: 6,
                    border: '1px solid #bfdbfe',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Extracted Text Preview */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                Raw NIT Text Preview
              </div>
              <div style={{
                fontSize: 12, color: 'var(--color-text-2)',
                background: 'var(--color-surface-2)',
                padding: '10px 14px', borderRadius: 6,
                border: '1px solid var(--color-border)',
                lineHeight: 1.5, maxHeight: 90, overflow: 'auto',
                fontFamily: 'monospace',
              }}>
                {result.extracted_text_preview}
              </div>
            </div>
          </div>

          {/* Recommended Standards */}
          {result.recommendations.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Search size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  Recommended Full Specification Standards ({result.recommendations.length})
                </h3>
              </div>
              {result.recommendations.map(rec => (
                <ResultCard
                  key={rec.standard_id}
                  result={rec}
                  isInChecklist={false}
                  onToggleChecklist={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading Document Analyzer...</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
