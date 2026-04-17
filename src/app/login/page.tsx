"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
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

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    startTransition(async () => {
      setError("");
      const result = await signIn("email-only", {
        email:    email.trim(),
        redirect: false,
      });
      if (result?.error) {
        setError("Sign-in failed — please try again.");
        return;
      }
      router.push(callbackUrl);
    });
  };

  return (
    <div className={styles.page}>
      {/* Left: brand panel — unchanged */}
      <div className={styles.brand}>
        <div className={styles.brandInner}>
          <div className={styles.logo}>
            <div className={styles.logoDot} />
            <span className={styles.logoName}>Student Central</span>
          </div>
          <div className={styles.brandTagline}>
            Reasoning-aware assessment<br />for higher education
          </div>
          <div className={styles.brandFeatures}>
            {[
              "AI-guided MCQ discussion",
              "Faculty assessment intelligence",
              "Interpretable learning signals",
              "Course-aligned evaluation",
            ].map(f => (
              <div key={f} className={styles.brandFeature}>
                <span className={styles.brandDot} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: email-only form */}
      <div className={styles.form}>
        <div className={styles.formInner}>

          <h1 className={styles.heading}>Sign in</h1>
          <p className={styles.sub}>
            Enter your email to access your workspace.
          </p>

          <form onSubmit={handleContinue} className={styles.emailForm}>
            <label className={styles.emailLabel}>Email address</label>
            <input
              className={styles.emailInput}
              type="email"
              placeholder="you@university.edu"
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
              {isPending ? "Signing in…" : "Continue"}
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
