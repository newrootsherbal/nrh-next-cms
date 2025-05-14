// context/LanguageContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language } from '@/utils/supabase/types';
import { getActiveLanguagesClientSide } from '@/utils/supabase/client';
import Cookies from 'js-cookie'; // Using js-cookie for easier client-side cookie management

const LANGUAGE_STORAGE_KEY = 'preferred_locale_storage'; // localStorage key
const LANGUAGE_COOKIE_KEY = 'NEXT_USER_LOCALE'; // Cookie name (matches middleware)
const DEFAULT_FALLBACK_LOCALE = 'en'; // Fallback if nothing else is found

interface LanguageContextType {
  currentLocale: string;
  setCurrentLocale: (localeCode: string) => void;
  availableLanguages: Language[];
  defaultLanguage: Language | null;
  isLoadingLanguages: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  serverLocale?: string; // Locale determined on the server
}

export const LanguageProvider = ({ children, serverLocale }: LanguageProviderProps) => {
  const [currentLocale, _setCurrentLocale] = useState<string>(serverLocale || '');
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [defaultLanguage, setDefaultLanguage] = useState<Language | null>(null);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);

  useEffect(() => {
    const fetchAndSetLanguages = async () => {
      setIsLoadingLanguages(true);
      const languages = await getActiveLanguagesClientSide();
      setAvailableLanguages(languages);
      const dbDefaultLang = languages.find(lang => lang.is_default) || languages[0] || null;
      setDefaultLanguage(dbDefaultLang);

      // Determine initial locale with priorities:
      // 1. serverLocale (already set in useState initial value if present)
      // 2. localStorage
      // 3. Cookie (though serverLocale derived from cookie should take precedence)
      // 4. Database default language
      // 5. Hardcoded fallback
      if (serverLocale && languages.some(lang => lang.code === serverLocale)) {
        _setCurrentLocale(serverLocale);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, serverLocale); // Sync localStorage
        Cookies.set(LANGUAGE_COOKIE_KEY, serverLocale, { path: '/', expires: 365 }); // Sync cookie
      } else {
        const storedLocale = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        const cookieLocale = Cookies.get(LANGUAGE_COOKIE_KEY);
        const initialLocaleToSet =
          (storedLocale && languages.some(lang => lang.code === storedLocale) ? storedLocale : null) ||
          (cookieLocale && languages.some(lang => lang.code === cookieLocale) ? cookieLocale : null) ||
          dbDefaultLang?.code ||
          DEFAULT_FALLBACK_LOCALE;

        if (languages.some(lang => lang.code === initialLocaleToSet) || initialLocaleToSet === DEFAULT_FALLBACK_LOCALE) {
          _setCurrentLocale(initialLocaleToSet);
          localStorage.setItem(LANGUAGE_STORAGE_KEY, initialLocaleToSet);
          Cookies.set(LANGUAGE_COOKIE_KEY, initialLocaleToSet, { path: '/', expires: 365 });
        } else if (languages.length > 0) {
            // Fallback if complex logic above fails, pick first available
            _setCurrentLocale(languages[0].code);
            localStorage.setItem(LANGUAGE_STORAGE_KEY, languages[0].code);
            Cookies.set(LANGUAGE_COOKIE_KEY, languages[0].code, { path: '/', expires: 365 });
        }
      }
      setIsLoadingLanguages(false);
    };

    fetchAndSetLanguages();
  }, [serverLocale]); // serverLocale is a dependency to re-sync if it changes (though unlikely for this prop)

  const setCurrentLocale = useCallback((localeCode: string) => {
    if (availableLanguages.some(lang => lang.code === localeCode) || localeCode === DEFAULT_FALLBACK_LOCALE) {
      _setCurrentLocale(localeCode);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, localeCode);
      Cookies.set(LANGUAGE_COOKIE_KEY, localeCode, { path: '/', expires: 365, sameSite: 'Lax' }); // Set cookie
    } else if (availableLanguages.length > 0 && !availableLanguages.some(lang => lang.code === localeCode)) {
        // If trying to set an unsupported locale but we have languages, revert to default or first
        const fallback = defaultLanguage?.code || availableLanguages[0]?.code || DEFAULT_FALLBACK_LOCALE;
        _setCurrentLocale(fallback);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, fallback);
        Cookies.set(LANGUAGE_COOKIE_KEY, fallback, { path: '/', expires: 365, sameSite: 'Lax' });
        console.warn(`Attempted to set unsupported locale: ${localeCode}. Reverted to ${fallback}.`);
    } else {
        console.warn(`Attempted to set unsupported locale: ${localeCode}, and no available languages loaded.`);
    }
  }, [availableLanguages, defaultLanguage]);

  // Effect to update HTML lang attribute when currentLocale changes client-side
  useEffect(() => {
    if (currentLocale) {
      document.documentElement.lang = currentLocale;
    }
  }, [currentLocale]);

  // Ensure a locale is always provided, even if briefly defaulting during loading.
  const determinedLocale = currentLocale || serverLocale || DEFAULT_FALLBACK_LOCALE;

  return (
    <LanguageContext.Provider
      value={{
        currentLocale: determinedLocale,
        setCurrentLocale,
        availableLanguages,
        defaultLanguage,
        isLoadingLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};