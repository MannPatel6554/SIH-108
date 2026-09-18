// Context for app-wide settings (language, MSME mode)
'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations, TranslationKey } from '@/lib/i18n';

type Language = 'en' | 'hi';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  msmeMode: boolean;
  setMsmeMode: (mode: boolean) => void;
  t: (key: string) => string;
  topK: number;
  setTopK: (k: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [msmeMode, setMsmeMode] = useState(false);
  const [topK, setTopK] = useState(5);

  const t = (key: string): string => {
    const langTranslations = translations[language] as Record<string, string>;
    const enTranslations = translations.en as Record<string, string>;
    return langTranslations[key] || enTranslations[key] || key;
  };

  return (
    <AppContext.Provider value={{
      language, setLanguage,
      msmeMode, setMsmeMode,
      t, topK, setTopK
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
