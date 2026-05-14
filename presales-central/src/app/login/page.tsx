"use client";

import { useState, useTransition, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

function LoginContent() {
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/workspace";
  const router      = useRouter();

  const [email,     setEmail]     = useState("");
  const [error,     setError]     = useState("");
  const [isPending, startTransition] = useTransition();

  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const PERSONAL_DOMAINS = new Set([
    "gmail.com","googlemail.com","hotmail.com","hotmail.fr","hotmail.co.uk",
    "outlook.com","outlook.fr","live.com","live.fr","yahoo.com","yahoo.fr",
    "yahoo.co.uk","icloud.com","me.com","mac.com","aol.com","protonmail.com",
    "proton.me","mail.com","gmx.com","gmx.de","msn.com","wanadoo.fr",
    "orange.fr","sfr.fr","free.fr","laposte.net","yandex.com","mail.ru",
  ]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    const domain = email.trim().toLowerCase().split("@")[1];
    if (PERSONAL_DOMAINS.has(domain)) {
      setError("Please use your professional work email address.");
      return;
    }
    startTransition(async () => {
      setError("");
      const result = await signIn("email-only", {
        email:    email.trim(),
        redirect: false,
      });
      if (result?.error) {
        setError("Access denied — your email is not on the approved list.");
        return;
      }
      router.push(callbackUrl);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <div className={styles.brandInner}>
          <div className={styles.logo}>
            <div className={styles.logoDot} />
            <span className={styles.logoName}>PreSales Central</span>
          </div>
          <div className={styles.brandTagline}>
            AI-guided demos for<br />technical sales
          </div>
          <div className={styles.brandFeatures}>
            {[
              "Guided PDF walkthroughs",
              "AI discovery questions",
              "Fit signal intelligence",
              "Session analytics for reps",
            ].map(f => (
              <div key={f} className={styles.brandFeature}>
                <span className={styles.brandDot} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.form}>
        <div className={styles.formInner}>
          <h1 className={styles.heading}>Sign in</h1>
          <p className={styles.sub}>
            Enter your professional work email to access your workspace.
          </p>

          <form onSubmit={handleContinue} className={styles.emailForm}>
            <label className={styles.emailLabel}>Email address</label>
            <input
              className={styles.emailInput}
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              required
              autoComplete="email"
              autoFocus
            />
            {error && <div className={styles.errorMsg}>{error}</div>}
            <button
              className={`${styles.emailBtn} ${isPending ? styles.emailBtnLoading : ""}`}
              type="submit"
              disabled={isPending || !isValidEmail(email)}
            >
              {isPending ? "Signing in..." : "Continue with email"}
            </button>
          </form>

          <p className={styles.legal}>
            By signing in you agree to our{" "}
            <a href="/terms" className={styles.legalLink}>Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className={styles.legalLink}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
