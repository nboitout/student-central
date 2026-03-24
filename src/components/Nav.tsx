"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./Nav.module.css";
import { useLanguage, type Lang } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "fr", label: "Français",   flag: "🇫🇷" },
  { code: "de", label: "Deutsch",    flag: "🇩🇪" },
  { code: "es", label: "Español",    flag: "🇪🇸" },
  { code: "el", label: "Ελληνικά",  flag: "🇬🇷" },
  { code: "it", label: "Italiano",   flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pt", label: "Português",  flag: "🇵🇹" },
  { code: "pl", label: "Polski",     flag: "🇵🇱" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "ru", label: "Русский",    flag: "🇷🇺" },
  { code: "hu", label: "Magyar",     flag: "🇭🇺" },
  { code: "hr", label: "Hrvatski",   flag: "🇭🇷" },
  { code: "sv", label: "Svenska",    flag: "🇸🇪" },
  { code: "da", label: "Dansk",      flag: "🇩🇰" },
  { code: "fi", label: "Suomi",      flag: "🇫🇮" },
  { code: "ro", label: "Română",     flag: "🇷🇴" },
];

export default function Nav() {
  const { lang, setLang } = useLanguage();
  const tx = getT(lang).nav;
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const currentLang = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className={styles.nav}>
      <a className={styles.brand} href="#hero">Student Central</a>
      <ul className={styles.links}>
        <li><a href="#problem">{tx.whyItMatters}</a></li>
        <li><a href="#workflow">{tx.howItWorks}</a></li>
        <li><a href="#faculty">{tx.whatFacultySee}</a></li>
        <li><a href="#trust">{tx.academicIntegrity}</a></li>
        <li><a href="#institutional">{tx.forInstitutions}</a></li>
      </ul>
      <div className={styles.actions}>
        <div className={styles.langWrap} ref={dropRef}>
          <button className={styles.langBtn} onClick={() => setOpen(o => !o)} aria-label="Select language" aria-expanded={open}>
            <span className={styles.langFlag}>{currentLang.flag}</span>
            <span className={styles.langCode}>{currentLang.code.toUpperCase()}</span>
            <svg className={`${styles.langChevron} ${open ? styles.langChevronOpen : ""}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {open && (
            <div className={styles.langDropdown}>
              {LANGUAGES.map(l => (
                <button key={l.code} className={`${styles.langOption} ${lang === l.code ? styles.langOptionActive : ""}`} onClick={() => { setLang(l.code); setOpen(false); }}>
                  <span className={styles.langFlag}>{l.flag}</span>
                  <span className={styles.langOptionLabel}>{l.label}</span>
                  {lang === l.code && <span className={styles.langCheck}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <a className={styles.demo} href="/workspace">{tx.tryIt}</a>
      </div>
    </nav>
  );
}
