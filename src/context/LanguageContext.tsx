"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "fr" | "de" | "es" | "el" | "it" | "nl" | "pt" | "pl" | "sv" | "da" | "fi" | "ro" | "uk" | "ru" | "hu" | "hr" | "bg" | "cs" | "sr" | "tr";

const VALID_LANGS: Lang[] = ["en","fr","de","es","el","it","nl","pt","pl","sv","da","fi","ro","uk","ru","hu","hr","bg","cs","sr","tr"];
const STORAGE_KEY = "sc_lang";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LangCtx>({ lang: "en", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && VALID_LANGS.includes(stored)) {
      setLangState(stored);
    }
  }, []);

  /* Persist every change */
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
