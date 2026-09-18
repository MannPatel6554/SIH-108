'use client';
import { useState, useRef } from 'react';
import { Search, Loader2, Filter, Download, CheckSquare, AlertTriangle, Zap } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { searchStandards, exportPDF, exportExcel, createChecklist } from '@/services/api';
import type { SearchResponse, RecommendationResult } from '@/types';
import ResultCard from '@/components/search/ResultCard';

const DEMO_QUERIES = [
  { key: 'quick.q1', text: 'Steel pipes for water supply' },
  { key: 'quick.q2', text: 'LED street lights for municipal roads' },
  { key: 'quick.q3', text: 'PVC insulated electric cables' },
  { key: 'quick.q4', text: 'Cement for building construction' },
  { key: 'quick.q5', text: 'Safety helmet for industrial workers' },
  { key: 'quick.q6', text: 'पानी की सप्लाई के लिए स्टील पाइप' },
];

const SECTORS = ['', 'CONSTRUCTION', 'ELECTRICAL', 'ELECTRONICS', 'MECHANICAL', 'FOOD', 'WATER', 'HEALTHCARE', 'GENERAL'];
const TYPES = ['', 'PRODUCT', 'TEST_METHOD', 'SAFETY', 'TERMINOLOGY', 'INSTALLATION', 'MANAGEMENT'];

export default function SearchPage() {
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
        language,
        top_k: topK,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      setResults(response as SearchResponse);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('fetch') || errMsg.includes('Failed to fetch')) {
        setError('Cannot connect to backend. Please start the backend server (python run.py).');
      } else {
        setError(errMsg || t('general.error'));
      }
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
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
      alert(`Checklist saved with ${checklist.length} items! View in Compliance Checker.`);
    } catch {
      alert('Failed to save checklist.');
    } finally {
      setChecklistSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          {t('nav.search')}
        </h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15 }}>
          Describe what you want to procure. The system identifies applicable Indian Standards using semantic AI search.
        </p>
      </div>

      {/* Search Box */}
      <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-3)',
              }}
            />
            <input
              ref={inputRef}
              type="text"
              className="input"
              style={{ paddingLeft: 42 }}
              placeholder={t('search.placeholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              aria-label="Procurement search query"
              id="search-input"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            aria-label="Search"
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Search size={16} />}
            {t('search.button')}
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
            title="Filters"
          >
            <Filter size={16} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{
            marginTop: 16, paddingTop: 16,
            borderTop: '1px solid var(--color-border)',
            display: 'flex', gap: 12, flexWrap: 'wrap',
          }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', display: 'block', marginBottom: 4 }}>
                {t('filter.sector')}
              </label>
              <select
                className="input"
                style={{ width: 160, padding: '8px 12px', fontSize: 13 }}
                value={filters.sector || ''}
                onChange={e => setFilters(prev => ({ ...prev, sector: e.target.value }))}
              >
                {SECTORS.map(s => (
                  <option key={s} value={s}>{s || t('filter.all')}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', display: 'block', marginBottom: 4 }}>
                {t('filter.type')}
              </label>
              <select
                className="input"
                style={{ width: 160, padding: '8px 12px', fontSize: 13 }}
                value={filters.standard_type || ''}
                onChange={e => setFilters(prev => ({ ...prev, standard_type: e.target.value }))}
              >
                {TYPES.map(s => (
                  <option key={s} value={s}>{s || t('filter.all')}</option>
                ))}
              </select>
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setFilters({})}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Demo Queries */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-3)', marginBottom: 10 }}>
          <Zap size={13} style={{ display: 'inline', marginRight: 4 }} />
          {t('quick.title')}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DEMO_QUERIES.map(({ text }) => (
            <button
              key={text}
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoQuery(text)}
              style={{ fontSize: 12 }}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          color: '#991b1b', marginBottom: 20,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: 'var(--color-text-2)' }}>
            <div className="spinner" />
            <span>{t('search.loading')}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div>
          {/* Results Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16, flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ fontSize: 14, color: 'var(--color-text-2)' }}>
              <strong style={{ color: 'var(--color-text)' }}>{results.total_results}</strong>{' '}
              {t('search.results_count')}{' '}
              {t('search.time')} {results.search_time_ms.toFixed(0)}ms
              {results.language === 'hi' && (
                <span style={{ marginLeft: 8 }} className="badge badge-demo">हिंदी query detected</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {checklist.length > 0 && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSaveChecklist}
                  disabled={checklistSaving}
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
                PDF
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleExport('excel')}
                disabled={exportLoading !== null}
              >
                {exportLoading === 'excel' ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Download size={14} />}
                Excel
              </button>
            </div>
          </div>

          {results.total_results === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-2)' }}>
              <Search size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>{t('search.no_results')}</p>
              <p style={{ fontSize: 12, marginTop: 8, color: 'var(--color-text-3)' }}>
                {t('search.empty_index')}
              </p>
            </div>
          )}

          {results.results.map((result, idx) => (
            <div key={result.standard_id} className="animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
              <ResultCard
                result={result}
                isInChecklist={checklist.some(r => r.standard_id === result.standard_id)}
                onToggleChecklist={() => toggleChecklist(result)}
              />
            </div>
          ))}

          {/* Disclaimer at bottom */}
          <div className="disclaimer-banner" style={{ marginTop: 20 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, color: '#d97706', marginTop: 2 }} />
            <span>{results.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
