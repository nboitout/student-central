"use client";
import styles from "./DividerBar.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

export default function DividerBar() {
  const { lang } = useLanguage();
  const items = getT(lang).divider;
  return (
    <div className={styles.bar}>
      {items.map((item, i) => (
        <span key={item} className={styles.wrapper}>
          <span className={styles.item}>{item}</span>
          {i < items.length - 1 && <span className={styles.sep} />}
        </span>
      ))}
    </div>
  );
}
