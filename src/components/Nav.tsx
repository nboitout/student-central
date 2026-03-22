"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./Nav.module.css";

const LANGUAGES = [
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "fr", label: "Français",   flag: "🇫🇷" },
  { code: "de", label: "Deutsch",    flag: "🇩🇪" },
  { code: "es", label: "Español",    flag: "🇪🇸" },
  { code: "it", label: "Italiano",   flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pt", label: "Português",  flag: "🇵🇹" },
  { code: "pl", label: "Polski",     flag: "🇵🇱" },
  { code: "sv", label: "Svenska",    flag: "🇸🇪" },
  { code: "da", label: "Dansk",      flag: "🇩🇰" },
  { code: "fi", label: "Suomi",      flag: "🇫🇮" },
  { code: "ro", label: "Română",     flag: "🇷🇴" },
];

export default function Nav() {
  const [lang, setLang]       = useState(LANGUAGES[0]);
  const [open, setOpen]       = useState(false);
  const dropRef               = useRef<HTMLDivElement>(null);

  /* Close on outside click */
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
      {/* Brand */}
      <a className={styles.brand} href="#hero">Student Central</a>

      {/* Centre links */}
      <ul className={styles.links}>
        <li><a href="#problem">Why it matters</a></li>
        <li><a href="#workflow">How it works</a></li>
        <li><a href="#faculty">What faculty see</a></li>
        <li><a href="#trust">Academic integrity</a></li>
        <li><a href="#institutional">For institutions</a></li>
      </ul>

      {/* Right actions */}
      <div className={styles.actions}>

        {/* Language picker */}
        <div className={styles.langWrap} ref={dropRef}>
          <button
            className={styles.langBtn}
            onClick={() => setOpen(o => !o)}
            aria-label="Select language"
            aria-expanded={open}
          >
            <span className={styles.langFlag}>{lang.flag}</span>
            <span className={styles.langCode}>{lang.code.toUpperCase()}</span>
            <svg
              className={`${styles.langChevron} ${open ? styles.langChevronOpen : ""}`}
              width="10" height="10" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {open && (
            <div className={styles.langDropdown}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  className={`${styles.langOption} ${lang.code === l.code ? styles.langOptionActive : ""}`}
                  onClick={() => { setLang(l); setOpen(false); }}
                >
                  <span className={styles.langFlag}>{l.flag}</span>
                  <span className={styles.langOptionLabel}>{l.label}</span>
                  {lang.code === l.code && <span className={styles.langCheck}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Workspace */}
        <a className={styles.ghost} href="/workspace">My Workspace</a>

        {/* CTA */}
        <a
          className={styles.demo}
          href="https://app.stg.tutor.studentcentral.ai/login"
          target="_blank"
          rel="noopener noreferrer"
        >
          Try it
        </a>
      </div>
    </nav>
  );
}
