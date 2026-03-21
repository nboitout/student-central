import styles from "./Nav.module.css";

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <a className={styles.brand} href="#hero">
        Student Central
      </a>
      <ul className={styles.links}>
        <li><a href="#problem">Why it matters</a></li>
        <li><a href="#workflow">How it works</a></li>
        <li><a href="#faculty">What faculty see</a></li>
        <li><a href="#trust">Academic integrity</a></li>
        <li><a href="#institutional">For institutions</a></li>
      </ul>
      <div className={styles.actions}>
        <a className={styles.ghost} href="#workflow">See the workflow</a>
        <a
          className={styles.demo}
          href="https://app.stg.tutor.studentcentral.ai/login"
          target="_blank"
          rel="noopener noreferrer"
        >
          Try it
        </a>
      </div>
    </nav>
  );
}
