import styles from "./Approach.module.css";

const SUMMARY = [
  { from: "Correct + strong explanation", to: "Likely robust understanding" },
  { from: "Correct + weak explanation",   to: "Possible guess or fragile knowledge" },
  { from: "Incorrect + partial explanation", to: "Misconception worth targeted feedback" },
  { from: "Incorrect + confused explanation", to: "Low mastery, requiring deeper support" },
];

const QUADS = [
  {
    variant: "cg",
    badge: "Robust", badgeCls: "brobust",
    dotCls: "dc", answer: "Correct",
    state: "Correct + Strong Explanation",
    body: "Likely robust understanding. Student demonstrates command of the concept beyond the selected option.",
  },
  {
    variant: "cw",
    badge: "Fragile", badgeCls: "bfrag",
    dotCls: "dp", answer: "Correct",
    state: "Correct + Weak Explanation",
    body: "Possible guess, pattern recognition, or fragile knowledge. Success may not survive context-switching.",
  },
  {
    variant: "ig",
    badge: "Partial", badgeCls: "bpart",
    dotCls: "dw", answer: "Incorrect",
    state: "Incorrect + Partial Explanation",
    body: "Misconception or incomplete model. Worth targeted feedback — there is a foundation to build on.",
  },
  {
    variant: "ic",
    badge: "Low mastery", badgeCls: "blow",
    dotCls: "di", answer: "Incorrect",
    state: "Incorrect + Confused Explanation",
    body: "Low mastery. Requires deeper instructional support rather than simple correction.",
  },
];

export default function Approach() {
  return (
    <section id="approach" className={styles.section}>
      <div className={styles.inner}>
        {/* Left */}
        <div>
          <div className={styles.eyebrow}>
            <span className="ribbon">Our Approach</span>
          </div>
          <h2 className={`${styles.headline} reveal`}>
            Student Central turns MCQs into reasoning-aware assessment
          </h2>
          <div className={styles.kicker}>
            From answer selection to evidence of reasoning
          </div>
          <p className={`body-lg reveal d1`}>
            After each selected answer, Student Central invites the learner to
            explain their choice, compare it with alternative options, and
            articulate the underlying concept. AI then helps classify the
            quality of the reasoning so educators can distinguish real
            understanding from fragile success.
          </p>
        </div>

        {/* Right: summary card */}
        <div className={styles.right}>
          <div className={`${styles.summaryCard} reveal d2`}>
            <div className={styles.summaryTitle}>Four assessment outcome states</div>
            {SUMMARY.map((s) => (
              <div key={s.from} className={styles.sItem}>
                <div className={styles.sFrom}>{s.from}</div>
                <div className={styles.sTo}>
                  <span className={styles.sArr}>→</span>
                  {s.to}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quadrant grid */}
      <div className={styles.quadGrid}>
        {QUADS.map((q, i) => (
          <div
            key={q.state}
            className={`${styles.quad} ${styles[q.variant as keyof typeof styles]} reveal ${i > 0 ? `d${i}` : ""}`}
          >
            <span className={`${styles.quadBdg} ${styles[q.badgeCls as keyof typeof styles]}`}>
              {q.badge}
            </span>
            <div className={styles.quadTag}>
              <span className={`${styles.dot} ${styles[q.dotCls as keyof typeof styles]}`} />
              {q.answer}
            </div>
            <div className={styles.quadState}>{q.state}</div>
            <p className="body-md">{q.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
