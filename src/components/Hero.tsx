import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.inner}>
        {/* ── Left col ── */}
        <div className={styles.left}>
          <div className={styles.eyebrow}>
            <span className="ribbon">Assessment beyond the multiple-choice score</span>
          </div>
          <h1 className={styles.h1}>
            See whether students{" "}
            <em className={styles.em}>understood</em> the answer — not just
            whether they clicked it
          </h1>
          <p className={styles.sub}>
            Student Central helps educators go beyond MCQs by combining answer
            selection with short AI-guided explanation and discussion. The
            result: a clearer view of student reasoning, misconceptions,
            confidence, and real topic mastery.
          </p>
          <div className={styles.actions}>
            <a
              className="btn-p"
              href="mailto:team@studentcentral.ai?subject=Book%20a%20Demo"
            >
              Book a demo
            </a>
            <a className="btn-s" href="#workflow">
              See how it works
            </a>
          </div>
          <div className={styles.trustStrip}>
            {[
              "Built for higher education",
              "Course-aligned assessment flows",
              "Faculty-controlled prompts and review",
              "No student data used to train public models",
            ].map((t) => (
              <div key={t} className={styles.trustItem}>
                <span className={styles.trustDot} />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right col: assessment visual ── */}
        <div className={styles.visual}>
          {/* MCQ card */}
          <div className={styles.assessCard}>
            <div className={styles.assessTopic}>Assessment moment</div>
            <div className={styles.assessQ}>
              Which of the following best explains why stablecoins reduce
              friction in cross-border payments?
            </div>
            <div className={styles.mcqOpt}>
              <span className={styles.radio} />
              Because stablecoins are pegged to fiat currencies, eliminating
              exchange rate risk entirely.
            </div>
            <div className={`${styles.mcqOpt} ${styles.selected}`}>
              <span className={styles.radio}>
                <span className={styles.radioFill} />
              </span>
              Because settlement can be faster and more programmable than
              traditional correspondent banking flows.
            </div>
            <div className={styles.mcqOpt}>
              <span className={styles.radio} />
              Because central banks are legally required to accept stablecoin
              payments.
            </div>
            <div className={styles.followup}>
              Why did you choose this option instead of the others?
            </div>
            <div className={styles.responseArea}>
              <div className={styles.sender}>Student response</div>I chose it
              because stablecoins can move directly on blockchain networks,
              which may reduce intermediaries and speed up settlement. I
              rejected the option about price stability alone because stability
              helps adoption, but does not by itself explain payment efficiency.
            </div>
          </div>

          {/* Insight panel */}
          <div className={styles.insightPanel}>
            <div className={styles.insightHdr}>Assessment signal</div>
            {[
              { label: "Answer correctness", badge: "Correct", cls: styles.bgGreen },
              { label: "Explanation quality", badge: "Strong", cls: styles.bgBlue },
              { label: "Misconception risk", badge: "Low", cls: styles.bgGray },
              { label: "Confidence of understanding", badge: "High", cls: styles.bgGreen },
            ].map(({ label, badge, cls }) => (
              <div key={label} className={styles.sigRow}>
                <span className={styles.sigLabel}>{label}</span>
                <span className={`${styles.sigBadge} ${cls}`}>{badge}</span>
              </div>
            ))}
            <div className={styles.insightDiv} />
            <div className={styles.insightSub}>Why this matters</div>
            {[
              "Distinguished mechanism from consequence",
              "Rejected distractor with valid reasoning",
              "Demonstrated transfer beyond memorized wording",
            ].map((b) => (
              <div key={b} className={styles.insightBul}>
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
