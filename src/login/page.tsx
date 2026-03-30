"use client";

import { useState, useTransition } from "react";
import { signIn } from "@/auth";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import styles from "./login.module.css";

function LoginContent() {
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/workspace";
  const verified    = params.get("verify") === "1";

  const [email,     setEmail]     = useState("");
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState("");
  const [isPending, startTransition] = useTransition();

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(async () => {
      setError("");
      const res = await signIn("resend", {
        email,
        callbackUrl,
        redirect: false,
      });
      if (res?.error) {
        setError("Could not send the link. Please try again.");
      } else {
        setSent(true);
      }
    });
  };

  return (
    <div className={styles.page}>
      {/* Left: brand panel */}
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

      {/* Right: login form */}
      <div className={styles.form}>
        <div className={styles.formInner}>

          {/* Verify email sent state */}
          {(sent || verified) ? (
            <div className={styles.verifyWrap}>
              <div className={styles.verifyIcon}>✉</div>
              <h1 className={styles.verifyTitle}>Check your email</h1>
              <p className={styles.verifySub}>
                We sent a sign-in link to <strong>{email || "your email"}</strong>.
                Click it to access your workspace — no password needed.
              </p>
              <p className={styles.verifyHint}>
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button className={styles.resendBtn} onClick={() => { setSent(false); setEmail(""); }}>
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <h1 className={styles.heading}>Sign in</h1>
              <p className={styles.sub}>
                Access your workspace and course materials.
              </p>

              {/* Google */}
              <button
                className={styles.googleBtn}
                onClick={() => signIn("google", { callbackUrl })}
                disabled={isPending}
              >
                <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className={styles.divider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerText}>or</span>
                <div className={styles.dividerLine} />
              </div>

              {/* Magic link */}
              <form onSubmit={handleEmail} className={styles.emailForm}>
                <label className={styles.emailLabel}>Email address</label>
                <input
                  className={styles.emailInput}
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
                {error && <div className={styles.errorMsg}>{error}</div>}
                <button
                  className={`${styles.emailBtn} ${isPending ? styles.emailBtnLoading : ""}`}
                  type="submit"
                  disabled={isPending || !email.trim()}
                >
                  {isPending ? "Sending…" : "Send sign-in link"}
                </button>
              </form>

              <p className={styles.legal}>
                By signing in you agree to our{" "}
                <a href="/terms" className={styles.legalLink}>Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" className={styles.legalLink}>Privacy Policy</a>.
              </p>
            </>
          )}
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
