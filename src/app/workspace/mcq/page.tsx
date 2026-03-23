"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./mcq.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import { evaluateReasoning, type MCQQuestion, type ReasoningSignal } from "@/lib/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";

import dynamic from "next/dynamic";

const LETTERS = ["A", "B", "C", "D"];
type Screen = "loading" | "waiting" | "question" | "explanation" | "result";

function MCQContent() {
  const params      = useSearchParams();
  const router      = useRouter();
  const { lang }    = useLanguage();
  const ui          = getT(lang).mcq;
  const courseId    = params.get("id") ?? "";
  const courseTitle = decodeURIComponent(params.get("title") ?? "Course");
  const pdfUrl      = decodeURIComponent(params.get("pdf") ?? "");

  const [screen,       setScreen]       = useState<Screen>("loading");
  const [mcq,          setMcq]          = useState<MCQQuestion | null>(null);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [selected,     setSelected]     = useState<number | null>(null);
  const [submitted,    setSubmitted]    = useState(false);
  const [explanation,  setExplanation]  = useState("");
  const [signal,       setSignal]       = useState<ReasoningSignal | null>(null);
  const [evaluating,   setEvaluating]   = useState(false);
  const [evalError,    setEvalError]    = useState<string | null>(null);

  /* Load MCQ from API */
  const loadMCQ = () => {
    setScreen("loading");
    setMcq(null);
    setLoadError(null);

    fetch(`${API_URL}/api/mcq/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, pdfUrl: pdfUrl || undefined, courseTitle }),
    })
      .then(async (res) => {
        /* 202 — generation kicked off but not ready yet, poll again */
        if (res.status === 202) {
          setScreen("waiting");
          setTimeout(() => loadMCQ(), 10000);
          return;
        }
        /* Any other non-OK response */
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
          setLoadError(err.detail ?? `Error ${res.status}`);
          setScreen("question");
          return;
        }
        const q: MCQQuestion = await res.json();
        setMcq(q);
        setScreen("question");
      })
      .catch(err => {
        setLoadError(err.message);
        setScreen("question");
      });
  };

  useEffect(() => { loadMCQ(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* After submit, brief delay before moving to explanation screen */
  useEffect(() => {
    if (submitted) {
      const t = setTimeout(() => setScreen("explanation"), 400);
      return () => clearTimeout(t);
    }
  }, [submitted]);

  const handleSubmit = () => { if (selected === null) return; setSubmitted(true); };

  const handleEvaluate = async () => {
    if (!mcq || selected === null || explanation.trim().length < 10) return;
    setEvaluating(true); setEvalError(null);
    try {
      const result = await evaluateReasoning({
        courseId,
        question: mcq.question,
        options: mcq.options.map(o => o.text),
        correctIndex: mcq.correctIndex,
        selectedIndex: selected,
        studentExplanation: explanation,
      });
      setSignal(result);
      setScreen("result");
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleRetry = () => {
    setSelected(null);
    setSubmitted(false);
    setExplanation("");
    setSignal(null);
    setEvalError(null);
    loadMCQ();
  };

  const isCorrect = mcq !== null && selected === mcq.correctIndex;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {ui.backToWorkspace}
        </button>
        <div className={styles.headerCenter}>
          <div className={styles.headerEyebrow}>{ui.eyebrow}</div>
          <div className={styles.headerTitle}>{courseTitle}</div>
        </div>
        <div className={styles.headerRight} />
      </header>

      <main className={styles.main}>
        <div className={styles.card}>

          {/* ── Loading ── */}
          {screen === "loading" && (
            <div className={styles.loadingWrap}>
              <div className={styles.loadingLabel}>{ui.generating ?? "Generating your question…"}</div>
              <div className={styles.loadingDots}><span /><span /><span /></div>
              <div className={styles.loadingHint}>{ui.generatingHint ?? "Reading course content with AI"}</div>
            </div>
          )}

          {/* ── Waiting / polling ── */}
          {screen === "waiting" && (
            <div className={styles.loadingWrap}>
              <div className={styles.loadingLabel}>{ui.preparingQuestions ?? "Preparing your questions…"}</div>
              <div className={styles.loadingDots}><span /><span /><span /></div>
              <div className={styles.loadingHint}>{ui.preparingHint ?? "Your document is being analysed. This takes about 60 seconds the first time."}</div>
              <div className={styles.retryHint}>{ui.retryHint ?? "Checking again automatically…"}</div>
            </div>
          )}

          {/* ── Question ── */}
          {screen === "question" && mcq && (
            <>
              {loadError && <div className={styles.errorBanner}>{loadError}</div>}
              <div className={styles.questionWrap}>
                <div className={styles.questionLabel}>{ui.questionLabel}</div>
                <h1 className={styles.question}>{mcq.question}</h1>
              </div>
              <div className={styles.options}>
                {mcq.options.map((opt, i) => {
                  const isSelected   = selected === i;
                  const isCorrectOpt = submitted && i === mcq.correctIndex;
                  const isWrongOpt   = submitted && isSelected && i !== mcq.correctIndex;
                  return (
                    <button
                      key={i}
                      className={[styles.option, isSelected && !submitted ? styles.optSelected : "", isCorrectOpt ? styles.optCorrect : "", isWrongOpt ? styles.optWrong : ""].join(" ")}
                      onClick={() => { if (!submitted) setSelected(i); }}
                      disabled={submitted}
                    >
                      <span className={styles.optLetter}>{LETTERS[i]}</span>
                      <span className={styles.optText}>{opt.text}</span>
                      {isCorrectOpt && <span className={styles.optMark}>✓</span>}
                      {isWrongOpt   && <span className={styles.optMark}>✗</span>}
                    </button>
                  );
                })}
              </div>
              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={() => router.back()}>{ui.cancel}</button>
                <button className={`${styles.submitBtn} ${selected === null ? styles.submitDisabled : ""}`} onClick={handleSubmit} disabled={selected === null || submitted}>{ui.submitAnswer}</button>
              </div>
            </>
          )}

          {/* ── Explanation / reasoning ── */}
          {screen === "explanation" && mcq && (
            <>
              <div className={`${styles.resultBanner} ${isCorrect ? styles.bannerCorrect : styles.bannerWrong}`}>
                <div className={styles.resultIconWrap}>
                  <span className={styles.resultIcon}>{isCorrect ? "✓" : "✗"}</span>
                </div>
                <div>
                  <div className={styles.resultTitle}>{isCorrect ? ui.correctTitle : ui.incorrectTitle}</div>
                  <div className={styles.resultSub}>
                    {isCorrect ? ui.correctSub : `${ui.incorrectPrefix} "${mcq.options[mcq.correctIndex].text}"`}
                  </div>
                </div>
              </div>

              <div className={styles.explainPrompt}>
                <div className={styles.sectionLabel}>{ui.explainLabel ?? "Explain your reasoning"}</div>
                <p className={styles.explainHint}>{ui.explainHint ?? "Why did you choose that answer? What is the underlying concept?"}</p>
                <textarea
                  className={styles.explainArea}
                  placeholder={ui.explainPlaceholder ?? "Type your explanation here…"}
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
                  rows={5}
                />
                {evalError && <div className={styles.errorBanner}>{evalError}</div>}
              </div>

              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={() => router.back()}>{ui.backBtn}</button>
                <button
                  className={`${styles.submitBtn} ${(explanation.trim().length < 10 || evaluating) ? styles.submitDisabled : ""}`}
                  onClick={handleEvaluate}
                  disabled={explanation.trim().length < 10 || evaluating}
                >
                  {evaluating ? "…" : (ui.evaluateBtn ?? "Evaluate my reasoning")}
                </button>
              </div>
            </>
          )}

          {/* ── Result ── */}
          {screen === "result" && mcq && signal && (
            <>
              <div className={`${styles.signalBanner} ${styles[`signal${signal.signal.replace(/ /g, "")}`]}`}>
                <div className={styles.signalLabel}>{ui.reasoningSignal ?? "Reasoning signal"}</div>
                <div className={styles.signalValue}>{signal.signal}</div>
                <div className={styles.signalConfidence}>{ui.confidence ?? "Confidence"}: {signal.confidence}</div>
              </div>

              <div className={styles.recapSection}>
                <div className={styles.sectionLabel}>{ui.feedbackForYou ?? "Feedback for you"}</div>
                <p className={styles.feedbackText}>{signal.studentFeedback}</p>
              </div>

              <div className={styles.explanationSection}>
                <div className={styles.sectionLabel}>{ui.whyMatters}</div>
                <p className={styles.explanationText}>{mcq.explanation}</p>
              </div>

              <div className={styles.facultySection}>
                <div className={styles.sectionLabel}>{ui.facultyInsight ?? "Faculty insight"}</div>
                <p className={styles.facultyText}>{signal.facultyInsight}</p>
              </div>

              <div className={styles.ctaStrip}>
                <div className={styles.ctaLeft}>
                  <div className={styles.ctaHeadline}>{ui.wantDeeper}</div>
                  <div className={styles.ctaSub}>{ui.exploreSub}</div>
                </div>
                <a href="https://app.stg.tutor.studentcentral.ai/login" target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>{ui.openTutor}</a>
              </div>

              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={() => router.back()}>{ui.backBtn}</button>
                <button className={styles.submitBtn} onClick={handleRetry}>{ui.tryAgain}</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const MCQPageClient = dynamic(() => Promise.resolve(MCQContent), { ssr: false });

export default function MCQPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--surface-low)", minHeight: "100vh" }} />}>
      <MCQPageClient />
    </Suspense>
  );
}
