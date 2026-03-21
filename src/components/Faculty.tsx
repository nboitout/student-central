import styles from "./Faculty.module.css";

const TILES = [
  { label: "Questions answered this week", value: "247", accent: true },
  { label: "Correct-but-fragile responses",  value: "31",  warn: true },
  { label: "Strong explanations by topic",   value: "68%", accent: false },
  { label: "Students needing follow-up",     value: "14",  warn: true },
];

const ROWS = [
  {
    label: "Topics with highest misconception rate",
    value: "Regression models · Stablecoin settlement",
  },
  {
    label: "Distractors most frequently defended incorrectly",
    value: "View full report →",
  },
];

const INSIGHTS = [
  {
    topic: "Topic: Regression vs Classification",
    title: "Students identify the right model — but can't explain the decision rule",
    body: "Students often identify the correct model when examples are obvious, but struggle to articulate the decision rule when variables or outcomes become ambiguous. The gap appears in justification, not in selection.",
  },
  {
    topic: "Topic: Stablecoin Settlement",
    title: "Confusing price stability with payment efficiency",
    body: "Students recognize speed and programmability language, but frequently confuse price stability with payment efficiency — a recurring misconception that answer selection alone would never surface.",
  },
];

export default function Faculty() {
  return (
    <section id="faculty" className={styles.section}>
      <div className={styles.inner}>
        {/* Left: dashboard */}
        <div className={styles.left}>
          <div className={styles.eyebrow}>
            <span className="ribbon">Faculty Visibility</span>
          </div>
          <h2 className={`${styles.headline} reveal`}>
            Move from grades and percentages to interpretable learning signals
          </h2>
          <p className={`body-lg ${styles.sub} reveal d1`}>
            Student Central gives instructors a more usable picture of student
            understanding. Instead of seeing only item success rates, they can
            inspect how students justify answers, where distractors remain
            attractive, and which misconceptions cluster around specific concepts.
          </p>

          <div className={styles.dashGrid}>
            {TILES.map((t) => (
              <div key={t.label} className={styles.dashTile}>
                <div className={styles.dashLbl}>{t.label}</div>
                <div
                  className={`${styles.dashVal} ${
                    t.accent ? styles.acc : t.warn ? styles.warn : ""
                  }`}
                >
                  {t.value}
                </div>
              </div>
            ))}
          </div>

          {ROWS.map((r) => (
            <div key={r.label} className={styles.dashRow}>
              <span className={styles.dashRlbl}>{r.label}</span>
              <span className={styles.dashRval}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Right: insight examples */}
        <div className={styles.right}>
          {INSIGHTS.map((ins, i) => (
            <div
              key={ins.topic}
              className={`${styles.insightCard} reveal ${i > 0 ? "d1" : ""}`}
            >
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
