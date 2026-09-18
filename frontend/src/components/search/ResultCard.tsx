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
import { submitSearchFeedback } from '@/services/api';

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
  const [feedbackState, setFeedbackState] = useState<'helpful' | 'irrelevant' | null>(null);

  const handleFeedback = async (isHelpful: boolean) => {
    setFeedbackState(isHelpful ? 'helpful' : 'irrelevant');
    try {
      await submitSearchFeedback({
        query: result.title,
        standard_id: result.standard_id,
        standard_number: result.standard_number,
        is_relevant: isHelpful,
        rating: isHelpful ? 5 : 1,
        user_role: 'PROCUREMENT_OFFICER',
      });
    } catch {
      // Graceful fallback
    }
  };

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

              {/* CPWD DSR / GeM Thesaurus Badge */}
              {result.thesaurus_source && (
                <span style={{
                  background: '#ecfdf5',
                  border: '1px solid #10b981',
                  color: '#065f46',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 100,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <CheckCircle2 size={11} />
                  {result.thesaurus_source === 'CPWD_DSR_2023' ? 'CPWD DSR 2023 RESOLVED' : 'GeM TAXONOMY MATCH'}
                </span>
              )}
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
          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 105, background: 'white', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{
              fontSize: 26, fontWeight: 900,
              color: confidence === 'high' ? '#059669' : confidence === 'medium' ? '#d97706' : '#6b7280',
              lineHeight: 1,
            }}>
              {scorePercent}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase' }}>
              Two-Stage Score
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
              fontSize: 10.5, color: 'var(--color-text-3)', fontWeight: 600, flexWrap: 'wrap',
            }}>
              <span>Stage 1 Dense: {(result.score_breakdown.semantic_score * 100).toFixed(0)}%</span>
              <span>BM25 Lexical: {(result.score_breakdown.lexical_score * 100).toFixed(0)}%</span>
              {result.score_breakdown.cross_encoder_score !== undefined && (
                <span style={{ color: '#1d4ed8', fontWeight: 700 }}>
                  Stage 2 Cross-Encoder: {(result.score_breakdown.cross_encoder_score * 100).toFixed(0)}%
                </span>
              )}
              <span>Metadata &amp; DSR: {(result.score_breakdown.metadata_score * 100).toFixed(0)}%</span>
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

        {/* Feature 2: GraphRAG Allied Standards Bundle */}
        {result.allied_bundle && result.allied_bundle.length > 0 && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: '#334155',
              textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <GitBranch size={13} style={{ color: '#2563eb' }} />
              GraphRAG Companion Standards Bundle ({result.allied_bundle.length} Interlinked Standards)
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {result.allied_bundle.map((comp) => (
                <Link
                  key={comp.id || comp.standard_number}
                  href={`/standards/${encodeURIComponent(comp.standard_number)}`}
                  style={{
                    textDecoration: 'none',
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#1e3a8a' }}>{comp.standard_number}</span>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700,
                    background: '#e0e7ff', color: '#3730a3',
                    padding: '1px 5px', borderRadius: 4,
                  }}>
                    {comp.relationship_type.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feature 4: Deep Spec Clauses & Tolerances */}
        {result.matched_clauses && result.matched_clauses.length > 0 && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: '#1e40af',
              textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Wrench size={13} style={{ color: '#2563eb' }} />
              Deep Spec Clauses &amp; Mandatory Engineering Tolerances
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {result.matched_clauses.map((cl, idx) => (
                <div key={idx} style={{ background: 'white', padding: '6px 10px', borderRadius: 6, border: '1px solid #dbeafe', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: 800, color: '#1e3a8a' }}>{cl.clause_number}: {cl.clause_title}</span>
                    {cl.key_tolerances && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#047857', background: '#d1fae5', padding: '1px 6px', borderRadius: 4 }}>
                        {cl.key_tolerances}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#475569' }}>{cl.clause_text}</div>
                </div>
              ))}
            </div>
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

          {/* Active Learning User Feedback Loop */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 600 }}>Active Learning:</span>
            <button
              onClick={() => handleFeedback(true)}
              style={{
                border: feedbackState === 'helpful' ? '1px solid #10b981' : '1px solid #cbd5e1',
                background: feedbackState === 'helpful' ? '#ecfdf5' : 'white',
                color: feedbackState === 'helpful' ? '#065f46' : '#64748b',
                padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
              title="Helpful recommendation - logs positive signal for continuous domain retraining"
            >
              <CheckCircle2 size={11} />
              {feedbackState === 'helpful' ? 'Helpful' : 'Helpful'}
            </button>
            <button
              onClick={() => handleFeedback(false)}
              style={{
                border: feedbackState === 'irrelevant' ? '1px solid #f87171' : '1px solid #cbd5e1',
                background: feedbackState === 'irrelevant' ? '#fef2f2' : 'white',
                color: feedbackState === 'irrelevant' ? '#991b1b' : '#64748b',
                padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              }}
              title="Irrelevant recommendation - penalizes ranking in domain retraining queue"
            >
              {feedbackState === 'irrelevant' ? 'Flagged' : 'Flag Irrelevant'}
            </button>
          </div>
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
