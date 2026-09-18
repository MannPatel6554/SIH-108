'use client';
import { useApp } from '@/hooks/useApp';
import { Globe, ToggleLeft, ToggleRight } from 'lucide-react';

export default function TopBar() {
  const { language, setLanguage, msmeMode, setMsmeMode, t } = useApp();

  return (
    <header style={{
      height: 56,
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      {/* Left — disclaimer */}
      <div style={{ fontSize: 12, color: 'var(--color-text-3)', maxWidth: 500 }}>
        ⚠ Demo data only — verify all standards from official{' '}
        <a
          href="https://www.bis.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-primary-light)', textDecoration: 'underline' }}
        >
          BIS website
        </a>
      </div>

      {/* Right — controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* MSME Mode toggle */}
        <button
          onClick={() => setMsmeMode(!msmeMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 100,
            border: '1px solid var(--color-border)',
            background: msmeMode ? '#d1fae5' : 'var(--color-surface)',
            color: msmeMode ? '#065f46' : 'var(--color-text-2)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          aria-pressed={msmeMode}
          title="Toggle MSME Mode — simplified language"
        >
          {msmeMode ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
          {t('msme.toggle')}
        </button>

        {/* Language toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Globe size={14} style={{ color: 'var(--color-text-3)' }} />
          <div style={{
            display: 'flex',
            background: 'var(--color-surface-3)',
            borderRadius: 100,
            padding: 2,
          }}>
            {(['en', 'hi'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  padding: '3px 12px',
                  borderRadius: 100,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: language === lang ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: language === lang ? 'var(--color-primary)' : 'transparent',
                  color: language === lang ? 'white' : 'var(--color-text-2)',
                }}
                aria-pressed={language === lang}
              >
                {lang === 'en' ? 'EN' : 'हि'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
