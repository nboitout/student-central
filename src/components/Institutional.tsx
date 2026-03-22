"use client";
import styles from "./Institutional.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

export default function Institutional() {
  const { lang } = useLanguage();
  const tx = getT(lang).institutional;
  return (
    <section id="institutional" className={styles.section}>
      <div className={styles.inner}>
        <div>
          <div className={styles.eyebrow}><span className="ribbon">{tx.ribbon}</span></div>
          <h2 className={`${styles.headline} reveal`}>{tx.headline}</h2>
          <p className={`body-lg ${styles.body} reveal d1`}>{tx.body}</p>
        </div>
        <div className={styles.bullets}>
          {tx.bullets.map((b, i) => (
            <div key={b} className={`${styles.bullet} reveal ${i > 0 ? `d${Math.min(i, 4)}` : ""}`}>{b}</div>
          ))}
        </div>
      </div>
      <div className={styles.whoBand}>
        <h3 className={`${styles.whoHl} reveal`}>{tx.whoHeadline}</h3>
        <div className={styles.whoGrid}>
          {tx.who.map((w, i) => (
            <div key={w} className={`${styles.whoCard} reveal ${i > 0 ? `d${i}` : ""}`}>{w}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
