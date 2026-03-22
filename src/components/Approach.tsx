"use client";
import styles from "./Approach.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

const QUAD_STYLES = [
  { variant: "cg", badgeCls: "brobust", dotCls: "dc" },
  { variant: "cw", badgeCls: "bfrag",   dotCls: "dp" },
  { variant: "ig", badgeCls: "bpart",   dotCls: "dw" },
  { variant: "ic", badgeCls: "blow",    dotCls: "di" },
];

export default function Approach() {
  const { lang } = useLanguage();
  const tx = getT(lang).approach;
  return (
    <section id="approach" className={styles.section}>
      <div className={styles.inner}>
        <div>
          <div className={styles.eyebrow}><span className="ribbon">{tx.ribbon}</span></div>
          <h2 className={`${styles.headline} reveal`}>{tx.headline}</h2>
          <div className={styles.kicker}>{tx.kicker}</div>
          <p className={`body-lg reveal d1`}>{tx.body}</p>
        </div>
        <div className={styles.right}>
          <div className={`${styles.summaryCard} reveal d2`}>
            <div className={styles.summaryTitle}>{tx.summaryTitle}</div>
            {tx.summary.map((s) => (
              <div key={s.from} className={styles.sItem}>
                <div className={styles.sFrom}>{s.from}</div>
                <div className={styles.sTo}><span className={styles.sArr}>→</span>{s.to}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.quadGrid}>
        {tx.quads.map((q, i) => {
          const qs = QUAD_STYLES[i];
          return (
            <div key={q.state} className={`${styles.quad} ${styles[qs.variant as keyof typeof styles]} reveal ${i > 0 ? `d${i}` : ""}`}>
              <span className={`${styles.quadBdg} ${styles[qs.badgeCls as keyof typeof styles]}`}>{q.badge}</span>
              <div className={styles.quadTag}>
                <span className={`${styles.dot} ${styles[qs.dotCls as keyof typeof styles]}`} />
                {q.answer}
              </div>
              <div className={styles.quadState}>{q.state}</div>
              <p className="body-md">{q.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
