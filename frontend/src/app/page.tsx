'use client';
import Link from 'next/link';
import {
  Search, GitBranch, AlertTriangle, ShieldCheck,
  ArrowRight, CheckCircle2, FileSpreadsheet
} from 'lucide-react';
import CoreFeaturesBar from '@/components/layout/CoreFeaturesBar';
import AlliedStandardsGraph from '@/components/graph/AlliedStandardsGraph';

export default function DashboardPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 1-Click Core Features Bar */}
      <CoreFeaturesBar />

      {/* Official Government Portal Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #091e3a 0%, #102a4e 50%, #1a3c5e 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(24px, 4vw, 40px)',
        color: 'white',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(10, 30, 58, 0.25)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Subtle decorative circles */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 260, height: 260, background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -80, right: 120, width: 340, height: 340, background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }} />

        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{
            padding: '4px 12px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#fbbf24',
          }}>
            <span style={{ width: 6, height: 6, background: '#fbbf24', borderRadius: '50%', display: 'inline-block' }} />
            SIH 2026 PS108 · Official BIS Decision Support
          </div>

          <div style={{
            padding: '4px 12px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 100,
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.8px', textTransform: 'uppercase',
            color: '#86efac',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <ShieldCheck size={13} />
            SECTION 16 BIS ACT 2016 COMPLIANT
          </div>

          <div style={{
            padding: '4px 12px',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: 100,
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.8px', textTransform: 'uppercase',
            color: '#93c5fd',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <CheckCircle2 size={13} />
            ZERO-HALLUCINATION GROUNDED
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: 'white', marginBottom: 10, lineHeight: 1.15, letterSpacing: '-0.5px' }}>
          BIS SmartSpec AI
        </h1>
        <p style={{ fontSize: 18, color: '#e2e8f0', marginBottom: 6, maxWidth: 720, lineHeight: 1.5, fontWeight: 500 }}>
          AI-Powered Recommendation &amp; Audit Engine for Identifying Applicable Indian Standards for Public Procurement (GeM / CPPP)
        </p>
        <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 650, marginBottom: 28 }}>
          Bureau of Indian Standards · Ministry of Consumer Affairs, Food &amp; Public Distribution · Government of India
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/search" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 26px',
            background: '#ffffff',
            color: '#0f2540',
            borderRadius: 'var(--radius-md)',
            fontWeight: 800, fontSize: 15,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            transition: 'all 0.15s ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <Search size={18} style={{ color: '#1d4ed8' }} />
            Search Standards by Specification
          </Link>

          <Link href="/analyze?demo=cpwd" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 24px',
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.15s ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            <FileSpreadsheet size={18} style={{ color: '#38bdf8' }} />
            Analyze Tender Document (CPWD Demo)
          </Link>

          <Link href="/version-check?demo=is1239_1990" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 24px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fef3c7',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            transition: 'all 0.15s ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 158, 11, 0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)')}
          >
            <GitBranch size={18} style={{ color: '#fbbf24' }} />
            Audit Outdated Citations
          </Link>
        </div>
      </div>

      {/* Feature 2 Showcase: Embedded Allied Standards Knowledge Graph */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Core Feature 2 · Interactive Knowledge Graph
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
              Live Interdependent Standards Graph (IS 1239 → IS 1387 &amp; IS 6392)
            </h2>
          </div>
          <Link
            href="/standards/IS%201239%20(Part%201)"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-primary-light)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Inspect Full Specifications in Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <AlliedStandardsGraph
          centralStandard="IS 1239 (Part 1)"
          centralTitle="Steel Tubes, Tubulars and Other Wrought Steel Fittings"
        />
      </div>

      {/* Statutory Legal Disclaimer */}
      <div className="disclaimer-banner" style={{ marginBottom: 28, background: '#fffbeb', border: '1px solid #fde68a' }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, color: '#d97706', marginTop: 2 }} />
        <div style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.6 }}>
          <strong>Legal Notice for Public Procurement:</strong> Under CVC Office Order No. 02/02/2022 and Section 16 of the BIS Act 2016,
          all government procurement specifications issued on GeM / CPPP portals must mandate current Indian Standards with active amendments.
          This AI decision support engine provides verified recommendations grounded exclusively on published BIS data.
        </div>
      </div>
    </div>
  );
}
