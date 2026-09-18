'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className="app-main-wrapper"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
          width: '100%',
        }}
      >
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main style={{ flex: 1, padding: 'clamp(14px, 2.5vw, 28px)', minWidth: 0 }}>
          {children}
        </main>
        <footer style={{
          padding: '14px clamp(14px, 2.5vw, 28px)',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          fontSize: '11.5px',
          color: 'var(--color-text-3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            Bureau of Indian Standards · Smart India Hackathon 2026 (PS108)
          </div>
          <div style={{ color: '#047857', fontWeight: 700 }}>
            OFFICIAL BIS DATA ACTIVE · STATUTORY GROUND TRUTH
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .sidebar {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          width: 240px;
          height: 100vh;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 50;
        }

        .app-main-wrapper {
          margin-left: 240px;
          transition: margin-left 0.25s ease;
        }

        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .app-main-wrapper {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
