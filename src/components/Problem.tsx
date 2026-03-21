import styles from "./Problem.module.css";

const CARDS = [
  {
    num: "01",
    title: "Correct does not always mean understood",
    body: "Students can land on the right option for the wrong reason.",
  },
  {
    num: "02",
    title: "Wrong does not always mean lost",
    body: "Some incorrect answers still reveal partial mastery worth building on.",
  },
  {
    num: "03",
    title: "Faculty need more than a score",
    body: "To teach effectively, instructors need to see misconceptions, not just outcomes.",
  },
];

export default function Problem() {
  return (
    <section id="problem" className={styles.section}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <span className="ribbon">Why traditional MCQs are not enough</span>
          </div>
          <h2 className={`${styles.headline} reveal`}>
            A correct answer is not always evidence of understanding
          </h2>
        </div>
        <div>
          <p className={`body-lg ${styles.body} reveal d1`}>
            Multiple-choice questions are efficient, scalable, and familiar. But
            they mainly capture the final selection, not the reasoning behind it.
            A student may answer correctly through guessing, pattern recognition,
            or partial recall. Another may answer incorrectly while showing
            strong partial understanding. Traditional scoring rarely captures
            that difference.
          </p>
        </div>
      </div>

      <div className={styles.cards}>
        {CARDS.map((c, i) => (
          <div key={c.num} className={`${styles.card} reveal ${i > 0 ? `d${i}` : ""}`}>
            <div className={styles.num}>{c.num}</div>
            <div className={styles.title}>{c.title}</div>
            <p className="body-md">{c.body}</p>
            <div className={styles.bar} />
          </div>
        ))}
      </div>
    </section>
  );
}
