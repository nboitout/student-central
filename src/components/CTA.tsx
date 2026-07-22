"use client";
import { useState, useEffect, useTransition } from "react";
import type { FormEvent } from "react";
import { signIn } from "next-auth/react";
import styles from "./CTA.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import EarlyAccessModal from "./EarlyAccessModal";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function CTA() {
  const { lang } = useLanguage();
  const tx = getT(lang).cta;
  // Optional/new i18n keys not yet in every locale — read loosely with fallbacks.
  const t = tx as unknown as Record<string, string | undefined>;
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (s?.user?.email || s?.user?.id) setIsLoggedIn(true); })
      .catch(() => {});
  }, []);

  const handleEmailFirst = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setEmailErr(t.emailInvalid ?? "Please enter a valid email address.");
      return;
    }
    startTransition(async () => {
      setEmailErr("");
      await signIn("email-only", { email: email.trim(), callbackUrl: "/workspace" });
    });
  };

  return (
    <section id="cta" className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.headline}>
          {tx.h2a}{" "}<em className={styles.em}>{tx.h2em}</em>
        </h2>
        <p className={styles.sub}>{tx.sub}</p>
        {isLoggedIn ? (
          <div className={styles.actions}>
            <a className={styles.primary} href="/workspace">{tx.myWorkspace ?? "My Workspace"}</a>
            <button className={styles.ghost} type="button" onClick={() => setShowAccessForm(true)}>
              {t.refer ?? "Refer a colleague"}
            </button>
          </div>
        ) : (
          <>
            <form className={styles.emailCta} onSubmit={handleEmailFirst} noValidate>
              <input
                className={styles.emailField}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t.emailPlaceholder ?? "you@university.edu"}
                aria-label="Email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }}
                required
              />
              <button className={styles.primary} type="submit" disabled={isPending}>
                {isPending ? "…" : (t.getAccess ?? tx.primary ?? "Get early access")}
              </button>
            </form>
            {emailErr && <p className={styles.emailErr}>{emailErr}</p>}
          </>
        )}
      </div>
      <EarlyAccessModal open={showAccessForm} onClose={() => setShowAccessForm(false)} source="referral" />
    </section>
  );
}
