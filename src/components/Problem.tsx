"use client";
import styles from "./Problem.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

export default function Problem() {
  const { lang } = useLanguage();
  const tx = getT(lang).problem;
  return (
    <section id="problem" className={styles.section}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}><span className="ribbon">{tx.ribbon}</span></div>
          <h2 className={`${styles.headline} reveal`}>{tx.headline}</h2>
        </div>
        <div>
          <p className={`body-lg ${styles.body} reveal d1`}>{tx.body}</p>
        </div>
      </div>
      <div className={styles.cards}>
        {tx.cards.map((c, i) => (
          <div key={c.num} className={`${styles.card} reveal ${i > 0 ? `d${i}` : ""}`}>
            <div className={styles.num}>{c.num}</div>
            <div className={styles.title}>{c.title}</div>
            <p className="body-md">{c.body}</p>
            <div className={styles.bar} />
          </div>
        ))}
      </div>
    </section>
  );
}
