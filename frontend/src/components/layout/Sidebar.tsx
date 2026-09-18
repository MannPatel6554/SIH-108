'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, BookOpen, FileText,
  CheckSquare, GitBranch, Database, Info, Settings
} from 'lucide-react';
import { useApp } from '@/hooks/useApp';

const navItems = [
  { href: '/', icon: LayoutDashboard, key: 'nav.home' },
  { href: '/search', icon: Search, key: 'nav.search' },
  { href: '/standards', icon: BookOpen, key: 'nav.standards' },
  { href: '/analyze', icon: FileText, key: 'nav.analyze' },
  { href: '/compliance', icon: CheckSquare, key: 'nav.compliance' },
  { href: '/version-check', icon: GitBranch, key: 'nav.version' },
  { href: '/data-sources', icon: Database, key: 'nav.datasources' },
  { href: '/about', icon: Info, key: 'nav.about' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useApp();

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36,
              background: 'var(--color-primary)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 16,
              flexShrink: 0,
            }}>
              BIS
            </div>
            <div>
              <div style={{
                fontSize: 14, fontWeight: 700,
                color: 'var(--color-primary)', lineHeight: 1.2,
              }}>
                SmartSpec AI
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-3)', lineHeight: 1.2 }}>
                IS Recommendation Engine
              </div>
            </div>
          </div>
        </Link>

        {/* Demo mode indicator */}
        <div style={{
          marginTop: 12,
          padding: '4px 10px',
          background: '#f3e8ff',
          borderRadius: 100,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          fontWeight: 700,
          color: '#7c3aed',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#7c3aed', display: 'inline-block',
            animation: 'pulse 2s infinite',
          }} />
          DEMO MODE
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', letterSpacing: '0.8px', textTransform: 'uppercase', padding: '8px 6px 4px' }}>
          Navigation
        </div>
        {navItems.map(({ href, icon: Icon, key }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        borderTop: '1px solid var(--color-border)',
        padding: '12px',
      }}>
        <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
          <Settings size={16} />
          <span>Settings</span>
        </Link>
        <div style={{
          padding: '8px 6px', fontSize: 11,
          color: 'var(--color-text-3)', lineHeight: 1.4,
        }}>
          SIH 2026 — PS108<br />
          Bureau of Indian Standards
        </div>
      </div>
    </aside>
  );
}
