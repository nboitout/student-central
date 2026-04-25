"use client";
import { useState } from "react";
import styles from "./CTA.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import EarlyAccessModal from "./EarlyAccessModal";

export default function CTA() {
  const { lang } = useLanguage();
  const tx = getT(lang).cta;
  const [showAccessForm, setShowAccessForm] = useState(false);
  return (
    <section id="cta" className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.headline}>
          {tx.h2a}{" "}<em className={styles.em}>{tx.h2em}</em>
        </h2>
        <p className={styles.sub}>{tx.sub}</p>
        <div className={styles.actions}>
          <a className={styles.primary} href="/login">{tx.primary}</a>
          <button className={styles.ghost} type="button" onClick={() => setShowAccessForm(true)}>
            {tx.secondary ?? tx.myWorkspace ?? "My Workspace"}
          </button>
        </div>
      </div>
      <EarlyAccessModal open={showAccessForm} onClose={() => setShowAccessForm(false)} />
    </section>
  );
}
