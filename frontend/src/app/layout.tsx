import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/hooks/useApp";
import AppShell from "@/components/layout/AppShell";

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body suppressHydrationWarning>
        <AppProvider>
          <AppShell>
            {children}
          </AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
