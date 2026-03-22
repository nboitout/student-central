"use client";
import styles from "./Faculty.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

const TILE_STYLES = [
  { accent: true,  warn: false },
  { accent: false, warn: true  },
  { accent: false, warn: false },
  { accent: false, warn: true  },
];

export default function Faculty() {
  const { lang } = useLanguage();
  const tx = getT(lang).faculty;
  return (
    <section id="faculty" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.eyebrow}><span className="ribbon">{tx.ribbon}</span></div>
          <h2 className={`${styles.headline} reveal`}>{tx.headline}</h2>
          <p className={`body-lg ${styles.sub} reveal d1`}>{tx.body}</p>
          <div className={styles.dashGrid}>
            {tx.tiles.map((tile, i) => (
              <div key={tile.label} className={styles.dashTile}>
                <div className={styles.dashLbl}>{tile.label}</div>
                <div className={`${styles.dashVal} ${TILE_STYLES[i].accent ? styles.acc : TILE_STYLES[i].warn ? styles.warn : ""}`}>
                  {tile.value}
                </div>
              </div>
            ))}
          </div>
          {tx.rows.map((r) => (
            <div key={r.label} className={styles.dashRow}>
              <span className={styles.dashRlbl}>{r.label}</span>
              <span className={styles.dashRval}>{r.value}</span>
            </div>
          ))}
        </div>
        <div className={styles.right}>
          {tx.insights.map((ins, i) => (
            <div key={ins.topic} className={`${styles.insightCard} reveal ${i > 0 ? "d1" : ""}`}>
              <div className={styles.icTopic}>{ins.topic}</div>
              <div className={styles.icTitle}>{ins.title}</div>
              <p className="body-md">{ins.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
