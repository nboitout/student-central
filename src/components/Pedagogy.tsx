import styles from "./Pedagogy.module.css";

const COLS = [
  {
    title: "More valid assessment",
    body: "Measure understanding more credibly than answer selection alone. Capture the reasoning, not just the outcome.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: "Better formative feedback",
    body: "Detect whether a student needs reassurance, correction, or conceptual rebuilding — before the summative assessment.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    title: "Better course improvement",
    body: "See where items are misleading, where misconceptions persist, and where teaching may need reinforcement.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6"  y1="20" x2="6"  y2="14" />
      </svg>
    ),
  },
];

export default function Pedagogy() {
  return (
    <section id="pedagogy" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className="ribbon">Pedagogical Value</span>
        </div>
        <h2 className={`${styles.headline} reveal`}>
          Better assessment, better feedback, better teaching decisions
        </h2>
      </div>

      <div className={styles.cols}>
        {COLS.map((c, i) => (
          <div key={c.title} className={`${styles.card} reveal ${i > 0 ? `d${i}` : ""}`}>
            <div className={styles.icon}>{c.icon}</div>
            <div className={styles.title}>{c.title}</div>
            <p className="body-md">{c.body}</p>
          </div>
        ))}
      </div>

      <div className={`${styles.punchStrip} reveal`}>
        <div className={styles.punchText}>
          Student Central does not replace MCQs. It makes them more meaningful.
        </div>
        <div className={styles.punchSub}>Discussion-Enhanced MCQ Evaluation</div>
      </div>
    </section>
  );
}
