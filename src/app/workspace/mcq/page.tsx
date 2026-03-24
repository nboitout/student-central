"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./mcq.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import { evaluateReasoning, getSlideSasUrl, type MCQQuestion, type ReasoningSignal } from "@/lib/api";

/* ── DEV: placeholder slide until backend ships mcqId + slideImageUrl ── */
const DEMO_SLIDE_URL = "https://placehold.co/1280x720/e8eaff/0048d8?text=Slide+preview";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";

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
  const [slideSasUrl,  setSlideSasUrl]  = useState<string | null>(null);
  const [slideLoaded,  setSlideLoaded]  = useState(false);

  const loadMCQ = () => {
    setScreen("loading");
    setMcq(null);
    setLoadError(null);
    setSlideSasUrl(null);
    setSlideLoaded(false);

    fetch(`${API_URL}/api/mcq/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, pdfUrl: pdfUrl || undefined, courseTitle }),
    })
      .then(async (res) => {
        if (res.status === 202) {
          setScreen("waiting");
          setTimeout(() => loadMCQ(), 10000);
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
          setLoadError(err.detail ?? `Error ${res.status}`);
          setScreen("question");
          return;
        }
        const q: MCQQuestion = await res.json();
        setMcq(q);
        setScreen("question");
        /* Fetch SAS URL for slide image */
        if (q.mcqId && q.slideImageUrl) {
          getSlideSasUrl(q.courseId, q.mcqId)
            .then(({ sasUrl }) => setSlideSasUrl(sasUrl))
            .catch(() => setSlideSasUrl(DEMO_SLIDE_URL));
        } else {
          /* DEV fallback — remove once backend ships mcqId + slideImageUrl */
          setSlideSasUrl(DEMO_SLIDE_URL);
        }
      })
      .catch(err => { setLoadError(err.message); setScreen("question"); });
  };

  useEffect(() => { loadMCQ(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* ── Loading / waiting: full page, no columns ── */
  if (screen === "loading" || screen === "waiting") {
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
            <span className={styles.headerEyebrow}>{ui.eyebrow}</span>
            <span className={styles.headerTitle}>{courseTitle}</span>
          </div>
          <div className={styles.headerRight} />
        </header>
        <div className={styles.loadingPage}>
          <div className={styles.loadingWrap}>
            <div className={styles.loadingLabel}>
              {screen === "waiting"
                ? (ui.preparingQuestions ?? "Preparing your questions…")
                : (ui.generating ?? "Generating your question…")}
            </div>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            <div className={styles.loadingHint}>
              {screen === "waiting"
                ? (ui.preparingHint ?? "Your document is being analysed. This takes about 60 seconds the first time.")
                : (ui.generatingHint ?? "Reading course content with AI")}
            </div>
            {screen === "waiting" && (
              <div className={styles.retryHint}>{ui.retryHint ?? "Checking again automatically…"}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Question / Explanation / Result: two-column layout ── */
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
          <span className={styles.headerEyebrow}>{ui.eyebrow}</span>
          <span className={styles.headerTitle}>{courseTitle}</span>
        </div>
        <div className={styles.headerRight} />
      </header>

      <div className={styles.body}>

        {/* ── LEFT: slide pane ── */}
        <div className={styles.slidePane}>
          {mcq?.pageNumber !== undefined && (
            <div className={styles.slidePageBadge}>
              {ui.slidePage ?? "Page"} {mcq.pageNumber + 1}
            </div>
          )}
          {!slideSasUrl && (
            <div className={styles.slideLoadingWrap}>
              <div className={styles.loadingDots}><span /><span /><span /></div>
            </div>
          )}
          {slideSasUrl && !slideLoaded && (
            <div className={styles.slideLoadingWrap}>
              <div className={styles.loadingDots}><span /><span /><span /></div>
            </div>
          )}
          {slideSasUrl && (
            <img
              src={slideSasUrl}
              alt={`Slide page ${(mcq?.pageNumber ?? 0) + 1}`}
              className={styles.slideImg}
              style={{ display: slideLoaded ? "block" : "none" }}
              onLoad={() => setSlideLoaded(true)}
            />
          )}
        </div>

        {/* ── RIGHT: question pane ── */}
        <div className={styles.questionPane}>

          {/* ── Question screen ── */}
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
                      className={[
                        styles.option,
                        isSelected && !submitted ? styles.optSelected : "",
                        isCorrectOpt ? styles.optCorrect : "",
                        isWrongOpt   ? styles.optWrong   : "",
                      ].join(" ")}
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
                <button
                  className={`${styles.submitBtn} ${selected === null ? styles.submitDisabled : ""}`}
                  onClick={handleSubmit}
                  disabled={selected === null || submitted}
                >
                  {ui.submitAnswer}
                </button>
              </div>
            </>
          )}

          {/* ── Explanation screen ── */}
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

          {/* ── Result screen ── */}
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
                <a href="https://app.stg.tutor.studentcentral.ai/login" target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
                  {ui.openTutor}
                </a>
              </div>

              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={() => router.back()}>{ui.backBtn}</button>
                <button className={styles.submitBtn} onClick={handleRetry}>{ui.tryAgain}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MCQPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--surface-low)", minHeight: "100vh" }} />}>
      <MCQContent />
    </Suspense>
  );
}
