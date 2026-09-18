'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  GitBranch, Search, AlertTriangle, CheckCircle, XCircle,
  Loader2, Scale, Copy, Check, ShieldAlert, ArrowRight
} from 'lucide-react';
import { checkVersion } from '@/services/api';
import type { VersionCheckResponse } from '@/types';
import StatutoryQCOBanner from '@/components/compliance/StatutoryQCOBanner';

function VersionCheckContent() {
  const searchParams = useSearchParams();
  const [standardNumber, setStandardNumber] = useState('');
  const [referencedYear, setReferencedYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VersionCheckResponse | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const runCheck = async (std: string, yr?: string) => {
    const num = std || standardNumber;
    if (!num.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    const yearVal = yr !== undefined ? (yr ? parseInt(yr) : undefined) : (referencedYear ? parseInt(referencedYear) : undefined);

    try {
      const res = await checkVersion({
        standard_number: num,
        referenced_year: yearVal,
      });
      setResult(res as VersionCheckResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Version check failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const demo = searchParams.get('demo');
    if (demo === 'is1239_1990') {
      setStandardNumber('IS 1239');
      setReferencedYear('1990');
      runCheck('IS 1239', '1990');
    }
  }, [searchParams]);

  const triggerAuditDemo = (std: string, yr: string) => {
    setStandardNumber(std);
    setReferencedYear(yr);
    runCheck(std, yr);
  };

  const handleCopyRemedy = () => {
    if (!result?.current_record) return;
    const clause = `Item shall conform strictly to ${result.current_record.standard_number}:${result.current_record.edition_year} ("${result.current_record.title}") incorporating all active amendments and holding valid Bureau of Indian Standards (BIS) Certification Marks License (ISI Mark) under Scheme-I of BIS Act 2016.`;
    navigator.clipboard.writeText(clause);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Masthead */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.8px',
          }}>
            MODULE 03
          </span>
          <span style={{ fontSize: 12, color: '#92400e', fontWeight: 700 }}>
            Tender Specification Currency &amp; Audit Validator
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)', marginBottom: 6 }}>
          Outdated Version &amp; Superseded Citation Checker
        </h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15, lineHeight: 1.5 }}>
          Audit procurement clauses to determine if a cited standard is superseded, obsolete, or non-compliant with current
          statutory Quality Control Orders (QCO) under Section 16 of the BIS Act, 2016.
        </p>
      </div>

      {/* Input Box */}
      <div className="card" style={{
        padding: '24px',
        marginBottom: 20,
        boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
        border: '1px solid #cbd5e1',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(140px, 1fr) auto', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
              Standard Number (IS Code) *
            </label>
            <input
              className="input"
              style={{ height: 46, fontSize: 15, fontWeight: 600 }}
              placeholder="e.g., IS 1239 or IS 3589"
              value={standardNumber}
              onChange={e => setStandardNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runCheck(standardNumber, referencedYear)}
              id="version-check-input"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
              Referenced Year in Tender
            </label>
            <input
              className="input"
              type="number"
              style={{ height: 46, fontSize: 15 }}
              placeholder="e.g., 1990"
              value={referencedYear}
              onChange={e => setReferencedYear(e.target.value)}
              min={1947}
              max={2030}
              onKeyDown={e => e.key === 'Enter' && runCheck(standardNumber, referencedYear)}
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ height: 46, padding: '0 24px', fontWeight: 800 }}
            onClick={() => runCheck(standardNumber, referencedYear)}
            disabled={loading || !standardNumber.trim()}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Search size={16} />}
            Audit Citation
          </button>
        </div>

        {/* 1-Click Audit Demos */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
            Core Hackathon Audit Demonstrations (1-Click Evaluation):
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e', fontWeight: 800 }}
              onClick={() => triggerAuditDemo('IS 1239', '1990')}
            >
              Audit IS 1239:1990 (Tender Risk Demo)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e', fontWeight: 700 }}
              onClick={() => triggerAuditDemo('IS 3589', '1991')}
            >
              Audit IS 3589:1991 (Submerged Arc Pipe)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e', fontWeight: 700 }}
              onClick={() => triggerAuditDemo('IS 4984', '1995')}
            >
              Audit IS 4984:1995 (HDPE Water Pipe)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => triggerAuditDemo('IS 694', '2010')}
            >
              IS 694 (PVC Cables)
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          color: '#991b1b', marginBottom: 20,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="card" style={{
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          border: result.is_potentially_outdated ? '2px solid #f59e0b' : '1px solid #10b981',
          marginBottom: 24,
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            background: result.is_potentially_outdated ? 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)' : '#f0fdf4',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {result.is_potentially_outdated ? (
                <div style={{
                  background: '#d97706', color: 'white',
                  borderRadius: 'var(--radius-md)', padding: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShieldAlert size={26} />
                </div>
              ) : (
                <div style={{
                  background: '#059669', color: 'white',
                  borderRadius: 'var(--radius-md)', padding: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle size={26} />
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 900, color: 'var(--color-primary)' }}>
                    {result.standard_number}
                  </span>
                  {referencedYear && (
                    <span style={{ fontSize: 14, color: result.is_potentially_outdated ? '#b45309' : '#047857', fontWeight: 700 }}>
                      (Cited Edition: {referencedYear})
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: result.is_potentially_outdated ? '#b45309' : '#047857',
                  marginTop: 2,
                }}>
                  {result.is_potentially_outdated ? 'SUPERSEDED / OUTDATED STANDARD DETECTED' : 'CITATION IS CURRENT & VALID'}
                </div>
              </div>
            </div>

            <div style={{
              background: result.is_potentially_outdated ? '#b45309' : '#047857',
              color: 'white',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 100,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
            }}>
              {result.is_potentially_outdated ? 'CVC Audit Finding' : 'Compliant'}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '24px' }}>
            {/* Outdated Alert Breakdown */}
            {result.is_potentially_outdated && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                marginBottom: 20,
              }}>
                <div style={{ fontWeight: 800, color: '#92400e', fontSize: 15, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={18} style={{ color: '#d97706' }} />
                  Statutory Defect: Tender Cites Superseded Edition
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>Tender Citation</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#991b1b', fontFamily: 'monospace' }}>
                      {result.standard_number}:{referencedYear}
                    </div>
                    <div style={{ fontSize: 11, color: '#7f1d1d', marginTop: 2 }}>Outdated by {result.newer_record_year ? result.newer_record_year - parseInt(referencedYear) : 14} years</div>
                  </div>

                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '10px 14px', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Mandatory Current Edition</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#166534', fontFamily: 'monospace' }}>
                      {result.current_record?.standard_number || result.standard_number}:{result.newer_record_year || 'Current'}
                    </div>
                    <div style={{ fontSize: 11, color: '#14532d', marginTop: 2 }}>Active with latest amendments</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6, margin: 0 }}>
                  <strong>Legal Risk:</strong> Under Central Vigilance Commission (CVC) Procurement Guidelines and Section 16 of the BIS Act 2016,
                  procuring agencies cannot demand goods certified to a superseded standard. Doing so allows non-compliant suppliers to submit bids,
                  voids warranty claims, and triggers financial audit objections.
                </p>
              </div>
            )}

            {/* Current Active Record */}
            {result.current_record && (
              <div style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                  Authoritative Published Standard in BIS Catalog
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
                  {result.current_record.title}
                </h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-text-2)' }}>
                  <span><strong>Active Edition:</strong> {result.current_record.edition_year}</span>
                  <span><strong>Sector:</strong> {result.current_record.sector}</span>
                  <span><strong>Type:</strong> {result.current_record.standard_type}</span>
                  <span className="badge badge-official">OFFICIAL BIS VERIFIED</span>
                </div>
              </div>
            )}

            {/* Actionable Remediation Clause */}
            {result.is_potentially_outdated && result.current_record && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Recommended Corrective Clause for NIT / GeM Tender:
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyRemedy}
                    style={{ background: 'white', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: 700 }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied to Clipboard!' : 'Copy Clause'}
                  </button>
                </div>
                <div style={{
                  background: 'white',
                  border: '1px solid #dbeafe',
                  borderRadius: 6,
                  padding: '12px 14px',
                  fontFamily: 'monospace',
                  fontSize: 12.5,
                  color: '#1e3a8a',
                  lineHeight: 1.6,
                }}>
                  Item shall conform strictly to {result.current_record.standard_number}:{result.current_record.edition_year} (&ldquo;{result.current_record.title}&rdquo;) incorporating all active amendments and holding valid Bureau of Indian Standards (BIS) Certification Marks License (ISI Mark) under Scheme-I of BIS Act 2016.
                </div>
              </div>
            )}

            {/* Statutory QCO Banner if applicable */}
            {result.standard_number.includes('1239') && (
              <div style={{ marginTop: 16 }}>
                <StatutoryQCOBanner
                  standardNumber={result.standard_number}
                  orderName="Steel and Steel Products (Quality Control) Order"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VersionCheckPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading Version Checker...</div>}>
      <VersionCheckContent />
    </Suspense>
  );
}
