'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, Loader2, Filter, Download, CheckSquare,
  AlertTriangle, Zap, Globe, ShieldCheck, Scale, CheckCircle2
} from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { searchStandards, exportPDF, exportExcel, createChecklist } from '@/services/api';
import type { SearchResponse, RecommendationResult } from '@/types';
import ResultCard from '@/components/search/ResultCard';

const DEMO_QUERIES = [
  { key: 'q1', text: 'Steel pipes for water supply', label: 'Steel Pipes for Water Supply (IS 3589 / IS 1239)' },
  { key: 'q6', text: 'पानी की सप्लाई के लिए पाइप', label: 'Hindi AI: पानी की सप्लाई के लिए पाइप' },
  { key: 'q2', text: 'LED street lights for municipal roads', label: 'LED Street Lighting (IS 10322)' },
  { key: 'q3', text: 'PVC insulated electric cables 1100V', label: 'Electric Cables 1100V (IS 694)' },
  { key: 'q4', text: 'Ordinary Portland Cement 43 grade', label: 'Portland Cement (IS 269)' },
  { key: 'q5', text: 'Industrial safety helmet for workers', label: 'Industrial Safety Helmet (IS 2925)' },
];

const SECTORS = ['', 'CONSTRUCTION', 'ELECTRICAL', 'ELECTRONICS', 'MECHANICAL', 'FOOD', 'WATER', 'HEALTHCARE', 'GENERAL'];
const TYPES = ['', 'PRODUCT', 'TEST_METHOD', 'SAFETY', 'TERMINOLOGY', 'INSTALLATION', 'MANAGEMENT'];

function SearchContent() {
  const searchParams = useSearchParams();
  const { t, language, topK } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [checklist, setChecklist] = useState<RecommendationResult[]>([]);
  const [exportLoading, setExportLoading] = useState<'pdf' | 'excel' | null>(null);
  const [checklistSaving, setChecklistSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await searchStandards({
        query: searchQuery,
        language: /[\u0900-\u097F]/.test(searchQuery) ? 'hi' : language,
        top_k: topK,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      setResults(response as SearchResponse);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('fetch') || errMsg.includes('Failed to fetch')) {
        setError('Cannot connect to backend server. Please verify backend is running on port 8000.');
      } else {
        setError(errMsg || 'Search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check URL params on mount
  useEffect(() => {
    const demo = searchParams.get('demo');
    const q = searchParams.get('q');
    if (demo === 'steel_pipes') {
      const target = 'Steel pipes for water supply';
      setQuery(target);
      handleSearch(target);
    } else if (demo === 'hindi_pipes') {
      const target = 'पानी की सप्लाई के लिए पाइप';
      setQuery(target);
      handleSearch(target);
    } else if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, [searchParams]);

  const handleDemoQuery = (text: string) => {
    setQuery(text);
    handleSearch(text);
    inputRef.current?.focus();
  };

  const toggleChecklist = (result: RecommendationResult) => {
    setChecklist(prev => {
      const exists = prev.find(r => r.standard_id === result.standard_id);
      if (exists) return prev.filter(r => r.standard_id !== result.standard_id);
      return [...prev, result];
    });
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!results) return;
    setExportLoading(format);
    try {
      const payload = {
        query: results.query,
        results: results.results,
        checklist_items: [],
      };
      if (format === 'pdf') await exportPDF(payload);
      else await exportExcel(payload);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(null);
    }
  };

  const handleSaveChecklist = async () => {
    if (!checklist.length) return;
    setChecklistSaving(true);
    try {
      await createChecklist({
        name: `Checklist: ${query}`,
        query,
        items: checklist.map(r => ({
          standard_id: r.standard_id,
          standard_number: r.standard_number,
          standard_title: r.title,
          item_type: 'PRODUCT_STANDARD',
        })),
      });
      alert(`Compliance checklist created with ${checklist.length} standards!`);
    } catch {
      alert('Failed to save checklist.');
    } finally {
      setChecklistSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Page Masthead */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            background: 'linear-gradient(135deg, #1a3c5e 0%, #2563eb 100%)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.8px',
          }}>
            MODULE 01
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 700 }}>
            GeM / CPPP Technical Specification Semantic Finder
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)', marginBottom: 6 }}>
          Semantic Standards Recommendation Engine
        </h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15, lineHeight: 1.5 }}>
          Enter a procurement specification in plain English or हिंदी. The system matches applicable Indian Standards using
          fine-tuned domain contrastive embeddings, eliminating human omission errors.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="card" style={{
        padding: '24px',
        marginBottom: 20,
        boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
        border: '1px solid #cbd5e1',
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute', left: 16, top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }}
            />
            <input
              ref={inputRef}
              type="text"
              className="input"
              style={{
                paddingLeft: 46,
                paddingRight: 16,
                height: 48,
                fontSize: 15,
                fontWeight: 500,
                border: '1.5px solid #94a3b8',
              }}
              placeholder="e.g., 'Steel pipes for water supply' or 'पानी की सप्लाई के लिए पाइप'..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              aria-label="Procurement specification query"
              id="search-input"
            />
          </div>
          <button
            className="btn btn-primary"
            style={{
              padding: '0 28px',
              height: 48,
              fontSize: 15,
              fontWeight: 800,
              boxShadow: '0 2px 10px rgba(26,60,94,0.3)',
            }}
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            aria-label="Search Standards"
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Search size={18} />}
            Search Standards
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
            title="Sector / Type Filters"
            style={{ height: 48, width: 48 }}
          >
            <Filter size={18} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{
            marginTop: 16, paddingTop: 16,
            borderTop: '1px solid var(--color-border)',
            display: 'flex', gap: 14, flexWrap: 'wrap',
          }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-2)', display: 'block', marginBottom: 4 }}>
                Sector Filter
              </label>
              <select
                className="input"
                style={{ width: 180, padding: '8px 12px', fontSize: 13 }}
                value={filters.sector || ''}
                onChange={e => setFilters(prev => ({ ...prev, sector: e.target.value }))}
              >
                {SECTORS.map(s => (
                  <option key={s} value={s}>{s || 'All Sectors'}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-2)', display: 'block', marginBottom: 4 }}>
                Standard Type
              </label>
              <select
                className="input"
                style={{ width: 180, padding: '8px 12px', fontSize: 13 }}
                value={filters.standard_type || ''}
                onChange={e => setFilters(prev => ({ ...prev, standard_type: e.target.value }))}
              >
                {TYPES.map(s => (
                  <option key={s} value={s}>{s || 'All Types'}</option>
                ))}
              </select>
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setFilters({})}
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Demo Queries Bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} style={{ color: '#d97706' }} />
          <span>Curated Demonstration Queries (Click for Instant Live Evaluation):</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DEMO_QUERIES.map(({ text, label }) => {
            const isSelected = query === text;
            return (
              <button
                key={text}
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoQuery(text)}
                style={{
                  fontSize: 12.5,
                  fontWeight: isSelected ? 800 : 600,
                  background: isSelected ? '#eff6ff' : 'white',
                  borderColor: isSelected ? '#2563eb' : 'var(--color-border)',
                  color: isSelected ? '#1d4ed8' : 'var(--color-text)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          color: '#991b1b', marginBottom: 20,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Loader2 size={36} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--color-primary)' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>
              Executing Semantic Retrieval &amp; Cross-Encoder Hybrid Ranking...
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
              Grounded on Official Bureau of Indian Standards Database
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results && !loading && (
        <div>
          {/* Results Summary Bar */}
          <div style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div style={{ fontSize: 14, color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>
                Identified <strong style={{ color: 'var(--color-primary)' }}>{results.total_results}</strong> applicable standards
              </span>
              <span style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>
                {results.search_time_ms.toFixed(1)}ms Latency
              </span>
              {results.language === 'hi' && (
                <span style={{
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Globe size={12} />
                  हिंदी Natural Language Query Processed
                </span>
              )}
            </div>

            {/* Export & Checklist Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              {checklist.length > 0 && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSaveChecklist}
                  disabled={checklistSaving}
                  style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', fontWeight: 700 }}
                >
                  <CheckSquare size={14} />
                  Save Checklist ({checklist.length})
                </button>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleExport('pdf')}
                disabled={exportLoading !== null}
              >
                {exportLoading === 'pdf' ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Download size={14} />}
                Export PDF
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleExport('excel')}
                disabled={exportLoading !== null}
              >
                {exportLoading === 'excel' ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Download size={14} />}
                Export Excel
              </button>
            </div>
          </div>

          {/* Zero Results State */}
          {results.total_results === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-2)' }}>
              <Search size={40} style={{ opacity: 0.3, marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Matching Indian Standards Found</h3>
              <p style={{ fontSize: 14, maxWidth: 500, margin: '0 auto', color: 'var(--color-text-3)' }}>
                Try rephrasing with generic technical specifications (e.g. &ldquo;steel pipes&rdquo;, &ldquo;electric cable&rdquo;, &ldquo;cement&rdquo;).
              </p>
            </div>
          )}

          {/* Render Result Cards */}
          {results.results.map((result, idx) => (
            <div key={result.standard_id} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
              <ResultCard
                result={result}
                isInChecklist={checklist.some(r => r.standard_id === result.standard_id)}
                onToggleChecklist={() => toggleChecklist(result)}
              />
            </div>
          ))}

          {/* Bottom Statutory Notice */}
          <div className="disclaimer-banner" style={{ marginTop: 24 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, color: '#d97706', marginTop: 2 }} />
            <span>
              <strong>Statutory Compliance Confirmation:</strong> Standards marked with <strong>QCO MANDATORY</strong> require
              mandatory compliance under Section 16 of the BIS Act, 2016. Procurement officers must verify that suppliers hold
              active BIS certification on the date of technical bid opening.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading Search Engine...</div>}>
      <SearchContent />
    </Suspense>
  );
}
