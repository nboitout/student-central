import styles from "./Workflow.module.css";

const STEPS = [
  {
    idx: "Step 01",
    title: "Start from an MCQ",
    body: "Faculty upload or author multiple-choice questions aligned with course objectives.",
  },
  {
    idx: "Step 02",
    title: 'Capture the "why"',
    body: "After each response, the student is prompted to justify their choice, contrast alternatives, or explain the concept in their own words.",
  },
  {
    idx: "Step 03",
    title: "Analyze reasoning",
    body: "Student Central evaluates the explanation against course-grounded expectations: conceptual accuracy, option distinction, presence of misconceptions, depth of reasoning.",
  },
  {
    idx: "Step 04",
    title: "Generate actionable insight",
    body: "Faculty see not only who got the question right or wrong, but where reasoning is solid, fragile, or confused across topics, cohorts, and assessments.",
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
          A simple workflow for faculty, a deeper signal for learning
        </h2>
      </div>

      <div className={styles.steps}>
        {STEPS.map((s, i) => (
          <div
            key={s.idx}
            className={`${styles.step} reveal ${i > 0 ? `d${i}` : ""}`}
          >
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
