'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, GitBranch, FileText,
  Scale, ShieldCheck, X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', sub: 'Executive Overview' },
  { href: '/search', icon: Search, label: 'Semantic Search', sub: 'IS Accuracy & Hindi AI' },
  { href: '/standards', icon: GitBranch, label: 'Allied Standards Graph', sub: 'Normative Traversal' },
  { href: '/analyze', icon: FileText, label: 'Tender Gap Analysis', sub: 'PDF Audit & Remediation' },
  { href: '/version-check', icon: GitBranch, label: 'Version Currency', sub: 'Outdated Citation Check' },
  { href: '/compliance', icon: Scale, label: 'Statutory QCO Matrix', sub: 'BIS Act 2016 §16' },
];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(2px)',
            zIndex: 49,
          }}
          className="sidebar-backdrop"
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${isOpen ? 'open' : ''}`}
        aria-label="Main navigation"
        style={{
          width: 240,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
        }}
      >
        {/* Logo & Official Header */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--color-border)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ textDecoration: 'none' }} onClick={onClose}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #0f2540 0%, #1a3c5e 100%)',
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fbbf24',
                  border: '1.5px solid #f59e0b',
                  boxShadow: '0 2px 6px rgba(15, 37, 64, 0.25)',
                  flexShrink: 0,
                }}>
                  <Scale size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{
                    fontSize: 15, fontWeight: 800,
                    color: 'var(--color-primary)', lineHeight: 1.15,
                    letterSpacing: '-0.3px',
                  }}>
                    BIS SmartSpec AI
                  </div>
                  <div style={{ fontSize: 10, color: '#059669', fontWeight: 700, lineHeight: 1.2 }}>
                    National Standards Engine
                  </div>
                </div>
              </div>
            </Link>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="btn-close-sidebar"
                style={{
                  display: 'none',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-3)',
                  cursor: 'pointer',
                  padding: 4,
                }}
                aria-label="Close navigation drawer"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Official Status Indicator */}
          <div style={{
            marginTop: 12,
            padding: '4px 10px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            fontWeight: 700,
            color: '#065f46',
            letterSpacing: '0.4px',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#10b981', display: 'inline-block',
            }} />
            OFFICIAL BIS DATA ACTIVE
          </div>
        </div>

        {/* Navigation Menu (Filtered strictly to the core 6 options) */}
        <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-text-3)',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            padding: '6px 10px 6px',
          }}>
            Procurement Core Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '9px 12px',
                  marginBottom: 3,
                  borderRadius: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{
                    marginTop: 2,
                    flexShrink: 0,
                    color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-3)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? 'var(--color-primary-light)' : 'var(--color-text)',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-3)',
                    marginTop: 2,
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.sub}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Authority Attribution */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: '12px 14px',
          background: 'var(--color-surface)',
          fontSize: 10.5,
          color: 'var(--color-text-3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: '#047857', marginBottom: 2 }}>
            <ShieldCheck size={13} />
            <span>BIS Act 2016 Compliant</span>
          </div>
          <div>SIH 2026 PS108 · DoCA / BIS</div>
        </div>
      </aside>

      <style jsx>{`
        @media (max-width: 1024px) {
          .btn-close-sidebar {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
