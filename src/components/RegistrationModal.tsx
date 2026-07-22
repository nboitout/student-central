"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { isConsumerEmail } from "@/lib/emailDomains";
import styles from "./RegistrationModal.module.css";

type Role = "student" | "professor";

interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fills the email field from the hero/CTA teaser. */
  initialEmail?: string;
  /** Where the registration came from — recorded in the Leads sheet. */
  source?: string;
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function RegistrationModal({ open, onClose, initialEmail = "", source = "hero" }: RegistrationModalProps) {
  const { lang } = useLanguage();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { if (open) setEmail(initialEmail); }, [open, initialEmail]);

  if (!open) return null;

  const professorNeedsProEmail = role === "professor" && email.trim() !== "" && isConsumerEmail(email);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName.trim()) { setError("Please enter your first name."); return; }
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    if (role === "professor" && isConsumerEmail(email)) {
      setError("That's a personal email. Professors and trainers need an institutional address to unlock faculty access — or continue as a Student.");
      return;
    }

    setSending(true);
    setError("");
    const roleLabel = role === "professor" ? "Professor / Trainer" : "Student";
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          role: roleLabel,
          lang,
        }),
      });
    } catch {
      /* lead logging is best-effort — never block sign-in on it */
    }
    // Professors land in the faculty section; students in their workspace.
    const callbackUrl = role === "professor" ? "/faculty?from=teach" : "/workspace";
    await signIn("email-only", { email: email.trim(), callbackUrl });
  };

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <div className={styles.accessModal} role="dialog" aria-modal="true" aria-labelledby="reg-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} type="button" aria-label="Close" onClick={onClose}>X</button>

        <h2 id="reg-title" className={styles.modalTitle}>Create your account</h2>
        <p className={styles.modalCopy}>
          A few details and you&apos;re in — try StudentCentral with your own course material.
        </p>

        <form className={styles.accessForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>
              First name
              <input className={styles.fieldInput} type="text" autoComplete="given-name" value={firstName} onChange={(e) => { setFirstName(e.target.value); setError(""); }} required />
            </label>
            <label className={styles.fieldLabel}>
              Last name
              <input className={styles.fieldInput} type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>

          <div className={styles.fieldLabel} role="radiogroup" aria-label="I am a">
            I am a…
            <div className={styles.roleGroup}>
              <label className={`${styles.roleOption} ${role === "student" ? styles.roleOptionActive : ""}`}>
                <input className={styles.roleRadio} type="radio" name="role" checked={role === "student"} onChange={() => { setRole("student"); setError(""); }} />
                <span className={styles.roleText}>
                  <span className={styles.roleName}>Student</span>
                  <span className={styles.roleHint}>Any email works</span>
                </span>
              </label>
              <label className={`${styles.roleOption} ${role === "professor" ? styles.roleOptionActive : ""}`}>
                <input className={styles.roleRadio} type="radio" name="role" checked={role === "professor"} onChange={() => { setRole("professor"); setError(""); }} />
                <span className={styles.roleText}>
                  <span className={styles.roleName}>Professor / Trainer</span>
                  <span className={styles.roleHint}>Institutional email required</span>
                </span>
              </label>
            </div>
          </div>

          <label className={styles.fieldLabel}>
            {role === "professor" ? "Professional email" : "Email"}
            <input
              className={styles.fieldInput}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={role === "professor" ? "you@university.edu" : "you@example.com"}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              required
            />
          </label>

          {role === "professor" && (
            <p className={styles.proNote}>
              <span aria-hidden="true">🎓</span>
              <span>
                <strong>Faculty access needs a professional email.</strong> Use your university or organisation
                address — personal emails (Gmail, Outlook…) won&apos;t unlock the faculty tools.
              </span>
            </p>
          )}

          {(error || professorNeedsProEmail) && (
            <p className={styles.accessError}>
              {error || "That's a personal email — professors and trainers need an institutional address to unlock faculty access."}
            </p>
          )}

          <button className={styles.submitAccess} type="submit" disabled={sending}>
            {sending ? "Creating your account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
