"use client";
import styles from "./Footer.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

export default function Footer() {
  const { lang } = useLanguage();
  const tx = getT(lang).footer;
  return (
    <footer className={styles.footer}>
      <div className={styles.message}>
        {tx.message}{" "}
        <a className={styles.name} href="https://www.linkedin.com/in/nicolas-boitout-phd-8677842/" target="_blank" rel="noopener noreferrer">{tx.name}</a>
        {" "}{tx.rest}
      </div>
      <div className={styles.copy}>{tx.copy}</div>
    </footer>
  );
}
