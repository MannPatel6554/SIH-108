'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown, ChevronUp, ExternalLink, CheckSquare, AlertTriangle,
  BookOpen, Shield, Wrench, GitBranch, Scale, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import type { RecommendationResult } from '@/types';
import AlliedStandardsGraph from '@/components/graph/AlliedStandardsGraph';
import StatutoryQCOBanner from '@/components/compliance/StatutoryQCOBanner';

interface Props {
  result: RecommendationResult;
  isInChecklist: boolean;
  onToggleChecklist: () => void;
}

const STATUS_CLASSES: Record<string, string> = {
  CURRENT: 'badge-current',
  SUPERSEDED: 'badge-superseded',
  WITHDRAWN: 'badge-withdrawn',
  DEMO: 'badge-demo',
  AMENDED: 'badge-sector',
  UNKNOWN: 'badge-unverified',
};

const TYPE_ICONS: Record<string, typeof BookOpen> = {
  PRODUCT: BookOpen,
  TEST_METHOD: Wrench,
  SAFETY: Shield,
  INSTALLATION: Wrench,
  TERMINOLOGY: BookOpen,
};

export default function ResultCard({ result, isInChecklist, onToggleChecklist }: Props) {
  const { t, msmeMode } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  const scorePercent = Math.round(result.score * 100);
  const confidence = result.confidence;
  const Icon = TYPE_ICONS[result.standard_type] || BookOpen;

  const hasMandatoryQCO =
    result.certifications?.some(c => c.is_mandatory === 'MANDATORY') ||
    result.standard_number.includes('1239') ||
    result.standard_number.includes('694') ||
    result.standard_number.includes('269') ||
    result.standard_number.includes('3589');

  const msmeExplanation = (techText: string): string => {
    if (!msmeMode) return techText;
    return techText
      .replace(/normative reference/gi, 'another required standard this depends on')
      .replace(/superseded/gi, 'replaced by a newer version')
      .replace(/test method/gi, 'quality testing procedure');
  };

  return (
    <div className="result-card" style={{ marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div className="result-card-header" style={{ background: '#fafbfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            {/* Standard number + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 16, fontWeight: 800,
                color: 'var(--color-primary)',
                background: '#eff6ff',
                padding: '3px 12px',
                borderRadius: 6,
                border: '1px solid #bfdbfe',
              }}>
                {result.standard_number}
              </div>

              {/* Status badge */}
              <span className={`badge ${STATUS_CLASSES[result.status] || 'badge-unverified'}`}>
                {result.status}
              </span>

              {/* Verification badge */}
              <span className="badge badge-official">
                OFFICIAL BIS VERIFIED
              </span>

              {/* Mandatory QCO Pill */}
              {hasMandatoryQCO && (
                <span style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  color: '#92400e',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 100,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Scale size={11} />
                  QCO MANDATORY (BIS ACT §16)
                </span>
              )}

              {/* Sector */}
              <span className="badge badge-sector">{result.sector}</span>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4, lineHeight: 1.3 }}>
              {result.title}
            </h3>
            {result.title_hindi && (
              <div style={{ fontSize: 13, color: '#1e3a8a', fontStyle: 'italic', marginBottom: 6, fontWeight: 500 }}>
                {result.title_hindi}
              </div>
            )}

            {/* Authoritative Provenance Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 6,
              fontSize: 12,
              color: 'var(--color-text-3)',
              flexWrap: 'wrap',
            }}>
              <span>
                <strong>Gazette Authority:</strong> Bureau of Indian Standards (Govt. of India)
              </span>
              <span>
                <strong>Edition:</strong> {result.edition_year || 'Current Active'}
              </span>
              {result.source_url && (
                <a
                  href={result.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}
                >
                  <ExternalLink size={12} /> View on BIS Portal
                </a>
              )}
            </div>
          </div>

          {/* Relevance Score */}
          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 100, background: 'white', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{
              fontSize: 26, fontWeight: 900,
              color: confidence === 'high' ? '#059669' : confidence === 'medium' ? '#d97706' : '#6b7280',
              lineHeight: 1,
            }}>
              {scorePercent}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase' }}>
              Semantic Match
            </div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge badge-${confidence}`} style={{ fontSize: 10 }}>
                {confidence.toUpperCase()} CONFIDENCE
              </span>
            </div>
          </div>
        </div>

        {/* Score breakdown bar */}
        <div style={{ marginTop: 12 }}>
          <div className="score-bar-container">
            <div
              className={`score-bar-fill ${confidence}`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          {result.score_breakdown && (
            <div style={{
              display: 'flex', gap: 16, marginTop: 4,
              fontSize: 10.5, color: 'var(--color-text-3)', fontWeight: 600,
            }}>
              <span>Dense Semantic: {(result.score_breakdown.semantic_score * 100).toFixed(0)}%</span>
              <span>BM25 Lexical: {(result.score_breakdown.lexical_score * 100).toFixed(0)}%</span>
              <span>Metadata Weight: {(result.score_breakdown.metadata_score * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="result-card-body">
        {/* Statutory QCO Warning Banner */}
        {hasMandatoryQCO && (
          <div style={{ marginBottom: 16 }}>
            <StatutoryQCOBanner
              standardNumber={result.standard_number}
              orderName="Quality Control Order (Mandatory ISI Mark)"
              effectiveDate="Active &amp; Statutorily Enforced"
            />
          </div>
        )}

        {/* AI Explanation */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: 'var(--color-primary)',
            letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <CheckCircle2 size={13} style={{ color: '#059669' }} />
            Procurement Applicability &amp; Rationale
            {msmeMode && <span style={{ color: '#047857', background: '#d1fae5', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>MSME Plain Mode</span>}
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
            {msmeExplanation(result.why_relevant)}
          </div>
        </div>

        {/* Evidence from BIS Database */}
        {result.evidence.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)',
              letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6,
            }}>
              Source Evidence Snippets (Database Grounded)
            </div>
            {result.evidence.slice(0, expanded ? undefined : 1).map((ev, i) => (
              <div key={i} style={{
                fontSize: 13, color: 'var(--color-text-2)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                marginBottom: 4,
              }}>
                <div>{ev.text}</div>
                <div style={{ fontSize: 10.5, color: 'var(--color-text-3)', marginTop: 4, fontWeight: 600 }}>
                  Source: {ev.source}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Allied Standards Graph (Toggleable) */}
        {showGraph && (
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <AlliedStandardsGraph
              centralStandard={result.standard_number}
              centralTitle={result.title}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="result-card-footer">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="btn btn-secondary btn-sm"
            style={{
              background: showGraph ? '#faf5ff' : 'white',
              borderColor: showGraph ? '#7c3aed' : 'var(--color-border)',
              color: showGraph ? '#7c3aed' : 'var(--color-text)',
              fontWeight: 700,
            }}
          >
            <GitBranch size={13} style={{ color: '#7c3aed' }} />
            {showGraph ? 'Hide Allied Graph' : 'View Allied Standards Graph'}
          </button>

          <Link
            href={`/standards/${result.standard_id}`}
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={13} />
            Full Standard Details
          </Link>

          <button
            className={`btn btn-sm ${isInChecklist ? 'btn-accent' : 'btn-ghost'}`}
            onClick={onToggleChecklist}
            aria-pressed={isInChecklist}
          >
            <CheckSquare size={13} />
            {isInChecklist ? 'In Checklist' : 'Add to NIT Checklist'}
          </button>
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <><ChevronUp size={14} /> Less Details</>
          ) : (
            <><ChevronDown size={14} /> More Details</>
          )}
        </button>
      </div>
    </div>
  );
}
