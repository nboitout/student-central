"use client";
import styles from "./Trust.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

const ICONS = [
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M6 20v-1a6 6 0 0 1 12 0v1" /></svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  <svg key="4" viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
];

export default function Trust() {
  const { lang } = useLanguage();
  const tx = getT(lang).trust;
  return (
    <section id="trust" className={styles.section}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}><span className="ribbon">{tx.ribbon}</span></div>
          <h2 className={`${styles.headline} reveal`}>{tx.headline}</h2>
        </div>
        <div>
          <p className={`body-lg reveal d1`}>{tx.body}</p>
        </div>
      </div>
      <div className={styles.blocks}>
        {tx.blocks.map((b, i) => (
          <div key={b.title} className={`${styles.block} reveal ${i > 0 ? `d${i}` : ""}`}>
            <div className={styles.icon}>{ICONS[i]}</div>
            <div className={styles.title}>{b.title}</div>
            <p className="body-md">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
