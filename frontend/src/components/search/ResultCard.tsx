'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ExternalLink, CheckSquare, AlertTriangle, BookOpen, Shield, Wrench } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import type { RecommendationResult } from '@/types';

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

  const scorePercent = Math.round(result.score * 100);
  const confidence = result.confidence;
  const Icon = TYPE_ICONS[result.standard_type] || BookOpen;

  const msmeExplanation = (techText: string): string => {
    if (!msmeMode) return techText;
    return techText
      .replace('normative reference', 'another standard this depends on')
      .replace('superseded', 'replaced by a newer version')
      .replace('test method', 'how to test this product');
  };

  return (
    <div className="result-card" style={{ marginBottom: 16 }}>
      {/* Header */}
      <div className="result-card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            {/* Standard number + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 15, fontWeight: 700,
                color: 'var(--color-primary)',
                background: '#eff6ff',
                padding: '2px 10px',
                borderRadius: 6,
              }}>
                {result.standard_number}
              </div>
              
              {/* Status badge */}
              <span className={`badge ${STATUS_CLASSES[result.status] || 'badge-unverified'}`}>
                {result.status}
              </span>
              
              {/* Verification badge */}
              <span className={`badge ${
                result.verification_status === 'OFFICIAL_VERIFIED' ? 'badge-official' :
                result.verification_status === 'PUBLIC_BIS_DATA' ? 'badge-public-bis' :
                result.verification_status === 'VERIFIED' ? 'badge-verified' :
                result.verification_status === 'DEMO' ? 'badge-demo' : 'badge-unverified'
              }`}>
                {result.verification_status === 'OFFICIAL_VERIFIED' ? 'OFFICIAL BIS VERIFIED' :
                 result.verification_status === 'PUBLIC_BIS_DATA' ? 'PUBLIC BIS DATA' :
                 result.verification_status}
              </span>
              
              {/* Type */}
              <span className="badge badge-type" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon size={9} />
                {result.standard_type.replace('_', ' ')}
              </span>
              
              {/* Sector */}
              <span className="badge badge-sector">{result.sector}</span>
            </div>
            
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
              {result.title}
            </h3>
            {result.title_hindi && (
              <div style={{ fontSize: 13, color: 'var(--color-text-2)', fontStyle: 'italic', marginBottom: 4 }}>
                {result.title_hindi}
              </div>
            )}

            {/* Authoritative Provenance Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 4,
              fontSize: 12,
              color: 'var(--color-text-3)',
              flexWrap: 'wrap'
            }}>
              <span>
                <strong>Source:</strong> {result.source_name || (result.verification_status === 'DEMO' ? 'Demo Dataset' : 'Bureau of Indian Standards')}
              </span>
              {result.source_url && (
                <a
                  href={result.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                >
                  <ExternalLink size={11} /> Official BIS Portal
                </a>
              )}
              {result.retrieved_at && (
                <span>
                  <strong>Verified:</strong> {result.retrieved_at.split('T')[0]}
                </span>
              )}
            </div>
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 90 }}>
            <div style={{
              fontSize: 28, fontWeight: 800,
              color: confidence === 'high' ? 'var(--color-success)'
                : confidence === 'medium' ? 'var(--color-warning)'
                : 'var(--color-text-3)',
              lineHeight: 1,
            }}>
              {scorePercent}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 }}>
              {t('result.relevance')}
            </div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge badge-${confidence}`} style={{ fontSize: 10 }}>
                {t(`confidence.${confidence}`)} {t('result.confidence')}
              </span>
            </div>
          </div>
        </div>

        {/* Score bar */}
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
              fontSize: 10, color: 'var(--color-text-3)',
            }}>
              <span>Semantic: {(result.score_breakdown.semantic_score * 100).toFixed(0)}%</span>
              <span>Lexical: {(result.score_breakdown.lexical_score * 100).toFixed(0)}%</span>
              <span>Metadata: {(result.score_breakdown.metadata_score * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="result-card-body">
        {/* AI Explanation */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)',
            letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4,
          }}>
            {t('result.ai_explanation')}
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
            {msmeExplanation(result.why_relevant)}
          </div>
        </div>

        {/* Evidence */}
        {result.evidence.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)',
              letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6,
            }}>
              {t('result.evidence')}
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
                <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 4 }}>
                  Source: {ev.source}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certification */}
        {result.certifications.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)',
              letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4,
            }}>
              {t('result.certification')}
            </div>
            {result.certifications.map((cert, i) => (
              <div key={i} style={{
                fontSize: 13,
                display: 'flex', gap: 8, alignItems: 'center',
                padding: '6px 0',
                borderBottom: i < result.certifications.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <Shield size={13} style={{ color: '#d97706', flexShrink: 0 }} />
                <div>
                  <span style={{ fontWeight: 600 }}>{cert.certification_type}</span>
                  {cert.scheme && <span style={{ color: 'var(--color-text-2)' }}> — {cert.scheme}</span>}
                  <span className={`badge ${cert.is_mandatory === 'MANDATORY' ? 'badge-current' : cert.is_mandatory === 'VOLUNTARY' ? 'badge-sector' : 'badge-unverified'}`} style={{ marginLeft: 6, fontSize: 10 }}>
                    {cert.is_mandatory}
                  </span>
                  {cert.verification_status === 'DEMO' && (
                    <span className="badge badge-demo" style={{ marginLeft: 4, fontSize: 10 }}>DEMO</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Limitations */}
        {result.limitations.length > 0 && expanded && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#92400e',
              textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4,
            }}>
              {t('result.limitations')}
            </div>
            {result.limitations.map((lim, i) => (
              <div key={i} style={{ fontSize: 12, color: '#92400e', display: 'flex', gap: 6 }}>
                <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                {lim}
              </div>
            ))}
          </div>
        )}

        {/* Extra fields */}
        {expanded && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--color-text-2)' }}>
            {result.edition_year && (
              <span><strong>Edition:</strong> {result.edition_year}</span>
            )}
            {result.allied_standards_count > 0 && (
              <span><strong>{result.allied_standards_count}</strong> {t('result.allied')}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="result-card-footer">
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/standards/${result.standard_id}`}
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={13} />
            {t('result.view')}
          </Link>
          <button
            className={`btn btn-sm ${isInChecklist ? 'btn-accent' : 'btn-ghost'}`}
            onClick={onToggleChecklist}
            aria-pressed={isInChecklist}
          >
            <CheckSquare size={13} />
            {isInChecklist ? 'In Checklist ✓' : t('result.add_checklist')}
          </button>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <><ChevronUp size={14} /> {t('general.less')}</>
          ) : (
            <><ChevronDown size={14} /> {t('general.more')}</>
          )}
        </button>
      </div>
    </div>
  );
}
