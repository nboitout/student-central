"use client";
import styles from "./Workflow.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

export default function Workflow() {
  const { lang } = useLanguage();
  const tx = getT(lang).workflow;
  return (
    <section id="workflow" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.eyebrow}><span className="ribbon">{tx.ribbon}</span></div>
        <h2 className={`${styles.headline} reveal`}>{tx.headline}</h2>
      </div>
      <div className={styles.steps}>
        {tx.steps.map((s, i) => (
          <div key={s.idx} className={`${styles.step} reveal ${i > 0 ? `d${i}` : ""}`}>
            <div className={styles.stepBg}>{`0${i + 1}`}</div>
            <div className={styles.stepIdx}>{s.idx}</div>
            <h3 className={styles.stepTitle}>{s.title}</h3>
            <p className="body-md">{s.body}</p>
            <div className={styles.stepBar} />
          </div>
        ))}
      </div>
    </section>
  );
}
