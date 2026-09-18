'use client';
import { useEffect, useState } from 'react';
import { Database, AlertTriangle, ExternalLink } from 'lucide-react';
import { getDataSources } from '@/services/api';

export default function DataSourcesPage() {
  const [sources, setSources] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDataSources().then((data) => setSources(data as unknown[])).catch(() => setSources([])).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          <Database size={24} style={{ display: 'inline', marginRight: 8 }} />
          Data Sources
        </h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15 }}>
          Information about where the standards data comes from, verification status, and data provenance.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-banner" style={{ marginBottom: 24 }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, color: '#d97706', marginTop: 2 }} />
        <div>
          <strong>Independent Prototype:</strong> This is an independent prototype developed for SIH 2026 (PS108).
          It is NOT officially endorsed by or affiliated with the Bureau of Indian Standards (BIS),
          Ministry of Consumer Affairs, or any Government of India authority.
          All data labeled DEMO is not verified official BIS information.
        </div>
      </div>

      {/* Sources */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-2)' }}>Loading...</div>
      ) : (
        <>
          {(sources as Record<string, unknown>[]).map((source, i) => (
            <div key={i} className="card" style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{String(source.name)}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span className={`badge ${String(source.verification_status) === 'DEMO' ? 'badge-demo' : 'badge-verified'}`}>
                      {String(source.verification_status)}
                    </span>
                    <span className="badge badge-sector">{String(source.source_type)}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
                      {Number(source.record_count)} records
                    </span>
                  </div>
                  {Boolean(source.notes) && (
                    <div style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, maxWidth: 500 }}>
                      {String(source.notes)}
                    </div>
                  )}
                  {Boolean(source.last_ingested) && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 6 }}>
                      Last ingested: {new Date(String(source.last_ingested)).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {Boolean(source.source_url) && (
                  <a href={String(source.source_url)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                    <ExternalLink size={13} />
                    Visit Source
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* How to add data */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--color-primary)' }}>
              Adding Real BIS Data
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 14, lineHeight: 1.7 }}>
              To add official BIS data to the system, prepare records following the standard JSON schema and run the ingestion pipeline:
            </p>
            <div style={{
              background: '#0f172a', color: '#e2e8f0', padding: '16px 20px',
              borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8,
            }}>
              <div style={{ color: '#94a3b8' }}># 1. Place JSON files in data/raw/</div>
              <div>cp your_standards.json backend/data/raw/</div>
              <div style={{ color: '#94a3b8', marginTop: 8 }}># 2. Run the seeder script</div>
              <div>cd backend && python scripts/ingest_standards.py</div>
              <div style={{ color: '#94a3b8', marginTop: 8 }}># 3. Rebuild the search index</div>
              <div>python scripts/build_embeddings.py</div>
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-text-2)' }}>
              The ingestion schema is documented in <code style={{ fontFamily: 'monospace' }}>backend/data/demo/demo_standards.json</code>.
              Set <code>verification_status</code> to <code>"VERIFIED"</code> only for data verified from official BIS sources.
            </div>
          </div>

          {/* Limitations */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--color-primary)' }}>
              Limitations &amp; Access Conditions
            </h2>
            <ul style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Official BIS standards data is proprietary and requires licensing from BIS.</li>
              <li>The demo dataset uses IS numbers as identifiers but all metadata is approximate/illustrative.</li>
              <li>Certification requirements (mandatory/voluntary) must be verified from official BIS portal.</li>
              <li>Amendment numbers, revision dates, and supersession information in demo records are NOT verified.</li>
              <li>GeM and CPPP integration would require official API access which is not available to this prototype.</li>
              <li>For production use, only use data officially obtained and licensed from BIS.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
