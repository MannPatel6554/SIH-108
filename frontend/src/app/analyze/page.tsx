'use client';
import { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle, Search, XCircle } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { analyzeDocument } from '@/services/api';
import type { DocumentAnalysisResponse } from '@/types';
import ResultCard from '@/components/search/ResultCard';

export default function AnalyzePage() {
  const { t } = useApp();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DocumentAnalysisResponse | null>(null);

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
      setError(msg || t('upload.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{t('upload.title')}</h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15 }}>
          Upload a tender or specification document. The system extracts IS standard references and recommends additional applicable standards.
        </p>
      </div>

      {/* Upload Zone */}
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
              width: 64, height: 64,
              background: dragging ? '#dbeafe' : 'var(--color-surface-3)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              <Upload size={28} style={{ color: dragging ? 'var(--color-primary-light)' : 'var(--color-text-3)' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                {t('upload.drag')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
                {t('upload.types')}
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); document.getElementById('file-input')?.click(); }}>
              Browse Files
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Loader2 size={40} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--color-primary)' }} />
          <div style={{ marginTop: 16, color: 'var(--color-text-2)' }}>
            {t('upload.analyzing')}
            {file && <div style={{ fontSize: 13, marginTop: 4, color: 'var(--color-text-3)' }}>{file.name}</div>}
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
          <XCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#991b1b' }}>Processing Failed</strong>
            <div style={{ color: '#991b1b', fontSize: 14, marginTop: 4 }}>{error}</div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Analysis Complete</h2>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
                <FileText size={13} style={{ display: 'inline', marginRight: 4 }} />
                {result.filename} — processed in {result.processing_time_ms.toFixed(0)}ms
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setResult(null); setFile(null); }}>
              ← Upload Another
            </button>
          </div>

          {/* Document Summary */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--color-primary)' }}>
              Document Summary
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Detected Standards */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Detected IS References ({result.detected_standards.length})
                </div>
                {result.detected_standards.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {result.detected_standards.map(s => (
                      <span key={s} style={{
                        fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
                        background: '#eff6ff', color: 'var(--color-primary)',
                        padding: '3px 10px', borderRadius: 6,
                        border: '1px solid #bfdbfe',
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>No IS references detected</div>
                )}
              </div>

              {/* Text Preview */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Extracted Text Preview
                </div>
                <div style={{
                  fontSize: 12, color: 'var(--color-text-2)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 10, maxHeight: 80, overflow: 'hidden',
                  lineHeight: 1.5,
                }}>
                  {result.extracted_text_preview || 'No text extracted'}
                </div>
              </div>
            </div>

            {/* Outdated References */}
            {result.potential_outdated.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  ⚠ Potential Outdated References
                </div>
                {result.potential_outdated.map((item, i) => (
                  <div key={i} style={{
                    background: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                    fontSize: 13, marginBottom: 6,
                  }}>
                    <strong>Referenced:</strong> {item.referenced} →{' '}
                    <strong>Newer record:</strong> {item.newer_record}<br />
                    <span style={{ fontSize: 12, color: '#92400e' }}>Action: {item.action}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Gaps */}
            {result.potential_gaps.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Potentially Missing Standards (not in document)
                </div>
                {result.potential_gaps.map((gap, i) => (
                  <div key={i} style={{
                    fontSize: 13, color: 'var(--color-text-2)',
                    borderLeft: '3px solid var(--color-demo)',
                    paddingLeft: 12, marginBottom: 4,
                  }}>
                    {gap}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                <Search size={16} style={{ display: 'inline', marginRight: 6 }} />
                Recommended Standards ({result.recommendations.length})
              </h3>
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
