'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, FileText, CheckSquare, GitBranch, BookOpen, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { getStats, getHealth } from '@/services/api';
import type { Stats, HealthStatus } from '@/types';

export default function DashboardPage() {
  const { t } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStats().catch(() => null),
      getHealth().catch(() => null),
    ]).then(([s, h]) => {
      setStats(s as Stats);
      setHealth(h as HealthStatus);
      setLoading(false);
    });
  }, []);

  const quickActions = [
    {
      href: '/search',
      icon: Search,
      title: t('nav.search'),
      description: 'Enter a procurement specification to find applicable Indian Standards',
      color: '#1a3c5e',
      bg: '#eff6ff',
    },
    {
      href: '/analyze',
      icon: FileText,
      title: t('nav.analyze'),
      description: 'Upload a tender PDF, DOCX, or TXT to auto-detect IS references',
      color: '#7c3aed',
      bg: '#faf5ff',
    },
    {
      href: '/compliance',
      icon: CheckSquare,
      title: t('nav.compliance'),
      description: 'Build and manage compliance checklists for procurement specifications',
      color: '#059669',
      bg: '#f0fdf4',
    },
    {
      href: '/version-check',
      icon: GitBranch,
      title: t('nav.version'),
      description: 'Check if an IS citation is potentially outdated',
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      href: '/standards',
      icon: BookOpen,
      title: t('nav.standards'),
      description: 'Browse and search the demo standards catalog',
      color: '#0e7490',
      bg: '#ecfeff',
    },
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Hero */}
      <div className="hero-gradient" style={{
        borderRadius: 'var(--radius-xl)',
        padding: '40px 48px',
        color: 'white',
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 60, width: 300, height: 300, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            padding: '4px 14px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
            SIH 2026 — PS108 Demo
          </div>
          <div style={{
            padding: '4px 14px',
            background: 'rgba(16, 185, 129, 0.25)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            borderRadius: 100,
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.8px', textTransform: 'uppercase',
            color: '#86efac',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, background: '#86efac', borderRadius: '50%', display: 'inline-block' }} />
            DATA SOURCE: OFFICIAL BIS DATA
          </div>
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 12, lineHeight: 1.15 }}>
          BIS SmartSpec AI
        </h1>
        <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 8, maxWidth: 600, lineHeight: 1.5 }}>
          {t('app.tagline')}
        </p>
        <p style={{ fontSize: 13, opacity: 0.6, maxWidth: 500 }}>
          Bureau of Indian Standards · Ministry of Consumer Affairs, Food & Public Distribution
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <Link href="/search" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px',
            background: 'white',
            color: 'var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <Search size={18} />
            Search Standards
          </Link>
          <Link href="/analyze" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600, fontSize: 15,
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.25)',
            transition: 'background 0.15s',
          }}>
            <FileText size={18} />
            Analyze Tender
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-banner" style={{ marginBottom: 28 }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, color: '#d97706', marginTop: 1 }} />
        <div>
          <strong>Important Disclaimer:</strong> {t('disclaimer.text')}
          {' '}Authoritative records are tagged <strong>OFFICIAL BIS VERIFIED</strong> with source links.
        </div>
      </div>

      {/* Stats */}
      {!loading && stats && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)' }}>
              {t('dashboard.title')} <span style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginLeft: 6, background: '#ecfdf5', padding: '2px 8px', borderRadius: 4, border: '1px solid #a7f3d0' }}>OFFICIAL BIS ACTIVE</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { label: t('dashboard.standards'), value: stats.total_standards, color: 'var(--color-primary)' },
              { label: t('dashboard.verified'), value: stats.verified_standards, color: 'var(--color-success)' },
              { label: t('dashboard.demo'), value: stats.demo_standards, color: 'var(--color-demo)' },
              { label: t('dashboard.searches'), value: stats.searches_performed, color: 'var(--color-primary-light)' },
              { label: t('dashboard.documents'), value: stats.documents_analyzed, color: '#0e7490' },
              { label: t('dashboard.checklists'), value: stats.checklists_created, color: '#059669' },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-card">
                <div className="stat-value" style={{ color }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Status */}
      {!loading && health && (
        <div className="card" style={{ marginBottom: 28, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--color-primary)' }}>
            <Zap size={15} style={{ display: 'inline', marginRight: 6 }} />
            System Status
          </h3>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              {
                label: 'Vector Store',
                ok: health.services.vector_store.available,
                detail: `${health.services.vector_store.document_count} documents`,
              },
              {
                label: 'Embedding Model',
                ok: health.services.embedding_model.available,
                detail: health.services.embedding_model.model,
              },
              {
                label: 'LLM Provider',
                ok: health.services.llm.available,
                detail: health.services.llm.provider,
              },
            ].map(({ label, ok, detail }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: ok ? 'var(--color-success)' : 'var(--color-text-3)',
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>
          {health.services.vector_store.document_count === 0 && (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              background: '#fef3c7',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              color: '#92400e',
            }}>
              ⚠ Standards index is empty. Run: <code>python scripts/seed_demo_data.py && python scripts/build_embeddings.py</code>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--color-primary)' }}>
          Get Started
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {quickActions.map(({ href, icon: Icon, title, description, color, bg }) => (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: `1px solid ${bg === '#eff6ff' ? '#bfdbfe' : 'var(--color-border)'}`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div style={{
                  width: 44, height: 44,
                  background: bg,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                  {title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5 }}>
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
