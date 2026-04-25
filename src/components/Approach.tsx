"use client";
import styles from "./Approach.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

const COMPARISON_ROWS = [
  { assistant: "Provides answers", tutor: "Asks questions" },
  {
    assistant: "Reactive",
    assistantNote: "Waits for user input",
    tutor: "Proactive",
    tutorNote: "Initiates interactions",
  },
  { assistant: "Task-oriented", tutor: "Learning plan" },
  { assistant: "Optimizes for speed", tutor: "Optimizes for learning" },
  { assistant: "Solves the problem", tutor: "Teaches" },
];

export default function Approach() {
  const { lang } = useLanguage();
  const tx = getT(lang).approach;

  return (
    <section id="approach" className={styles.section}>
      <div className={styles.insight}>
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}><span className="ribbon">{tx.ribbon}</span></div>
            <h2 className={`${styles.headline} reveal`}>
              What&apos;s the difference with ChatGPT?
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
          <span className={styles.dividerText}>AI assistant vs AI tutor</span>
          <div className={styles.dividerLine} />
        </div>

        <div className={`${styles.tableWrapper} reveal d2`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.colHeader} ${styles.colAssistant}`}>
                  <span>AI</span> Assistant
                </th>
                <th className={`${styles.colHeader} ${styles.colTutor}`}>
                  <span>AI</span> Tutor
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
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
            <div className={styles.footerLeft}>ChatGPT</div>
            <div className={styles.footerRight}>
              StudentCentral provides live feedback to professors
              <span>Real-time learning signals</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
