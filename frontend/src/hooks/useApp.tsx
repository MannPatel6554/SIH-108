// Context for app-wide settings (language, MSME mode, and Government RBAC Roles)
'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from '@/lib/i18n';

export type Language = 'en' | 'hi';
export type GovernmentRole = 'PROCUREMENT_OFFICER' | 'TECHNICAL_EXPERT' | 'COMPLIANCE_ADMIN' | 'BIDDER_MSME';

export interface RoleMetadata {
  id: GovernmentRole;
  title: string;
  department: string;
  badge: string;
  icon: string;
  badgeColor: string;
  badgeBg: string;
}

export const ROLE_METADATA: Record<GovernmentRole, RoleMetadata> = {
  PROCUREMENT_OFFICER: {
    id: 'PROCUREMENT_OFFICER',
    title: 'Procurement Officer (Buyer)',
    department: 'CPWD / GeM Central Buyer Cell',
    badge: 'BUYER',
    icon: '',
    badgeColor: '#1e40af',
    badgeBg: '#dbeafe',
  },
  TECHNICAL_EXPERT: {
    id: 'TECHNICAL_EXPERT',
    title: 'Technical Committee Reviewer',
    department: 'BIS Civil Engineering Section',
    badge: 'TECHNICAL REVIEWER',
    icon: '',
    badgeColor: '#065f46',
    badgeBg: '#d1fae5',
  },
  COMPLIANCE_ADMIN: {
    id: 'COMPLIANCE_ADMIN',
    title: 'BIS Gazette / QCO Admin',
    department: 'Bureau of Indian Standards — Legal Cell',
    badge: 'REGULATORY ADMIN',
    icon: '',
    badgeColor: '#7c3aed',
    badgeBg: '#ede9fe',
  },
  BIDDER_MSME: {
    id: 'BIDDER_MSME',
    title: 'MSME Vendor / Supplier',
    department: 'Small Scale Industry Federation',
    badge: 'MSME BIDDER',
    icon: '',
    badgeColor: '#b45309',
    badgeBg: '#fef3c7',
  },
};

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  msmeMode: boolean;
  setMsmeMode: (mode: boolean) => void;
  t: (key: string) => string;
  topK: number;
  setTopK: (k: number) => void;
  currentRole: GovernmentRole;
  setCurrentRole: (role: GovernmentRole) => void;
  activeRoleMeta: RoleMetadata;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [msmeMode, setMsmeMode] = useState(false);
  const [topK, setTopK] = useState(5);
  const [currentRole, setCurrentRoleState] = useState<GovernmentRole>('PROCUREMENT_OFFICER');

  const setCurrentRole = (role: GovernmentRole) => {
    setCurrentRoleState(role);
    if (role === 'BIDDER_MSME') {
      setMsmeMode(true);
    }
  };

  const t = (key: string): string => {
    const langTranslations = translations[language] as Record<string, string>;
    const enTranslations = translations.en as Record<string, string>;
    return langTranslations[key] || enTranslations[key] || key;
  };

  return (
    <AppContext.Provider value={{
      language, setLanguage,
      msmeMode, setMsmeMode,
      t, topK, setTopK,
      currentRole, setCurrentRole,
      activeRoleMeta: ROLE_METADATA[currentRole],
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
