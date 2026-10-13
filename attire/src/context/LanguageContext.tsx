"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Locale, translations, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslationKey;
  isAmharic: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "regal_locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && (saved === "en" || saved === "am")) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
        if (saved === "am") {
          document.documentElement.classList.add("lang-am");
        } else {
          document.documentElement.classList.remove("lang-am");
        }
      }
    } catch {
      // Ignore localStorage errors (e.g., SSR or strict cookies)
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `regal_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLocale;
      if (newLocale === "am") {
        document.documentElement.classList.add("lang-am");
      } else {
        document.documentElement.classList.remove("lang-am");
      }
    } catch {
      // Ignore write errors
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "en" ? "am" : "en");
  };

  const value = useMemo<LanguageContextType>(() => {
    return {
      locale,
      setLocale,
      toggleLocale,
      t: translations[locale] || translations.en,
      isAmharic: locale === "am",
    };
  }, [locale]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for components rendered outside provider
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      toggleLocale: () => {},
      t: translations.en,
      isAmharic: false,
    };
  }
  return context;
}
