import React, { createContext, useContext, useMemo, useState } from 'react';
import { SupportedLanguage } from '../types';
import { DEFAULT_LANGUAGE, translations } from '../i18n/translations';

const STORAGE_KEY = 'agrocare_language';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const isSupportedLanguage = (value: string): value is SupportedLanguage => {
  return ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'or'].includes(value);
};

const getInitialLanguage = (): SupportedLanguage => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isSupportedLanguage(stored)) {
    return stored;
  }

  const browserLang = navigator.language?.slice(0, 2).toLowerCase() || '';
  if (isSupportedLanguage(browserLang)) {
    return browserLang;
  }

  return DEFAULT_LANGUAGE;
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  const setLanguage = (nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  const t = (key: string, fallback?: string) => {
    const current = translations[language]?.[key];
    const english = translations.en?.[key];
    return current || english || fallback || key;
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
