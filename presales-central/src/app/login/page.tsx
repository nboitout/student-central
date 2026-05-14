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
            Access your workspace with Google, or continue with email only.
          </p>

          <button
            className={styles.googleBtn}
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            disabled={isPending}
          >
            <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <div className={styles.dividerLine} />
          </div>

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
