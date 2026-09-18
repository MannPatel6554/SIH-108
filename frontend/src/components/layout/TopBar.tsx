'use client';
import { useApp } from '@/hooks/useApp';
import { Globe, ToggleLeft, ToggleRight, ShieldCheck, Award, Menu, Landmark, Check } from 'lucide-react';

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { language, setLanguage, msmeMode, setMsmeMode } = useApp();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Indian National Tricolor Ribbon at top */}
      <div style={{
        height: '3px',
        width: '100%',
        background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%, #138808 100%)',
      }} />

      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(12px, 2vw, 24px)',
        gap: 12,
      }}>
        {/* Left — Hamburger (Mobile/Laptop) & Authority Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="btn-hamburger"
              style={{
                display: 'none',
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '6px 8px',
                cursor: 'pointer',
                color: 'var(--color-primary)',
              }}
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={18} />
            </button>
          )}

          {/* Official Emblem & Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '4px 10px',
            background: '#f8fafc',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            minWidth: 0,
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: '#0f2540',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #f59e0b',
              flexShrink: 0,
            }}>
              <Landmark size={15} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: '#b45309',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                Government of India · भारत सरकार
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--color-primary)',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                Bureau of Indian Standards (BIS)
              </div>
            </div>
          </div>

          {/* Statutory Conformity Badge (Visible on large laptops & desktops >= 1280px) */}
          <div
            className="topbar-statutory-badge"
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 5,
              background: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #a7f3d0',
              fontSize: 11,
              color: '#047857',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldCheck size={13} style={{ color: '#059669' }} />
            <span>BIS Act 2016 §16 &amp; §17 Compliant</span>
          </div>

          {/* Zero-Hallucination Badge (Visible on extra-wide screens >= 1440px) */}
          <div
            className="topbar-verified-badge"
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 5,
              background: '#eff6ff',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #bfdbfe',
              fontSize: 11,
              color: '#1d4ed8',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Award size={13} style={{ color: '#2563eb' }} />
            <span>Zero-Hallucination Verified</span>
          </div>
        </div>

        {/* Right — MSME Mode & Language Controls (Always cleanly aligned) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* MSME Mode Toggle */}
          <button
            onClick={() => setMsmeMode(!msmeMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 6,
              border: `1px solid ${msmeMode ? '#059669' : 'var(--color-border)'}`,
              background: msmeMode ? '#d1fae5' : 'var(--color-surface-3)',
              color: msmeMode ? '#065f46' : 'var(--color-text-2)',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            aria-pressed={msmeMode}
            title="Toggle MSME Mode — plain language explanations for small suppliers"
          >
            {msmeMode ? <Check size={13} strokeWidth={2.5} /> : null}
            <span>{msmeMode ? 'MSME Mode Active' : 'MSME Mode'}</span>
          </button>

          {/* Language Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--color-surface-3)',
            borderRadius: 6,
            padding: 2,
            border: '1px solid var(--color-border)',
          }}>
            {(['en', 'hi'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  padding: '3px 9px',
                  borderRadius: 4,
                  border: 'none',
                  fontSize: 11.5,
                  fontWeight: language === lang ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: language === lang ? 'var(--color-primary)' : 'transparent',
                  color: language === lang ? 'white' : 'var(--color-text-2)',
                }}
                aria-pressed={language === lang}
              >
                {lang === 'en' ? 'EN' : 'हिंदी'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .btn-hamburger {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
        @media (min-width: 1280px) {
          .topbar-statutory-badge {
            display: flex !important;
          }
        }
        @media (min-width: 1440px) {
          .topbar-verified-badge {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
