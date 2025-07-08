'use client';

import React, { createContext, useContext, useMemo } from 'react';

type Translations = {
  [key: string]: {
    [lang: string]: string;
  };
};

type TranslationsContextType = {
  translations: Translations;
  t: (key: string) => string;
};

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined);

export function TranslationsProvider({
  children,
  translations,
  lang,
}: {
  children: React.ReactNode;
  translations: any[];
  lang: string;
}) {
  const processedTranslations = useMemo(() => {
    const result: Translations = {};
    for (const item of translations) {
      result[item.key] = item.translations;
    }
    return result;
  }, [translations]);

  const translate = (key: string, currentLang: string): string => {
    const translationSet = processedTranslations[key];
    if (!translationSet) {
      return key; // Return key if not found
    }
    return translationSet[currentLang] || translationSet['en'] || key;
  };

  const value = {
    translations: processedTranslations,
    t: (key: string) => translate(key, lang),
  };

  return (
    <TranslationsContext.Provider value={value}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationsContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a TranslationsProvider');
  }
  return context;
}