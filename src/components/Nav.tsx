"use client";

import { useState, useEffect } from "react";
import styles from "./Nav.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Nav() {
  const { lang } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* Check session once on mount — determines button destinations */
  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (s?.user?.email || s?.user?.id) setIsLoggedIn(true); })
      .catch(() => {});
  }, []);
  const tx = getT(lang).nav;

  return (
    <nav className={styles.nav}>
      <a className={styles.brand} href="#hero">StudentCentral</a>
      <ul className={styles.links}>
        <li><a href="#problem">{tx.whyItMatters}</a></li>
        <li><a href="#workflow">{tx.howItWorks}</a></li>
        <li><a href="#faculty">{tx.whatFacultySee}</a></li>
        <li><a href="#trust">{tx.academicIntegrity}</a></li>
        <li><a href="#institutional">{tx.forInstitutions}</a></li>
      </ul>
      <div className={styles.actions}>
        <LanguageSwitcher />
        <div className={styles.navBtnPair}>
          <a className={isLoggedIn ? styles.navLogin : styles.navGetStarted} href={isLoggedIn ? "/workspace" : "/login"}>
            {isLoggedIn ? (tx.myWorkspace ?? "My workspace") : (tx.signUp ?? "Sign up")}
          </a>
        </div>
      </div>
    </nav>
  );
}
