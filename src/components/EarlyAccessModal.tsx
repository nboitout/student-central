"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import styles from "./EarlyAccessModal.module.css";

interface EarlyAccessModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EarlyAccessModal({ open, onClose }: EarlyAccessModalProps) {
  const { lang } = useLanguage();
  const tx = getT(lang).hero;
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={handleClose}>
      <div className={styles.accessModal} role="dialog" aria-modal="true" aria-labelledby="access-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} type="button" aria-label="Close early access form" onClick={handleClose}>
          X
        </button>
        {submitted ? (
          <div className={styles.accessSuccess}>
            <h2 id="access-title" className={styles.modalTitle}>{tx.accessSuccessTitle ?? "Request received"}</h2>
            <p className={styles.modalCopy}>{tx.accessSuccessBody ?? "Thank you. We will get back to you soon."}</p>
          </div>
        ) : (
          <>
            <h2 id="access-title" className={styles.modalTitle}>{tx.accessTitle ?? "Request early access"}</h2>
            <p className={styles.modalCopy}>{tx.accessBody ?? "Tell us who you are and we will follow up."}</p>
            <form className={styles.accessForm} onSubmit={handleSubmit}>
              <label className={styles.fieldLabel}>
                {tx.firstName ?? "First name"}
                <input className={styles.fieldInput} name="firstName" type="text" autoComplete="given-name" required />
              </label>
              <label className={styles.fieldLabel}>
                {tx.familyName ?? "Family name"}
                <input className={styles.fieldInput} name="familyName" type="text" autoComplete="family-name" required />
              </label>
              <label className={styles.fieldLabel}>
                {tx.email ?? "Email"}
                <input className={styles.fieldInput} name="email" type="email" autoComplete="email" required />
              </label>
              <button className={styles.submitAccess} type="submit">
                {tx.submitAccess ?? "Submit request"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
