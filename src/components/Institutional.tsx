import styles from "./Institutional.module.css";

const BULLETS = [
  "Works with existing assessment habits",
  "Adds richer evidence without requiring full essay grading",
  "Supports pilot programs in high-enrollment courses",
  "Generates aggregate insight for curriculum improvement",
  "Helps departments explore AI-enhanced assessment responsibly",
];

const WHO = [
  "Professors running large undergraduate courses",
  "Departments piloting AI-enhanced assessment",
  "Programs focused on learning quality and retention",
  "Institutions exploring authentic evidence of mastery",
];

export default function Institutional() {
  return (
    <section id="institutional" className={styles.section}>
      <div className={styles.inner}>
        {/* Left */}
        <div>
          <div className={styles.eyebrow}>
            <span className="ribbon">For Departments &amp; Institutions</span>
          </div>
          <h2 className={`${styles.headline} reveal`}>
            A scalable way to enrich assessment without abandoning familiar
            formats
          </h2>
          <p className={`body-lg ${styles.body} reveal d1`}>
            Most institutions will not replace MCQs overnight. Student Central
            offers a practical path forward: keep the efficiency and
            comparability of selected-response assessment, while adding a
            structured layer that captures reasoning, misconception patterns,
            and depth of understanding.
          </p>
        </div>

        {/* Right: bullets */}
        <div className={styles.bullets}>
          {BULLETS.map((b, i) => (
            <div
              key={b}
              className={`${styles.bullet} reveal ${i > 0 ? `d${Math.min(i, 4)}` : ""}`}
            >
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* Who it's for */}
      <div className={styles.whoBand}>
        <h3 className={`${styles.whoHl} reveal`}>
          Built for educators who want more than a percentage score
        </h3>
        <div className={styles.whoGrid}>
          {WHO.map((w, i) => (
            <div
              key={w}
              className={`${styles.whoCard} reveal ${i > 0 ? `d${i}` : ""}`}
            >
              {w}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
