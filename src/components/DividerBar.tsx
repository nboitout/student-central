import styles from "./DividerBar.module.css";

const ITEMS = [
  "Reasoning-Aware Assessment",
  "Misconception Detection",
  "Faculty Assessment Intelligence",
  "Interpretable Learning Signals",
  "Course-Aligned Explanation Analysis",
];

export default function DividerBar() {
  return (
    <div className={styles.bar}>
      {ITEMS.map((item, i) => (
        <span key={item} className={styles.wrapper}>
          <span className={styles.item}>{item}</span>
          {i < ITEMS.length - 1 && <span className={styles.sep} />}
        </span>
      ))}
    </div>
  );
}
