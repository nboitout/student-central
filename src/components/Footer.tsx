import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>Student Central</div>
      <div className={styles.copy}>
        © 2025 Student Central. Faculty Assessment Intelligence Platform.
      </div>
    </footer>
  );
}
