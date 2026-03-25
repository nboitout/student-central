"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./mcq.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import { evaluateReasoning, getSlideSasUrl, tutorProbe, tutorReply, type MCQQuestion, type ReasoningSignal, type TutorMessage } from "@/lib/api";

/* ─── Constants ──────────────────────────────────────────── */
const MAX_QUESTIONS = 5;
const MAX_TURNS     = 10;
const LETTERS       = ["A", "B", "C", "D"];
const API_URL       = process.env.NEXT_PUBLIC_API_URL ||
  "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";

/* ─── Types ──────────────────────────────────────────────── */
type Mode   = "assessment" | "tutoring";
type Screen = "loading" | "waiting" | "question" | "review" | "summary" | "chat";

interface QuestionResult {
  question:   MCQQuestion;
  selected:   number;
  durationSec: number;
  explanation: string;      /* student's own words (tutoring) or "" (assessment) */
  signal:      ReasoningSignal | null;
}

/* ─── MCQ page ───────────────────────────────────────────── */
function MCQContent() {
  const params      = useSearchParams();
  const router      = useRouter();
  const { lang }    = useLanguage();
  const ui          = getT(lang).mcq;
  const courseId    = params.get("id")    ?? "";
  const courseTitle = decodeURIComponent(params.get("title") ?? "Course");
  const pdfUrl      = decodeURIComponent(params.get("pdf")   ?? "");
  const tutorLang   = params.get("lang")  ?? "en";

  /* ── Mode toggle ── */
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "tutoring";
    return (localStorage.getItem(`mcq-mode-${courseId}`) as Mode) ?? "tutoring";
  });
  const switchMode = (m: Mode) => {
    setMode(m);
    localStorage.setItem(`mcq-mode-${courseId}`, m);
  };

  /* ── Question set state ── */
  const [screen,    setScreen]    = useState<Screen>("loading");
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [qIndex,    setQIndex]    = useState(0);
  const [answers,   setAnswers]   = useState<(number | null)[]>([]);
  const [results,   setResults]   = useState<QuestionResult[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Review screen state (tutoring mode) ── */
  const [studentExp,   setStudentExp]   = useState("");
  const [evaluating,   setEvaluating]   = useState(false);

  /* ── Chat / debrief state ── */
  const [chatMsgs,     setChatMsgs]     = useState<TutorMessage[]>([]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatTurns,    setChatTurns]    = useState(0);
  const [aiTyping,     setAiTyping]     = useState(false);
  const [chatError,    setChatError]    = useState<string | null>(null);
  /* Which question the debrief is currently focused on */
  const [debriefQIdx,  setDebriefQIdx]  = useState(0);

  /* ── Slide state ── */
  const [slideSasUrl,  setSlideSasUrl]  = useState<string | null>(null);
  const [slideLoaded,  setSlideLoaded]  = useState(false);

  /* ── Timers ── */
  const [qStartTime,   setQStartTime]   = useState<number>(Date.now());
  const [qElapsed,     setQElapsed]     = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qDurations = useRef<number[]>([]);

  useEffect(() => {
    if (screen === "question") {
      const start = Date.now();
      setQStartTime(start);
      setQElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setQElapsed(Math.floor((Date.now() - start) / 1000));
        setTotalElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmtTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  /* ── Resizable split ── */
  const [slideWidth, setSlideWidth] = useState(55);
  const bodyRef    = useRef<HTMLDivElement>(null);
  const dragging   = useRef(false);
  const dividerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); dragging.current = true;
    dividerRef.current?.classList.add(styles.dragging);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !bodyRef.current) return;
      const { left, width } = bodyRef.current.getBoundingClientRect();
      setSlideWidth(Math.min(Math.max(((e.clientX - left) / width) * 100, 25), 72));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      dividerRef.current?.classList.remove(styles.dragging);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []);

  /* ── Derived ── */
  const mcq      = questions[qIndex] ?? null;
  const selected = answers[qIndex]   ?? null;
  const isCorrect = mcq !== null && selected === mcq.correctIndex;

  /* ── Load MCQ ── */
  const loadMCQ = useCallback(() => {
    setScreen("loading"); setLoadError(null);
    setSlideSasUrl(null); setSlideLoaded(false);

    fetch(`${API_URL}/api/mcq/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, pdfUrl: pdfUrl || undefined, courseTitle, language: tutorLang }),
    })
      .then(res => {
        if (res.status === 202) { setScreen("waiting"); setTimeout(() => loadMCQ(), 10000); return; }
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((q: MCQQuestion & { mcqId?: string; slideImageUrl?: string; courseId?: string }) => {
        if (!q) return;
        setQuestions(prev => { const next = [...prev]; next[qIndex] = q; return next; });
        setAnswers(prev => { const next = [...prev]; if (next[qIndex] === undefined) next[qIndex] = null; return next; });
        if (q.mcqId && q.slideImageUrl) {
          getSlideSasUrl(q.courseId ?? courseId, q.mcqId)
            .then(({ sasUrl }) => setSlideSasUrl(sasUrl))
            .catch(() => {});
        }
        setScreen("question");
      })
      .catch(err => { setLoadError(err.message); setScreen("question"); });
  }, [courseId, pdfUrl, courseTitle, qIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadMCQ(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Submit answer ── */
  const handleSubmit = () => {
    if (selected === null) return;
    qDurations.current[qIndex] = qElapsed;
    if (mode === "tutoring") {
      setStudentExp("");
      setScreen("review");
    } else {
      /* Assessment: store minimal result and advance */
      const r: QuestionResult = {
        question: mcq!, selected, durationSec: qElapsed,
        explanation: "", signal: null,
      };
      setResults(prev => { const next = [...prev]; next[qIndex] = r; return next; });
      advanceOrFinish(qIndex);
    }
  };

  /* ── Advance to next question or go to summary ── */
  const advanceOrFinish = useCallback((fromIdx: number) => {
    const nextIdx = fromIdx + 1;
    if (nextIdx >= MAX_QUESTIONS) {
      setScreen("summary");
      return;
    }
    /* Set index first, then imperatively fetch for that index */
    setQIndex(nextIdx);
    setScreen("loading");
    setLoadError(null);
    setSlideSasUrl(null);
    setSlideLoaded(false);

    fetch(`${API_URL}/api/mcq/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, pdfUrl: pdfUrl || undefined, courseTitle, language: tutorLang }),
    })
      .then(res => {
        if (res.status === 202) {
          setScreen("waiting");
          /* Use a recursive retry that always has the right index */
          const retry = () => {
            fetch(`${API_URL}/api/mcq/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courseId, pdfUrl: pdfUrl || undefined, courseTitle, language: tutorLang }),
            })
              .then(r => r.json())
              .then((q: MCQQuestion & { mcqId?: string; slideImageUrl?: string; courseId?: string }) => {
                setQuestions(prev => { const next = [...prev]; next[nextIdx] = q; return next; });
                setAnswers(prev => { const next = [...prev]; if (next[nextIdx] === undefined) next[nextIdx] = null; return next; });
                if (q.mcqId && q.slideImageUrl) {
                  getSlideSasUrl(q.courseId ?? courseId, q.mcqId)
                    .then(({ sasUrl }) => setSlideSasUrl(sasUrl)).catch(() => {});
                }
                setScreen("question");
              })
              .catch(() => setTimeout(retry, 10000));
          };
          setTimeout(retry, 10000);
          return;
        }
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((q: MCQQuestion & { mcqId?: string; slideImageUrl?: string; courseId?: string }) => {
        if (!q) return;
        setQuestions(prev => { const next = [...prev]; next[nextIdx] = q; return next; });
        setAnswers(prev => { const next = [...prev]; if (next[nextIdx] === undefined) next[nextIdx] = null; return next; });
        if (q.mcqId && q.slideImageUrl) {
          getSlideSasUrl(q.courseId ?? courseId, q.mcqId)
            .then(({ sasUrl }) => setSlideSasUrl(sasUrl)).catch(() => {});
        }
        setScreen("question");
      })
      .catch(err => { setLoadError(err.message); setScreen("question"); });
  }, [courseId, pdfUrl, courseTitle, tutorLang]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Review: proceed (tutoring mode) ── */
  const handleReviewNext = async () => {
    if (!mcq) return;
    setEvaluating(true);
    let signal: ReasoningSignal | null = null;
    if (studentExp.trim()) {
      try {
        signal = await evaluateReasoning({
          courseId, question: mcq.question,
          options: mcq.options.map(o => o.text),
          correctIndex: mcq.correctIndex, selectedIndex: selected!,
          studentExplanation: studentExp.trim(),
        });
      } catch { /* non-fatal */ }
    }
    const r: QuestionResult = {
      question: mcq, selected: selected!, durationSec: qDurations.current[qIndex] ?? qElapsed,
      explanation: studentExp.trim(), signal,
    };
    const updatedResults = results.slice();
    updatedResults[qIndex] = r;
    setResults(updatedResults);
    setEvaluating(false);
    const isLastQ = qIndex + 1 >= MAX_QUESTIONS;
    if (mode === "tutoring" && isLastQ) {
      /* Tutoring mode: go directly to AI debrief — results revealed after */
      startDebriefWithResults(updatedResults);
    } else {
      advanceOrFinish(qIndex);
    }
  };

  /* ── Start AI debrief (shared logic) ── */
  const runDebrief = async (allResults: QuestionResult[]) => {
    setChatMsgs([]); setChatInput(""); setChatTurns(0); setChatError(null);
    const worstIdx = allResults.findIndex(r =>
      r.signal?.signal === "Low mastery" || r.signal?.signal === "Partial misconception"
    );
    const focusIdx = worstIdx >= 0 ? worstIdx : 0;
    setDebriefQIdx(focusIdx);
    setScreen("chat");
    setAiTyping(true);
    try {
      const { message } = await tutorProbe({
        courseId,
        question:      allResults[focusIdx].question.question,
        options:       allResults[focusIdx].question.options.map(o => o.text),
        correctIndex:  allResults[focusIdx].question.correctIndex,
        selectedIndex: allResults[focusIdx].selected,
        isCorrect:     allResults[focusIdx].selected === allResults[focusIdx].question.correctIndex,
        explanation:   allResults[focusIdx].question.explanation,
        language:      tutorLang,
      });
      setChatMsgs([{ role: "ai", text: message }]);
    } catch {
      setChatMsgs([{ role: "ai", text: "Sorry, I couldn't connect. You can try again or return to the summary." }]);
    } finally {
      setAiTyping(false);
    }
  };

  /* Called from summary screen (assessment) or directly after last Q (tutoring) */
  const startDebrief = () => runDebrief(results);
  /* Called from handleReviewNext with fresh results before state update settles */
  const startDebriefWithResults = (allResults: QuestionResult[]) => runDebrief(allResults);

  /* ── Send chat message ── */
  const sendChat = async () => {
    if (!chatInput.trim() || chatTurns >= MAX_TURNS || aiTyping) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newTurns = chatTurns + 1;
    setChatTurns(newTurns);
    const updatedHistory: TutorMessage[] = [...chatMsgs, { role: "student", text: msg }];
    setChatMsgs(updatedHistory);
    if (newTurns >= MAX_TURNS) return;
    setAiTyping(true);
    try {
      const focusR = results[debriefQIdx];
      const { message } = await tutorReply({
        courseId,
        question:      focusR.question.question,
        options:       focusR.question.options.map(o => o.text),
        correctIndex:  focusR.question.correctIndex,
        selectedIndex: focusR.selected,
        isCorrect:     focusR.selected === focusR.question.correctIndex,
        explanation:   focusR.question.explanation,
        language:      tutorLang,
        history:       updatedHistory,
      });
      setChatMsgs(prev => [...prev, { role: "ai", text: message }]);
    } catch {
      setChatMsgs(prev => [...prev, { role: "ai", text: "Sorry, I couldn't respond. Please try again." }]);
    } finally {
      setAiTyping(false);
    }
  };

  /* ── Switch debrief question ── */
  const switchDebriefQ = async (idx: number) => {
    if (idx === debriefQIdx) return;
    setDebriefQIdx(idx);
    setChatMsgs([]); setChatInput(""); setChatTurns(0);
    setAiTyping(true);
    try {
      const r = results[idx];
      const { message } = await tutorProbe({
        courseId,
        question:      r.question.question,
        options:       r.question.options.map(o => o.text),
        correctIndex:  r.question.correctIndex,
        selectedIndex: r.selected,
        isCorrect:     r.selected === r.question.correctIndex,
        explanation:   r.question.explanation,
        language:      tutorLang,
      });
      setChatMsgs([{ role: "ai", text: message }]);
    } catch {
      setChatMsgs([{ role: "ai", text: "Sorry, couldn't load this question. Try another." }]);
    } finally {
      setAiTyping(false);
    }
  };

  /* ── Navigation (prev question) ── */
  const prevQuestion = () => {
    if (qIndex === 0) { router.back(); return; }
    const prevIdx = qIndex - 1;
    setQIndex(prevIdx);
    /* In assessment mode there is no review screen — go back to question */
    const alreadyAnswered = answers[prevIdx] !== null;
    setScreen(alreadyAnswered && mode === "tutoring" ? "review" : "question");
  };

  /* ══════════════════════════════════════════════════════
     RENDER HELPERS
  ══════════════════════════════════════════════════════ */

  const SIGNAL_COLORS: Record<string, { bg: string; color: string }> = {
    "Strong":               { bg: "#EAF3DE", color: "#27500A" },
    "Fragile":              { bg: "#FAEEDA", color: "#633806" },
    "Partial misconception": { bg: "#FAECE7", color: "#712B13" },
    "Low mastery":          { bg: "#FCEBEB", color: "#791F1F" },
  };
  const signalStyle = (sig: string) => SIGNAL_COLORS[sig] ?? { bg: "#F1EFE8", color: "#444441" };

  const fmtDur = (sec: number) => {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? `${m}m ${s.toString().padStart(2,"0")}s` : `${s}s`;
  };

  /* ─── Header ─────────────────────────────────────────── */
  const headerEl = (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button className={styles.backBtn} onClick={() => {
          if (screen === "chat") {
            if (mode === "tutoring") { setScreen("summary"); return; }
            setScreen("summary"); return;
          }
          if (screen === "summary") { router.back(); return; }
          prevQuestion();
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {screen === "chat" ? (mode === "tutoring" ? "See results" : "Summary") : screen === "summary" ? ui.backBtn : (qIndex === 0 ? ui.backToWorkspace ?? "Workspace" : ui.prevQuestion ?? "← Prev")}
        </button>
        {/* Mode toggle */}
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${mode === "assessment" ? styles.modeBtnActive : ""}`}
            onClick={() => switchMode("assessment")}
            title="Assessment mode — no review between questions"
          >Assessment</button>
          <button
            className={`${styles.modeBtn} ${mode === "tutoring" ? styles.modeBtnActive : ""}`}
            onClick={() => switchMode("tutoring")}
            title="Tutoring mode — review + explain after each question"
          >Tutoring</button>
        </div>
      </div>
      <div className={styles.headerCenter}>
        <span className={styles.headerEyebrow}>COURSE MATERIALS</span>
        <span className={styles.headerTitle}>{courseTitle}</span>
      </div>
      <div className={styles.headerRight}>
        {/* Timer (question screen only) */}
        {(screen === "question") && (
          <div className={styles.timerWrap}>
            <span className={styles.timerQ}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {fmtTimer(qElapsed)}
            </span>
            <span className={styles.timerSep}>·</span>
            <span className={styles.timerTotal}>{fmtTimer(totalElapsed)}</span>
          </div>
        )}
        {(screen === "question" || screen === "review") && (
          <span className={styles.qCounter}>Q{qIndex + 1}/{MAX_QUESTIONS}</span>
        )}
      </div>
    </header>
  );

  /* ─── Loading / waiting ───────────────────────────────── */
  if (screen === "loading" || screen === "waiting") {
    return (
      <div className={styles.page}>
        {headerEl}
        <div className={styles.loadingPane}>
          <div className={styles.spinner} />
          <div className={styles.loadingText}>
            {screen === "waiting" ? (ui.preparingQuestions ?? "Preparing…") : (ui.generating ?? "Generating…")}
          </div>
          <div className={styles.loadingHint}>
            {screen === "waiting" ? (ui.preparingHint ?? "Analysing document…") : (ui.generatingHint ?? "Reading with AI")}
          </div>
          {screen === "waiting" && <div className={styles.retryHint}>{ui.retryHint ?? "Checking again…"}</div>}
        </div>
      </div>
    );
  }

  /* ─── Slide pane helper (question + review screens) ──── */
  const slidePane = (
    <div className={styles.slidePane} style={{ width: `${slideWidth}%` }}>
      {!slideSasUrl
        ? <div className={styles.slidePlaceholder}><div className={styles.slidePlaceholderText}>Slide not available</div></div>
        : (
          <>
            {!slideLoaded && <div className={styles.slideLoading}><div className={styles.spinner} /></div>}
            <img
              src={slideSasUrl}
              alt="Slide"
              className={styles.slideImg}
              style={{ opacity: slideLoaded ? 1 : 0 }}
              onLoad={() => setSlideLoaded(true)}
            />
          </>
        )
      }
    </div>
  );

  /* ─── QUESTION screen ─────────────────────────────────── */
  if (screen === "question" && mcq) {
    return (
      <div className={styles.page}>
        {headerEl}
        <div className={styles.body} ref={bodyRef}>
          {slidePane}
          <div className={styles.divider} ref={dividerRef} onMouseDown={onMouseDown} />
          <div className={styles.questionPane}>
            {loadError && <div className={styles.errorBanner}>{loadError}</div>}
            <div className={styles.questionLabel}>{ui.questionLabel ?? "Question"} {qIndex + 1}</div>
            <div className={styles.questionText}>{mcq.question}</div>
            <div className={styles.options}>
              {mcq.options.map((opt, i) => (
                <button
                  key={i}
                  className={`${styles.option} ${selected === i ? styles.optionSelected : ""}`}
                  onClick={() => setAnswers(prev => { const next = [...prev]; next[qIndex] = i; return next; })}
                >
                  <span className={styles.optLetter}>{LETTERS[i]}</span>
                  <span className={styles.optText}>{opt.text}</span>
                </button>
              ))}
            </div>
            <div className={styles.questionActions}>
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={selected === null}
              >{ui.submitAnswer}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── REVIEW screen (tutoring mode) ──────────────────── */
  if (screen === "review" && mcq) {
    return (
      <div className={styles.page}>
        {headerEl}
        <div className={styles.body} ref={bodyRef}>
          {slidePane}
          <div className={styles.divider} ref={dividerRef} onMouseDown={onMouseDown} />
          <div className={styles.questionPane}>
            {/* Question text */}
            <div className={styles.questionLabel}>{ui.questionLabel ?? "Question"} {qIndex + 1}</div>
            <div className={styles.questionText}>{mcq.question}</div>

            {/* Options — show student's selection neutrally, no correct/wrong reveal */}
            <div className={styles.options}>
              {mcq.options.map((opt, i) => (
                <div
                  key={i}
                  className={`${styles.optionStatic} ${i === selected ? styles.optSelected : styles.optDimmed}`}
                >
                  <span className={styles.optLetter}>{LETTERS[i]}</span>
                  <span className={styles.optText}>{opt.text}</span>
                  {i === selected && <span className={styles.optMark} style={{ color: "var(--primary)" }}>✓ your answer</span>}
                </div>
              ))}
            </div>

            {/* Student explanation textarea — optional but nudged */}
            <div className={styles.studentExpSection}>
              <label className={styles.sectionLabel}>{ui.explainLabel ?? "What was your reasoning?"}</label>
              <p className={styles.reviewBlind}>
                Results will be revealed after the AI debrief.
              </p>
              <textarea
                className={styles.studentExpInput}
                placeholder={ui.explainPlaceholder ?? "Why did you choose that answer? (optional — helps the AI tutor)"}
                value={studentExp}
                onChange={e => setStudentExp(e.target.value)}
                rows={3}
              />
            </div>

            <div className={styles.reviewActions}>
              <button
                className={styles.submitBtn}
                onClick={handleReviewNext}
                disabled={evaluating}
              >
                {evaluating ? "…" : (qIndex + 1 >= MAX_QUESTIONS ? "Start AI debrief →" : (ui.nextQuestion ?? "Next question →"))}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── SUMMARY screen ─────────────────────────────────── */
  if (screen === "summary") {
    const score    = results.filter(r => r.selected === r.question.correctIndex).length;
    const totalSec = results.reduce((s, r) => s + r.durationSec, 0);

    return (
      <div className={styles.page}>
        {headerEl}
        <div className={styles.summaryPane}>
          {/* Score header */}
          <div className={styles.summaryEyebrow}>
            {mode === "tutoring" ? "Results — revealed after debrief" : "Results"}
          </div>
          <div className={styles.summaryHeader}>
            <div className={styles.summaryScore}>{score}/{MAX_QUESTIONS}</div>
            <div className={styles.summaryScoreLabel}>correct</div>
            <div className={styles.summaryTime}>{fmtDur(totalSec)} total</div>
          </div>

          {/* Question list */}
          <div className={styles.summaryList}>
            {results.map((r, i) => {
              const correct = r.selected === r.question.correctIndex;
              const sig     = r.signal;
              return (
                <div key={i} className={styles.summaryRow}>
                  <div className={`${styles.summaryQNum} ${correct ? styles.summaryCorrect : styles.summaryWrong}`}>
                    {correct ? "✓" : "✗"}
                  </div>
                  <div className={styles.summaryQText}>{r.question.question}</div>
                  <div className={styles.summaryMeta}>
                    {sig && (
                      <span
                        className={styles.signalBadge}
                        style={{ background: signalStyle(sig.signal).bg, color: signalStyle(sig.signal).color }}
                      >
                        {sig.signal === "Partial misconception" ? "Partial" : sig.signal}
                      </span>
                    )}
                    <span className={styles.summaryDur}>{fmtDur(r.durationSec)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTAs */}
          <div className={styles.summaryActions}>
            <button className={styles.ghostBtn} onClick={() => router.back()}>
              {ui.backToCourse ?? "Back to course"}
            </button>
            {mode === "assessment" ? (
              <button className={styles.submitBtn} onClick={startDebrief}>
                {ui.discussWithAI ?? "Discuss with AI →"}
              </button>
            ) : (
              <button className={styles.submitBtn} onClick={() => setScreen("chat")}>
                Back to debrief →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── CHAT / DEBRIEF screen ──────────────────────────── */
  if (screen === "chat") {
    const focusR   = results[debriefQIdx];
    const fCorr    = focusR?.selected === focusR?.question.correctIndex;

    return (
      <div className={styles.page}>
        {headerEl}
        <div className={styles.body} ref={bodyRef}>

          {/* Left: slide pane — same as question/review screens */}
          {slidePane}
          <div className={styles.divider} ref={dividerRef} onMouseDown={onMouseDown} />

          {/* Right: Q-pills + question + options + chat stacked */}
          <div className={styles.questionPane} style={{ gap: 0, padding: "0", display: "flex", flexDirection: "column" }}>

            {/* Q-selector pills */}
            <div className={styles.debriefPills}>
              {results.map((r, i) => {
                const corr = r.selected === r.question.correctIndex;
                return (
                  <button
                    key={i}
                    className={`${styles.debriefPill} ${i === debriefQIdx ? styles.debriefPillActive : ""}`}
                    onClick={() => switchDebriefQ(i)}
                  >
                    <span className={corr ? styles.pillCorrect : styles.pillWrong}>{corr ? "✓" : "✗"}</span>
                    Q{i + 1}
                  </button>
                );
              })}
            </div>

            {/* Focused question card */}
            {focusR && (
              <div className={styles.debriefQCard}>
                <div className={styles.questionLabel}>{ui.questionLabel ?? "Question"} {debriefQIdx + 1}</div>
                <div className={styles.questionText}>{focusR.question.question}</div>
                <div className={styles.options} style={{ marginTop: 12 }}>
                  {focusR.question.options.map((opt, i) => {
                    const isCorr = i === focusR.question.correctIndex;
                    const isSel  = i === focusR.selected;
                    return (
                      <div key={i} className={[
                        styles.optionStatic,
                        isCorr           ? styles.optCorrect : "",
                        isSel && !isCorr ? styles.optWrong   : "",
                        !isCorr && !isSel ? styles.optDimmed : "",
                      ].join(" ")}>
                        <span className={styles.optLetter}>{LETTERS[i]}</span>
                        <span className={styles.optText}>{opt.text}</span>
                        {isCorr && <span className={styles.optMark}>✓</span>}
                        {isSel && !isCorr && <span className={styles.optMark}>✗</span>}
                      </div>
                    );
                  })}
                </div>
                {focusR.explanation && (
                  <div className={styles.chatStudentExp}>
                    <div className={styles.sectionLabel}>Your reasoning</div>
                    <p className={styles.chatStudentExpText}>{focusR.explanation}</p>
                  </div>
                )}
                {focusR.signal && (
                  <span
                    className={styles.signalBadge}
                    style={{ background: signalStyle(focusR.signal.signal).bg, color: signalStyle(focusR.signal.signal).color, marginTop: 10, display: "inline-block" }}
                  >{focusR.signal.signal}</span>
                )}
              </div>
            )}

          {/* Chat panel — fills remaining height */}
          <div className={styles.chatPane}>
            <div className={styles.chatThread}>
              {chatMsgs.map((msg, i) => (
                <div key={i} className={msg.role === "ai" ? styles.chatAI : styles.chatStudent}>
                  <span className={styles.chatSender}>{msg.role === "ai" ? "AI Tutor" : (ui.you ?? "You")}</span>
                  {msg.text}
                </div>
              ))}
              {aiTyping && (
                <div className={styles.chatAI}>
                  <span className={styles.chatSender}>AI Tutor</span>
                  <div className={styles.loadingDots}><span /><span /><span /></div>
                </div>
              )}
              {chatTurns >= MAX_TURNS && (
                <div className={styles.chatEndWarning}>{ui.chatEnded ?? "End of discussion."}</div>
              )}
            </div>

            {chatTurns < MAX_TURNS && (
              <div className={styles.chatInputWrap}>
                <div className={styles.chatTurnCount}>{chatTurns}/{MAX_TURNS} {ui.turns ?? "exchanges"}</div>
                <div className={styles.chatInputBar}>
                  <textarea
                    className={styles.chatInput}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && chatInput.trim()) { e.preventDefault(); sendChat(); }}}
                    placeholder={`Reply… (↵ ${ui.send ?? "send"})`}
                    rows={1}
                  />
                  <button
                    className={styles.chatSendBtn}
                    onClick={sendChat}
                    disabled={!chatInput.trim() || aiTyping}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {chatTurns >= 1 && (
              <button className={styles.ghostBtn} style={{ marginTop: 8, alignSelf: "flex-end" }} onClick={() => setScreen("summary")}>
                ← {ui.backBtn ?? "Back to summary"}
              </button>
            )}
          </div>{/* end chatPane */}

          </div>{/* end questionPane */}
        </div>{/* end body */}
      </div>
    );
  }

  return null;
}

export default function MCQPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <MCQContent />
    </Suspense>
  );
}
