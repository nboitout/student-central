"use client";
import styles from "./CTA.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

export default function CTA() {
  const { lang } = useLanguage();
  const tx = getT(lang).cta;
  return (
    <section id="cta" className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.headline}>
          {tx.h2a}{" "}<em className={styles.em}>{tx.h2em}</em>
        </h2>
        <p className={styles.sub}>{tx.sub}</p>
        <div className={styles.actions}>
          <a className={styles.primary} href="https://app.stg.tutor.studentcentral.ai/login" target="_blank" rel="noopener noreferrer">{tx.primary}</a>
          <a className={styles.ghost} href="mailto:team@studentcentral.ai">{tx.ghost}</a>
        </div>
      </div>
    </section>
  );
}
