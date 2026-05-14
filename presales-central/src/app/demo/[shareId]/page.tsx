"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./entry.module.css";

interface DeckMeta {
  deckId: string;
  productName: string;
  targetPersona: string;
  status: string;
}

export default function DemoEntryPage() {
  const params  = useParams<{ shareId: string }>();
  const router  = useRouter();
  const shareId = params.shareId;

  const [deck,    setDeck]    = useState<DeckMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${shareId}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Demo not found")))
      .then(setDeck)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [shareId]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deck) return;
    setStarting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoDeckId: deck.deckId, prospectName: name.trim(), prospectEmail: email.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      const { sessionId } = await res.json();
      router.push(`/demo/${shareId}/session?sid=${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the demo. Please try again.");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <div className={styles.loadingDot} /><div className={styles.loadingDot} /><div className={styles.loadingDot} />
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>⚠</div>
          <h1 className={styles.errorTitle}>Demo not found</h1>
          <p className={styles.errorBody}>{error || "This demo link may have expired or been removed."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoDot} />
          <span className={styles.logoName}>PreSales Central</span>
        </div>

        <div className={styles.productBadge}>{deck.targetPersona || "Product demo"}</div>
        <h1 className={styles.productName}>{deck.productName}</h1>
        <p className={styles.productTagline}>
          Your personal AI pre-sales specialist will walk you through {deck.productName}, ask about your setup, and help you understand if it&apos;s a fit.
        </p>

        <form onSubmit={handleStart} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Your name *</label>
            <input
              className={styles.fieldInput}
              type="text"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Work email <span className={styles.optional}>(optional)</span></label>
            <input
              className={styles.fieldInput}
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <button
            className={styles.startBtn}
            type="submit"
            disabled={!name.trim() || starting || deck.status !== "ready"}
          >
            {starting ? "Starting…" : deck.status !== "ready" ? "Demo not ready yet" : "Start Demo →"}
          </button>
        </form>

        <p className={styles.hint}>Takes about 5 minutes · No account required</p>
      </div>
    </div>
  );
}
