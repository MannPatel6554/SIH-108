'use client';
import { useApp } from '@/hooks/useApp';

export default function SettingsPage() {
  const { topK, setTopK, msmeMode, setMsmeMode, language, setLanguage } = useApp();

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Settings</h1>
      
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--color-primary)' }}>Search Settings</h2>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Maximum Results (Top-K): <strong>{topK}</strong>
          </label>
          <input
            type="range" min={3} max={10} value={topK}
            onChange={e => setTopK(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-3)' }}>
            <span>3 (fast)</span><span>10 (thorough)</span>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--color-primary)' }}>Display Settings</h2>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>Language</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['en', 'hi'] as const).map(lang => (
              <button
                key={lang}
                className={`btn ${language === lang ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLanguage(lang)}
              >
                {lang === 'en' ? '🇬🇧 English' : '🇮🇳 हिंदी'}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>MSME Mode</label>
          <button
            className={`btn ${msmeMode ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setMsmeMode(!msmeMode)}
          >
            {msmeMode ? '✓ MSME Mode Enabled' : 'Enable MSME Mode'}
          </button>
          <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 8 }}>
            Simplifies technical jargon for small and medium enterprises.
          </div>
        </div>
      </div>
      
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--color-primary)' }}>Backend Connection</h2>
        <div style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 8 }}>
          API URL: <code style={{ fontFamily: 'monospace', background: 'var(--color-surface-3)', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>
            {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}
          </code>
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
          To change, set NEXT_PUBLIC_API_URL in frontend/.env.local
        </div>
      </div>
    </div>
  );
}
