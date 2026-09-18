'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, GitBranch, AlertTriangle, ShieldCheck, FileSpreadsheet, Globe, Sparkles } from 'lucide-react';

export default function CoreFeaturesBar() {
  const router = useRouter();

  const features = [
    {
      id: 'f1',
      number: '1',
      title: 'Semantic Search',
      badge: 'IS Accuracy',
      desc: 'Steel pipes for water supply',
      icon: Search,
      href: '/search?demo=steel_pipes',
      color: '#1d4ed8',
      bg: '#eff6ff',
    },
    {
      id: 'f2',
      number: '2',
      title: 'Allied Graph',
      badge: 'Knowledge Graph',
      desc: 'IS 1239 → IS 1387 & IS 6392',
      icon: GitBranch,
      href: '/standards/IS%201239%20(Part%201)?tab=allied',
      color: '#7c3aed',
      bg: '#faf5ff',
    },
    {
      id: 'f3',
      number: '3',
      title: 'Outdated Version',
      badge: 'Audit Alert',
      desc: 'IS 1239:1990 Flagged Superseded',
      icon: AlertTriangle,
      href: '/version-check?demo=is1239_1990',
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      id: 'f4',
      number: '4',
      title: 'Statutory QCO',
      badge: 'BIS Act §16',
      desc: 'Mandatory ISI Scheme-I Alert',
      icon: ShieldCheck,
      href: '/compliance?demo=qco',
      color: '#059669',
      bg: '#f0fdf4',
    },
    {
      id: 'f5',
      number: '5',
      title: 'Tender Gap Table',
      badge: 'PDF AI Audit',
      desc: 'CPWD NIT-2024 Water Pipeline',
      icon: FileSpreadsheet,
      href: '/analyze?demo=cpwd',
      color: '#0e7490',
      bg: '#ecfeff',
    },
    {
      id: 'f6',
      number: '6',
      title: 'Hindi Query',
      badge: 'Bilingual AI',
      desc: 'पानी की सप्लाई के लिए पाइप',
      icon: Globe,
      href: '/search?demo=hindi_pipes',
      color: '#b91c1c',
      bg: '#fef2f2',
    },
  ];

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      marginBottom: 24,
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a3c5e 0%, #2563eb 100%)',
            color: 'white',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.8px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Sparkles size={12} />
            SIH PS108 CORE EVALUATION
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
            1-Click Live Demonstration of all 6 Required Features:
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 600 }}>
          Click any feature below for instantaneous live evaluation
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
        gap: 8,
      }}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.id}
              href={f.href}
              style={{
                textDecoration: 'none',
                background: f.bg,
                border: `1px solid ${f.color}25`,
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = f.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = `${f.color}25`;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: f.color,
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {f.number}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
                    {f.title}
                  </span>
                </div>
                <Icon size={14} style={{ color: f.color }} />
              </div>
              <div style={{
                fontSize: 10,
                color: f.color,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}>
                {f.badge}
              </div>
              <div style={{
                fontSize: 11,
                color: 'var(--color-text-2)',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {f.desc}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
