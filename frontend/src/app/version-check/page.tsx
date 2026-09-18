'use client';
import { useState } from 'react';
import { GitBranch, Search, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { checkVersion } from '@/services/api';
import type { VersionCheckResponse } from '@/types';

export default function VersionCheckPage() {
  const [standardNumber, setStandardNumber] = useState('');
  const [referencedYear, setReferencedYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VersionCheckResponse | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!standardNumber.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await checkVersion({
        standard_number: standardNumber,
        referenced_year: referencedYear ? parseInt(referencedYear) : undefined,
      });
      setResult(res as VersionCheckResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  const examples = ['IS 1239', 'IS 3589', 'IS 694', 'IS 269', 'IS 16014', 'IS 2206'];

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          <GitBranch size={24} style={{ display: 'inline', marginRight: 8 }} />
          Version &amp; Currency Checker
        </h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15 }}>
          Check if a standard reference is current or potentially outdated in the demo database.
          Always verify from official BIS sources.
        </p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', display: 'block', marginBottom: 6 }}>
              IS Standard Number *
            </label>
            <input
              className="input"
              placeholder="e.g., IS 1239 or 1239"
              value={standardNumber}
              onChange={e => setStandardNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              id="version-check-input"
            />
          </div>
          <div style={{ width: 140 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', display: 'block', marginBottom: 6 }}>
              Referenced Year
            </label>
            <input
              className="input"
              type="number"
              placeholder="e.g., 2000"
              value={referencedYear}
              onChange={e => setReferencedYear(e.target.value)}
              min={1947}
              max={2030}
            />
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={loading || !standardNumber.trim()}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Search size={16} />}
          Check Version
        </button>

        {/* Examples */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 6 }}>Demo examples:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {examples.map(ex => (
              <button
                key={ex}
                className="btn btn-ghost btn-sm"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
                onClick={() => { setStandardNumber(ex); }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          color: '#991b1b', marginBottom: 16,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <XCircle size={16} />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            background: result.is_potentially_outdated ? '#fffbeb' : result.found ? '#f0fdf4' : '#f9fafb',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {result.is_potentially_outdated ? (
              <AlertTriangle size={22} style={{ color: '#d97706' }} />
            ) : result.found ? (
              <CheckCircle size={22} style={{ color: '#059669' }} />
            ) : (
              <XCircle size={22} style={{ color: '#6b7280' }} />
            )}
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: 'var(--color-primary)' }}>
                {result.standard_number}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 2 }}>
                {result.found ? 'Standard Identified in BIS Database' : 'Standard Not Found in Database'}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: 24 }}>
            {/* Message */}
            <div style={{
              fontSize: 14, lineHeight: 1.7,
              color: result.is_potentially_outdated ? '#92400e' : 'var(--color-text)',
              marginBottom: 16,
            }}>
              {result.message}
            </div>

            {/* Current Record */}
            {result.current_record && (
              <div style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  {result.current_record.verification_status === 'OFFICIAL_VERIFIED' ? 'Official BIS Standard Record' :
                   result.current_record.verification_status === 'PUBLIC_BIS_DATA' ? 'Public BIS Standard Reference' :
                   'Demo Database Record'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                  {result.current_record.title}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, fontSize: 13, alignItems: 'center' }}>
                  {result.current_record.edition_year && (
                    <span><strong>Edition:</strong> {result.current_record.edition_year}</span>
                  )}
                  <span><strong>Sector:</strong> {result.current_record.sector}</span>
                  <span><strong>Type:</strong> {result.current_record.standard_type}</span>
                  <span className={`badge ${result.current_record.status === 'CURRENT' ? 'badge-current' : 'badge-superseded'}`}>
                    {result.current_record.status}
                  </span>
                  <span className={`badge ${
                    result.current_record.verification_status === 'OFFICIAL_VERIFIED' ? 'badge-official' :
                    result.current_record.verification_status === 'PUBLIC_BIS_DATA' ? 'badge-public-bis' :
                    result.current_record.verification_status === 'VERIFIED' ? 'badge-verified' : 'badge-demo'
                  }`}>
                    {result.current_record.verification_status === 'OFFICIAL_VERIFIED' ? 'OFFICIAL BIS' :
                     result.current_record.verification_status === 'PUBLIC_BIS_DATA' ? 'PUBLIC BIS' :
                     result.current_record.verification_status}
                  </span>
                </div>
              </div>
            )}

            {/* Outdated Alert */}
            {result.is_potentially_outdated && (
              <div style={{
                marginTop: 16,
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)', padding: 16,
              }}>
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6, fontSize: 14 }}>
                  ⚠ Potentially Outdated Reference
                </div>
                <div style={{ fontSize: 13, color: '#92400e' }}>
                  Referenced year: <strong>{referencedYear}</strong> | Demo database year: <strong>{result.newer_record_year}</strong>
                </div>
                <div style={{ fontSize: 13, color: '#92400e', marginTop: 6 }}>
                  Action: Verify the latest edition and amendments from the official BIS website before use in procurement.
                </div>
              </div>
            )}

            {/* Not found */}
            {!result.found && (
              <div style={{
                marginTop: 16, padding: 16,
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
                  This standard is not in the demo database. Verify directly at:{' '}
                  <a href="https://www.bis.gov.in" target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--color-primary-light)', textDecoration: 'underline' }}>
                    www.bis.gov.in
                  </a>
                </div>
              </div>
            )}

            <div className="disclaimer-banner" style={{ marginTop: 16 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, color: '#d97706', marginTop: 2 }} />
              <span>
                DEMO data only. Always verify current edition, amendments, and certification requirements from official BIS sources.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
