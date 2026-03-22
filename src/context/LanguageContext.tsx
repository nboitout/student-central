"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "en" | "fr" | "de" | "es" | "it" | "nl" | "pt" | "pl" | "sv" | "da" | "fi" | "ro";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LangCtx>({ lang: "en", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
