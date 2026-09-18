import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/hooks/useApp";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "BIS SmartSpec AI — Indian Standards Recommendation Engine",
  description:
    "AI-Powered Recommendation Engine for Identifying Applicable Indian Standards for Procurement Specifications. SIH 2026 — PS108.",
  keywords: [
    "BIS", "Indian Standards", "procurement", "IS standards", "BIS SmartSpec",
    "tender", "specification", "compliance", "certification"
  ],
  authors: [{ name: "SIH 2026 Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        <AppProvider>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{
              marginLeft: '240px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
            }} className="main-content">
              <TopBar />
              <main style={{ flex: 1, padding: '24px' }}>
                {children}
              </main>
              <footer style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                fontSize: '12px',
                color: 'var(--color-text-3)',
                textAlign: 'center',
              }}>
                BIS SmartSpec AI — SIH 2026 Prototype | Decision-Support System |{' '}
                <span style={{ color: '#059669', fontWeight: 600 }}>⬡ OFFICIAL BIS DATA ACTIVE</span>
              </footer>
            </div>
          </div>
        </AppProvider>
        <style>{`
          @media (max-width: 768px) {
            .main-content { margin-left: 0 !important; }
          }
        `}</style>
      </body>
    </html>
  );
}
