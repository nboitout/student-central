"use client";
import styles from "./Approach.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

export default function Approach() {
  const { lang } = useLanguage();
  const tx = getT(lang).approach;
  const comparisonRows = tx.comparisonRows as ReadonlyArray<{
    assistant: string;
    assistantNote?: string;
    tutor: string;
    tutorNote?: string;
  }>;

  return (
    <section id="approach" className={styles.section}>
      <div className={styles.insight}>
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}><span className="ribbon">{tx.ribbon}</span></div>
            <h2 className={`${styles.headline} reveal`}>
              {tx.insightHeadline}
            </h2>
          </div>
          <div>
            <p className={`${styles.sub} reveal d1`}>
              {tx.body}
            </p>
          </div>
        </div>

        <div className={`${styles.dividerLabel} reveal d1`}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>{tx.dividerText}</span>
          <div className={styles.dividerLine} />
        </div>

        <div className={`${styles.tableWrapper} reveal d2`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.colHeader} ${styles.colAssistant}`}>
                  {tx.assistantLabel}
                </th>
                <th className={`${styles.colHeader} ${styles.colTutor}`}>
                  {tx.tutorLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={`${row.assistant}-${row.tutor}`}>
                  <td className={styles.leftCell}>
                    {row.assistant}
                    {row.assistantNote && <span className={styles.subNote}>{row.assistantNote}</span>}
                  </td>
                  <td className={styles.rightCell}>
                    {row.tutor}
                    {row.tutorNote && <span className={styles.subNote}>{row.tutorNote}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.footer}>
            <div className={styles.footerLeft}>{tx.footerLeft}</div>
            <div className={styles.footerRight}>
              {tx.footerRight}
              <span>{tx.footerTag}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
