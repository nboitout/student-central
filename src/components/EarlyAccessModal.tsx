"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import styles from "./EarlyAccessModal.module.css";

interface EarlyAccessModalProps {
  open: boolean;
  onClose: () => void;
  /** Where this lead came from — recorded in the Leads sheet's `source` column. */
  source?: string;
}

export default function EarlyAccessModal({ open, onClose, source = "early-access" }: EarlyAccessModalProps) {
  const { lang } = useLanguage();
  const tx = getT(lang).hero;
  // Optional/new i18n keys not yet in every locale — read loosely with fallbacks.
  const t = tx as unknown as Record<string, string | undefined>;
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          firstName: String(data.get("firstName") ?? ""),
          lastName: String(data.get("familyName") ?? ""),
          email: String(data.get("email") ?? ""),
          lang,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setSubmitted(true);
    } catch {
      setError(t.accessError ?? "Something went wrong — please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setError("");
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
              {error && <p className={styles.accessError}>{error}</p>}
              <button className={styles.submitAccess} type="submit" disabled={sending}>
                {sending ? (t.submitting ?? "Sending…") : (tx.submitAccess ?? "Submit request")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
