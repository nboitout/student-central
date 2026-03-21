import styles from "./CTA.module.css";

export default function CTA() {
  return (
    <section id="cta" className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.headline}>
          MCQs tell you what students selected. Student Central helps you see{" "}
          <em className={styles.em}>what they understood.</em>
        </h2>
        <p className={styles.sub}>
          Bring reasoning, misconception detection, and richer mastery signals
          into your existing assessment workflow.
        </p>
        <div className={styles.actions}>
          <a
            className={styles.primary}
            href="mailto:team@studentcentral.ai?subject=Book%20a%20Demo"
          >
            Book a demo
          </a>
          <a
            className={styles.ghost}
            href="mailto:team@studentcentral.ai"
          >
            Talk to the team
          </a>
        </div>
      </div>
    </section>
  );
}
