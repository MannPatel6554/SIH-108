'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, AlertTriangle, GitBranch, Shield, BookOpen } from 'lucide-react';
import { getStandard } from '@/services/api';
import type { Standard, RelatedStandard } from '@/types';

const REL_COLORS: Record<string, string> = {
  TEST_METHOD: '#fff7ed', NORMATIVE_REFERENCE: '#eff6ff', SAFETY: '#fef2f2',
  INSTALLATION: '#f0fdf4', TERMINOLOGY: '#faf5ff', RELATED_PRODUCT: '#f8fafc',
};

const REL_TEXT_COLORS: Record<string, string> = {
  TEST_METHOD: '#c2410c', NORMATIVE_REFERENCE: '#1d4ed8', SAFETY: '#b91c1c',
  INSTALLATION: '#15803d', TERMINOLOGY: '#7c3aed', RELATED_PRODUCT: '#475569',
};

const MSME_REL: Record<string, string> = {
  TEST_METHOD: 'How to test this product',
  NORMATIVE_REFERENCE: 'Another standard this depends on',
  SAFETY: 'Safety requirements',
  INSTALLATION: 'How to install',
  TERMINOLOGY: 'Definitions used',
  RELATED_PRODUCT: 'Similar or related product standard',
  SUPERSEDES: 'The older version this replaced',
  AMENDED_BY: 'A later update to this standard',
};

export default function StandardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [standard, setStandard] = useState<Standard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msmeMode] = useState(false);

  useEffect(() => {
    if (!id) return;
    getStandard(id as string)
      .then(data => setStandard(data as Standard))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return (
    <div style={{ padding: 40 }}>
      <div style={{ color: '#dc2626', marginBottom: 16 }}>{error}</div>
      <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
    </div>
  );
  if (!standard) return null;

  const relatedByType: Record<string, RelatedStandard[]> = {};
  (standard.related_standards || []).forEach(rel => {
    if (!relatedByType[rel.relationship_type]) relatedByType[rel.relationship_type] = [];
    relatedByType[rel.relationship_type].push(rel);
  });

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'monospace', fontSize: 20, fontWeight: 800,
                color: 'var(--color-primary)',
              }}>
                {standard.standard_number}
              </span>
              {standard.part && (
                <span style={{ fontSize: 14, color: 'var(--color-text-2)' }}>— {standard.part}</span>
              )}
              <span className={`badge ${standard.status === 'CURRENT' ? 'badge-current' : standard.status === 'SUPERSEDED' ? 'badge-superseded' : 'badge-demo'}`}>
                {standard.status}
              </span>
              <span className={`badge ${
                standard.verification_status === 'OFFICIAL_VERIFIED' ? 'badge-official' :
                standard.verification_status === 'PUBLIC_BIS_DATA' ? 'badge-public-bis' :
                standard.verification_status === 'VERIFIED' ? 'badge-verified' : 'badge-demo'
              }`}>
                {standard.verification_status === 'OFFICIAL_VERIFIED' ? 'OFFICIAL BIS VERIFIED' :
                 standard.verification_status === 'PUBLIC_BIS_DATA' ? 'PUBLIC BIS DATA' :
                 standard.verification_status}
              </span>
            </div>
            
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
              {standard.title}
            </h1>
            {standard.title_hindi && (
              <div style={{ fontSize: 15, color: 'var(--color-text-2)', fontStyle: 'italic', marginBottom: 8 }}>
                {standard.title_hindi}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--color-text-2)', marginTop: 12 }}>
              <span><strong>Sector:</strong> {standard.sector}</span>
              <span><strong>Type:</strong> {standard.standard_type}</span>
              {standard.edition_year && <span><strong>Edition:</strong> {standard.edition_year}</span>}
              {standard.ics_code && <span><strong>ICS:</strong> {standard.ics_code}</span>}
            </div>
          </div>
          
          {standard.source_url && (
            <a
              href={standard.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              <ExternalLink size={13} />
              BIS Portal
            </a>
          )}
        </div>

        {/* Authoritative Provenance Banner for REAL records */}
        {standard.verification_status !== 'DEMO' && (
          <div style={{
            marginTop: 20,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            fontSize: 13,
            color: '#065f46'
          }}>
            <Shield size={16} style={{ flexShrink: 0, color: '#059669' }} />
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span><strong>Source:</strong> {standard.source_name || 'Bureau of Indian Standards'}</span>
              <span><strong>Verification:</strong> {standard.verification_status === 'OFFICIAL_VERIFIED' ? 'Official BIS Verified' : 'Public BIS Data'}</span>
              {standard.retrieved_at && <span><strong>Retrieved:</strong> {standard.retrieved_at.split('T')[0]}</span>}
              {standard.content_access && <span><strong>Access:</strong> {standard.content_access}</span>}
              {standard.source_url && (
                <a
                  href={standard.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#047857', fontWeight: 600, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                >
                  <ExternalLink size={12} /> View Official Standard Details
                </a>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer for DEMO data */}
        {standard.verification_status === 'DEMO' && (
          <div className="disclaimer-banner" style={{ marginTop: 20 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, color: '#d97706', marginTop: 2 }} />
            <span>
              <strong>DEMO record:</strong> This data is for demonstration purposes only. It is not verified official BIS information.
              Verify title, edition, amendments, and certification requirements from{' '}
              <a href="https://www.bis.gov.in" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--color-primary-light)', textDecoration: 'underline' }}>
                www.bis.gov.in
              </a>
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {(standard.description || standard.scope) && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12 }}>
            <BookOpen size={15} style={{ display: 'inline', marginRight: 6 }} />
            Description &amp; Scope
          </h2>
          {standard.description && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Description</div>
              <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.7 }}>{standard.description}</p>
            </div>
          )}
          {standard.scope && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Scope</div>
              <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.7 }}>{standard.scope}</p>
            </div>
          )}
          {standard.description_hindi && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 4 }}>हिंदी विवरण</div>
              <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.7 }}>{standard.description_hindi}</p>
            </div>
          )}
          {standard.keywords?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Keywords</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {standard.keywords.map(kw => (
                  <span key={kw} style={{
                    fontSize: 12, background: 'var(--color-surface-3)',
                    border: '1px solid var(--color-border)',
                    padding: '2px 10px', borderRadius: 100, color: 'var(--color-text-2)',
                  }}>{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certification */}
      {standard.certifications?.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12 }}>
            <Shield size={15} style={{ display: 'inline', marginRight: 6 }} />
            Certification Information
          </h2>
          {standard.certifications.map((cert, i) => (
            <div key={i} style={{
              padding: '12px 0',
              borderBottom: i < standard.certifications.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <strong style={{ fontSize: 14 }}>{cert.certification_type}</strong>
                <span className={`badge ${cert.is_mandatory === 'MANDATORY' ? 'badge-current' : cert.is_mandatory === 'VOLUNTARY' ? 'badge-sector' : 'badge-unverified'}`}>
                  {cert.is_mandatory}
                </span>
                <span className="badge badge-demo">DEMO</span>
              </div>
              {cert.scheme && <div style={{ fontSize: 13, color: 'var(--color-text-2)' }}>Scheme: {cert.scheme}</div>}
              {cert.notes && <div style={{ fontSize: 13, color: '#92400e', marginTop: 4 }}>⚠ {cert.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Related Standards */}
      {Object.keys(relatedByType).length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 16 }}>
            <GitBranch size={15} style={{ display: 'inline', marginRight: 6 }} />
            Allied & Related Standards
          </h2>
          {Object.entries(relatedByType).map(([type, rels]) => (
            <div key={type} style={{ marginBottom: 16 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px',
                background: REL_COLORS[type] || '#f8fafc',
                color: REL_TEXT_COLORS[type] || '#475569',
                borderRadius: 100, fontSize: 11, fontWeight: 700,
                marginBottom: 8, border: '1px solid',
                borderColor: REL_COLORS[type] ? 'transparent' : 'var(--color-border)',
              }}>
                {type.replace('_', ' ')}
                {msmeMode && MSME_REL[type] && (
                  <span style={{ fontWeight: 400, marginLeft: 4 }}>({MSME_REL[type]})</span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {rels.map(rel => (
                  <a
                    key={rel.id}
                    href={`/standards/${rel.id}`}
                    style={{
                      fontFamily: 'monospace', fontWeight: 600, fontSize: 13,
                      color: 'var(--color-primary)',
                      background: '#eff6ff', border: '1px solid #bfdbfe',
                      padding: '4px 12px', borderRadius: 6, textDecoration: 'none',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; }}
                    title={rel.title}
                  >
                    {rel.standard_number}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
