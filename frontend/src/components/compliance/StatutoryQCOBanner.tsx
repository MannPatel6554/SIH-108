'use client';
import { ShieldAlert, AlertTriangle, ExternalLink, Scale, CheckCircle2 } from 'lucide-react';

interface StatutoryQCOBannerProps {
  standardNumber?: string;
  orderName?: string;
  gazetteRef?: string;
  effectiveDate?: string;
  scheme?: string;
}

export default function StatutoryQCOBanner({
  standardNumber = 'IS 1239 (Part 1)',
  orderName = 'Steel and Steel Products (Quality Control) Order',
  gazetteRef = 'S.O. 1225(E) / Ministry of Steel',
  effectiveDate = 'Active & In Force',
  scheme = 'Scheme-I (ISI Mark Certification)',
}: StatutoryQCOBannerProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '2px solid #f59e0b',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative Government Stamp Watermark */}
      <div style={{
        position: 'absolute',
        right: 16,
        top: -10,
        fontSize: 100,
        opacity: 0.05,
        fontWeight: 900,
        userSelect: 'none',
        pointerEvents: 'none',
        color: '#b45309',
      }}>
        BIS §16
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{
          background: '#d97706',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          padding: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
        }}>
          <Scale size={26} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{
              background: '#b45309',
              color: 'white',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              padding: '3px 10px',
              borderRadius: 100,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <ShieldAlert size={12} />
              Statutory QCO Alert
            </span>

            <span style={{
              background: '#fff',
              border: '1px solid #f59e0b',
              color: '#92400e',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              Section 16, BIS Act, 2016
            </span>

            <span style={{
              background: '#ecfdf5',
              border: '1px solid #10b981',
              color: '#065f46',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              {scheme}
            </span>
          </div>

          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#78350f', marginBottom: 6 }}>
            Mandatory Quality Control Order Compliance Warning for {standardNumber}
          </h4>

          <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6, marginBottom: 12 }}>
            Under <strong>Section 16 of the Bureau of Indian Standards Act, 2016</strong>, read with the{' '}
            <strong>{orderName}</strong> (Gazette Ref: <em>{gazetteRef}</em>), no entity shall manufacture, import, store,
            sell, or <strong>procure through public tenders (GeM / CPPP)</strong> this item without a valid BIS Standard Mark (ISI).
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            background: 'rgba(255,255,255,0.7)',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid #fde68a',
            fontSize: 12,
          }}>
            <div>
              <span style={{ color: '#78350f', fontWeight: 700 }}>Statutory Status:</span>{' '}
              <span style={{ color: '#b45309', fontWeight: 600 }}>{effectiveDate}</span>
            </div>
            <div>
              <span style={{ color: '#78350f', fontWeight: 700 }}>Conformity Assessment:</span>{' '}
              <span style={{ color: '#047857', fontWeight: 600 }}>Scheme-I (ISI Mark License)</span>
            </div>
            <div>
              <span style={{ color: '#78350f', fontWeight: 700 }}>Penal Liability:</span>{' '}
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>Section 29 BIS Act (Imprisonment &amp; Fine)</span>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} style={{ color: '#059669' }} />
              <span>Clause required in NIT: <em>&ldquo;Bidders must hold valid BIS Certification Marks License on bid submission date.&rdquo;</em></span>
            </div>
            <a
              href="https://www.bis.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: '#b45309',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Verify on BIS Gazette Portal</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
