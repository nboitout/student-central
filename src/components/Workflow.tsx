import styles from "./Workflow.module.css";

const STEPS = [
  {
    num: "01",
    idx: "Step 01",
    title: "Complete the MCQ",
    body: "Students first go through a full multiple-choice assessment, just as they would in a traditional exam.",
    bullets: [
      "No interruption",
      "No explanation required yet",
      "Focus on answering",
    ],
    insight: "This preserves exam realism, cognitive flow, and unbiased response patterns.",
  },
  {
    num: "02",
    idx: "Step 02",
    title: "Reflect on selected answers",
    body: "Once the MCQ is completed, Student Central initiates a structured discussion. Instead of asking \u201cwhy\u201d immediately, the system revisits selected answers, asks students to explain their reasoning, and prompts comparison with alternative options.",
    bullets: [],
    insight: "This is where the real signal begins.",
  },
  {
    num: "03",
    idx: "Step 03",
    title: "Probe and refine reasoning",
    body: "The system does not stop at a single explanation. It engages the student through short follow-ups to clarify vague reasoning, test conceptual understanding, and surface hidden misconceptions.",
    bullets: [],
    insight: "This transforms explanations into observable reasoning.",
  },
  {
    num: "04",
    idx: "Step 04",
    title: "Generate an assessment signal",
    body: "Student Central combines answer correctness, explanation quality, and reasoning consistency to produce a structured view of understanding.",
    bullets: [
      "Strong understanding",
      "Fragile knowledge",
      "Partial misconception",
      "Misunderstanding",
    ],
    insight: "Not just a score \u2014 a diagnosis.",
  },
  {
    num: "05",
    idx: "Step 05",
    title: "Deliver actionable insight to educators",
    body: "Educators gain a clear view of who understood vs guessed, which misconceptions persist, where reasoning breaks down, and how confidence aligns with actual understanding.",
    bullets: [
      "Better feedback",
      "Targeted remediation",
      "Informed course adjustment",
    ],
    insight: null,
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className="ribbon">How it works</span>
        </div>
        <h2 className={`${styles.headline} reveal`}>
          From answer selection to reasoning analysis
        </h2>
      </div>

      {/* Row 1: steps 1–3 */}
      <div className={styles.stepsRow}>
        {STEPS.slice(0, 3).map((s, i) => (
          <div
            key={s.idx}
            className={`${styles.step} reveal ${i > 0 ? `d${i}` : ""}`}
          >
            <div className={styles.stepBg}>{s.num}</div>
            <div className={styles.stepIdx}>{s.idx}</div>
            <h3 className={styles.stepTitle}>{s.title}</h3>
            <p className="body-md">{s.body}</p>
            {s.bullets.length > 0 && (
              <ul className={styles.stepBullets}>
                {s.bullets.map((b) => (
                  <li key={b} className={styles.stepBullet}>{b}</li>
                ))}
              </ul>
            )}
            {s.insight && (
              <div className={styles.stepInsight}>{s.insight}</div>
            )}
            <div className={styles.stepBar} />
          </div>
        ))}
      </div>

      {/* Row 2: steps 4–5 */}
      <div className={styles.stepsRowWide}>
        {STEPS.slice(3).map((s, i) => (
          <div
            key={s.idx}
            className={`${styles.step} ${styles.stepWide} reveal ${i > 0 ? "d1" : ""}`}
          >
            <div className={styles.stepBg}>{s.num}</div>
            <div className={styles.stepIdx}>{s.idx}</div>
            <h3 className={styles.stepTitle}>{s.title}</h3>
            <p className="body-md">{s.body}</p>
            {s.bullets.length > 0 && (
              <ul className={styles.stepBullets}>
                {s.bullets.map((b) => (
                  <li key={b} className={styles.stepBullet}>{b}</li>
                ))}
              </ul>
            )}
            {s.insight && (
              <div className={styles.stepInsight}>{s.insight}</div>
            )}
            <div className={styles.stepBar} />
          </div>
        ))}
      </div>
    </section>
  );
}
