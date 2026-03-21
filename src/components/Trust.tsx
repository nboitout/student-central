import styles from "./Trust.module.css";

const BLOCKS = [
  {
    title: "Course-grounded evaluation",
    body: "Assessment prompts and interpretation can be aligned to faculty expectations and course language.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Faculty control",
    body: "Educators define the question flows, acceptable reasoning patterns, and review process.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-1a6 6 0 0 1 12 0v1" />
      </svg>
    ),
  },
  {
    title: "Transparent assessment logic",
    body: "The platform surfaces why an explanation appears strong, partial, or weak — not just the final classification.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    title: "Privacy-conscious deployment",
    body: "Student data stays within institutionally appropriate boundaries and is not used to train public models.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--on-tertiary-fixed)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];

export default function Trust() {
  return (
    <section id="trust" className={styles.section}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <span className="ribbon">Academic Integrity &amp; Trust</span>
          </div>
          <h2 className={`${styles.headline} reveal`}>
            Designed for serious academic use, not generic AI chat
          </h2>
        </div>
        <div>
          <p className={`body-lg reveal d1`}>
            The platform speaks directly to governance, rollout, privacy
            posture, and evidence expectations for university stakeholders.
          </p>
        </div>
      </div>

      <div className={styles.blocks}>
        {BLOCKS.map((b, i) => (
          <div key={b.title} className={`${styles.block} reveal ${i > 0 ? `d${i}` : ""}`}>
            <div className={styles.icon}>{b.icon}</div>
            <div className={styles.title}>{b.title}</div>
            <p className="body-md">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
