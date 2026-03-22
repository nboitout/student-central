"use client";
import styles from "./Pedagogy.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

const ICONS = [
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
];

export default function Pedagogy() {
  const { lang } = useLanguage();
  const tx = getT(lang).pedagogy;
  return (
    <section id="pedagogy" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.eyebrow}><span className="ribbon">{tx.ribbon}</span></div>
        <h2 className={`${styles.headline} reveal`}>{tx.headline}</h2>
      </div>
      <div className={styles.cols}>
        {tx.cols.map((c, i) => (
          <div key={c.title} className={`${styles.card} reveal ${i > 0 ? `d${i}` : ""}`}>
            <div className={styles.icon}>{ICONS[i]}</div>
            <div className={styles.title}>{c.title}</div>
            <p className="body-md">{c.body}</p>
          </div>
        ))}
      </div>
      <div className={`${styles.punchStrip} reveal`}>
        <div className={styles.punchText}>{tx.punchText}</div>
        <div className={styles.punchSub}>{tx.punchSub}</div>
      </div>
    </section>
  );
}
