import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.message}>
        Built by{" "}
        <a
          className={styles.name}
          href="https://www.linkedin.com/in/nicolas-boitout-phd-8677842/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nicolas Boitout
        </a>
        {" "}and a Franco-Romanian team passionate about learning
      </div>
      <div className={styles.copy}>
        © 2025 Student Central
      </div>
    </footer>
  );
}
