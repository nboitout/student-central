"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "fr" | "de" | "es" | "it" | "nl" | "pt" | "pl" | "sv" | "da" | "fi" | "ro";

const VALID_LANGS: Lang[] = ["en","fr","de","es","it","nl","pt","pl","sv","da","fi","ro"];
const STORAGE_KEY = "sc_lang";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LangCtx>({ lang: "en", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  /* Read from localStorage on first render (client only) */
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return stored && VALID_LANGS.includes(stored) ? stored : "en";
  });

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
