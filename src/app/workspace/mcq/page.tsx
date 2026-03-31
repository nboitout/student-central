"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./mcq.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import { createSession, getSession, getSessionQuestion, patchSessionAnswer, patchSessionExplanation, patchSessionChat, completeSession, tutorProbe, tutorReply, type MCQOption, type MCQQuestion, type ReasoningSignal, type SessionQuestion, type StoredSession, type TutorMessage } from "@/lib/api";

/* ─── Constants ──────────────────────────────────────────── */
const MAX_QUESTIONS = 5;
const MAX_TURNS     = 10;
const LETTERS       = ["A", "B", "C", "D"];
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
  const tutorLang      = params.get("lang")         ?? "en";
  const resumeSessionId = params.get("resumeSession") ?? null;

  /* ── Mode toggle ── */
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "tutoring";
    return (localStorage.getItem(`mcq-mode-${courseId}`) as Mode) ?? "tutoring";
  });
  const switchMode = (m: Mode) => {
    setMode(m);
    localStorage.setItem(`mcq-mode-${courseId}`, m);
  };

  /* ── Session ── */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const setSession = (id: string) => { sessionIdRef.current = id; setSessionId(id); };

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
  const [pdfSasUrl,    setPdfSasUrl]    = useState<string | null>(null);

  /* ── Timers ── */
  const [qStartTime,   setQStartTime]   = useState<number>(Date.now());
  const [qElapsed,     setQElapsed]     = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStarted = useRef(false);
  const sessionIdRef    = useRef<string | null>(null);
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


  /* ── Keyword chip extractor ────────────────────────────── */
  const STOP_WORDS = new Set([
    "a","an","the","is","are","was","were","be","been","being",
    "have","has","had","do","does","did","will","would","could","should","may","might",
    "in","on","at","by","for","of","to","from","with","about","into","through","during",
    "what","which","who","when","where","why","how","that","this","these","those",
    "it","its","if","or","and","but","not","no","nor","so","yet","than","as",
    "can","does","each","between","against","before","after","above","below","because",
  ]);

  const extractKeyChips = (question: string, opts: { text: string }[]): string[] => {
    const allText = [question, ...opts.map(o => o.text)].join(" ");
    /* tokenise, lowercase, strip punctuation */
    const tokens = allText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 3 && !STOP_WORDS.has(t));
    /* count frequency */
    const freq: Record<string, number> = {};
    tokens.forEach(t => { freq[t] = (freq[t] ?? 0) + 1; });
    /* prioritise tokens that appear in the question (not just options) */
    const questionTokens = new Set(
      question.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(t => t.length > 3 && !STOP_WORDS.has(t))
    );
    /* sort: question-source first, then by frequency, deduplicated */
    const unique = Array.from(new Set(tokens));
    unique.sort((a, b) => {
      const aQ = questionTokens.has(a) ? 1 : 0;
      const bQ = questionTokens.has(b) ? 1 : 0;
      if (aQ !== bQ) return bQ - aQ;
      return (freq[b] ?? 0) - (freq[a] ?? 0);
    });
    /* return top 6 chips, capitalised */
    return unique.slice(0, 6).map(t => t.charAt(0).toUpperCase() + t.slice(1));
  };

  /* ── Toast state for copy feedback ── */
  const [copiedChip, setCopiedChip] = useState<string | null>(null);
  const [ctxExpanded, setCtxExpanded] = useState(false);
  const copyChip = (word: string) => {
    navigator.clipboard.writeText(word).catch(() => {});
    setCopiedChip(word);
    setTimeout(() => setCopiedChip(null), 2000);
  };

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

  /* ── Convert session question to MCQQuestion ── */
  /* Normalise options — backend sends plain strings, UI needs MCQOption objects */
  const normaliseOptions = (opts: string[] | MCQOption[]): MCQOption[] => {
    if (!opts || opts.length === 0) return [];
    if (typeof opts[0] === "string") {
      return (opts as string[]).map((text, i) => ({
        letter: String.fromCharCode(65 + i), /* A, B, C, D */
        text,
      }));
    }
    return opts as MCQOption[];
  };

  const toMCQQuestion = (sq: SessionQuestion): MCQQuestion & { mcqId?: string; slideImageUrl?: string; courseId?: string } => ({
    question:     sq.question,
    options:      normaliseOptions(sq.options),
    correctIndex: sq.correctIndex ?? sq.correct_index ?? 0,
    explanation:  "",   /* explanation not stored on question — populated after evaluate */
    mcqId:        sq.mcqId,
    slideImageUrl: sq.slideImageUrl ?? sq.slide_image_url ?? undefined,
    courseId:     sq.courseId ?? sq.course_id ?? courseId,
    pageNumber:   sq.pageNumber ?? sq.page_number ?? undefined,
  });

  /* ── Load a question from the session into state ── */
  const applyQuestion = (sq: SessionQuestion, idx: number) => {
    const q = toMCQQuestion(sq);
    setQuestions(prev => { const next = [...prev]; next[idx] = q; return next; });
    setAnswers(prev => { const next = [...prev]; if (next[idx] === undefined) next[idx] = null; return next; });

  };

  /* ── Start session — called once on mount ── */
  /* ── Rebuild QuestionResult[] from a stored session ── */
  const hydrateResults = (storedSession: StoredSession): QuestionResult[] => {
    return (storedSession.questions ?? []).map(sq => {
      const selIdx = sq.selectedIndex ?? sq.selected_index ?? 0;
      const corrIdx = sq.correctIndex ?? sq.correct_index ?? 0;
      const signal = (sq.evaluationSignal ?? sq.evaluation_signal)
        ? {
            signal:          (sq.evaluationSignal ?? sq.evaluation_signal ?? "Fragile") as ReasoningSignal["signal"],
            confidence:      (sq.evaluationConfidence ?? "Medium") as ReasoningSignal["confidence"],
            facultyInsight:  sq.facultyInsight ?? "",
            studentFeedback: sq.studentFeedback ?? "",
          }
        : null;
      /* Rebuild a minimal MCQQuestion from stored data */
      const question: MCQQuestion & { mcqId?: string; pageNumber?: number; courseId?: string } = {
        question:     sq.question,
        options:      normaliseOptions(sq.options),
        correctIndex: corrIdx,
        explanation:  "",
        courseId:     courseId,
        mcqId:        sq.mcqId,
        pageNumber:   sq.pageNumber ?? sq.page_number ?? undefined,
      };
      return {
        question,
        selected:    selIdx,
        durationSec: sq.durationSec ?? sq.duration_sec ?? 0,
        explanation: sq.studentExplanation ?? sq.student_explanation ?? "",
        signal,
      };
    });
  };

  const startSession = useCallback(async () => {
    setScreen("loading"); setLoadError(null);

    /* ── Resume path: load existing completed session ── */
    if (resumeSessionId) {
      try {
        const stored = await getSession(resumeSessionId, courseId);
        setSession(resumeSessionId);
        const hydrated = hydrateResults(stored);
        setResults(hydrated);
        /* Populate questions array so slide pane works */
        setQuestions(hydrated.map(r => r.question));
        /* Focus on weakest signal or Q1 */
        const worstIdx = hydrated.findIndex(r =>
          r.signal?.signal === "Low mastery" || r.signal?.signal === "Partial misconception"
        );
        setDebriefQIdx(worstIdx >= 0 ? worstIdx : 0);
        /* Launch debrief directly */
        setQIndex(hydrated.length - 1);
        startDebriefWithResults(hydrated);
      } catch (err) {
        /* If resume fails, fall through to a fresh session */
        setLoadError("Could not load previous session — starting fresh.");
        setTimeout(() => setLoadError(null), 3000);
      }
      return;
    }

    /* ── Normal path: create new session ── */
    try {
      const { sessionId: sid, question: firstQuestion } = await createSession({
        courseId, mode, language: tutorLang,
      });
      setSession(sid);
      applyQuestion(firstQuestion, 0);
      setScreen("question");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to start session");
      setScreen("question");
    }
  }, [courseId, mode, tutorLang, resumeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    startSession();
    /* Fetch PDF SAS URL as fallback when no slide image exists */
    if (courseId) {
      fetch("/api/auth/session")
        .then(r => r.json())
        .then(s => s?.user?.email ?? s?.user?.id ?? "anonymous")
        .catch(() => "anonymous")
        .then(uid => fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io"}/api/courses/${courseId}/pdf-url?userId=${uid}`))
        .then(r => r.json())
        .then(({ sasUrl }) => { if (sasUrl) setPdfSasUrl(sasUrl); })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Submit answer ── */
  const handleSubmit = () => {
    if (selected === null || !mcq) return;
    const dur = qElapsed;
    qDurations.current[qIndex] = dur;
    /* Record answer in backend (fire-and-forget — non-blocking) */
    if (sessionIdRef.current) {
      patchSessionAnswer(sessionIdRef.current, {
        position: qIndex + 1,
        selectedIndex: selected,
        durationSec: dur,
      }, courseId).catch(() => { /* non-fatal */ });
    }
    if (mode === "tutoring") {
      setStudentExp("");
      setScreen("review");
    } else {
      const r: QuestionResult = {
        question: mcq, selected, durationSec: dur,
        explanation: "", signal: null,
      };
      setResults(prev => { const next = [...prev]; next[qIndex] = r; return next; });
      advanceOrFinish(qIndex);
    }
  };

  /* ── Advance to next question or go to summary ── */
  const advanceOrFinish = useCallback(async (fromIdx: number) => {
    const nextIdx = fromIdx + 1;
    if (nextIdx >= MAX_QUESTIONS) {
      /* Complete the session in the background */
      const sid = sessionIdRef.current;
      if (sid) { completeSession(sid, courseId).catch(() => {}); }
      setScreen("summary");
      return;
    }
    setScreen("loading");
    setLoadError(null);
    const sid = sessionIdRef.current;
    if (!sid) { setLoadError("Session not found"); setScreen("question"); return; }
    try {
      const sq = await getSessionQuestion(sid, nextIdx + 1, courseId); /* position is 1-based */
      /* Advance index ONLY after data is ready — prevents blank render */
      setQIndex(nextIdx);
      applyQuestion(sq, nextIdx);
      setScreen("question");
    } catch (err) {
      /* Keep current qIndex on error so existing question stays visible */
      setLoadError(err instanceof Error ? err.message : `Failed to load question ${nextIdx + 1} — please retry`);
      setScreen("question");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Review: proceed (tutoring mode) ── */
  const handleReviewNext = async () => {
    if (!mcq) return;
    setEvaluating(true);
    let signal: ReasoningSignal | null = null;
    const expText = studentExp.trim();
    if (expText && sessionIdRef.current) {
      try {
        /* patchSessionExplanation triggers evaluate on the backend and returns the signal */
        const res = await patchSessionExplanation(sessionIdRef.current, {
          position: qIndex + 1,
          studentExplanation: expText,
        }, courseId);
        signal = {
          signal:          res.signal,
          confidence:      res.confidence,
          facultyInsight:  res.facultyInsight,
          studentFeedback: res.studentFeedback,
        };
      } catch { /* non-fatal — signal stays null */ }
    }
    const r: QuestionResult = {
      question: mcq, selected: selected!, durationSec: qDurations.current[qIndex] ?? qElapsed,
      explanation: expText, signal,
    };
    const updatedResults = results.slice();
    updatedResults[qIndex] = r;
    setResults(updatedResults);
    setEvaluating(false);
    const isLastQ = qIndex + 1 >= MAX_QUESTIONS;
    if (mode === "tutoring" && isLastQ) {
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
      if (sessionIdRef.current) {
        patchSessionChat(sessionIdRef.current, { role: "ai", text: message, questionPosition: focusIdx + 1 }, courseId).catch(() => {});
      }
    } catch {
      setChatMsgs([{ role: "ai", text: "Sorry, I couldn't connect. You can try again or return to the summary." }]);
    } finally {
      setAiTyping(false);
    }
  };

  /* Called from summary screen (assessment) or directly after last Q (tutoring) */
  const startDebrief = () => runDebrief(results);
  /* Called from handleReviewNext with fresh results before state update settles */
  const startDebriefWithResults = (allResults: QuestionResult[]) => {
    /* Complete the session in the background before debrief */
    if (sessionIdRef.current) { completeSession(sessionIdRef.current, courseId).catch(() => {}); }
    runDebrief(allResults);
  };

  /* ── Send chat message ── */
  const sendChat = async () => {
    if (!chatInput.trim() || chatTurns >= MAX_TURNS || aiTyping) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newTurns = chatTurns + 1;
    setChatTurns(newTurns);
    const updatedHistory: TutorMessage[] = [...chatMsgs, { role: "student", text: msg }];
    setChatMsgs(updatedHistory);
    /* Persist student message */
    if (sessionIdRef.current) {
      patchSessionChat(sessionIdRef.current, { role: "student", text: msg, questionPosition: debriefQIdx + 1 }, courseId).catch(() => {});
    }
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
      /* Persist AI reply */
      if (sessionIdRef.current) {
        patchSessionChat(sessionIdRef.current, { role: "ai", text: message, questionPosition: debriefQIdx + 1 }, courseId).catch(() => {});
      }
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
      if (sessionIdRef.current) {
        patchSessionChat(sessionIdRef.current, { role: "ai", text: message, questionPosition: idx + 1 }, courseId).catch(() => {});
      }
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

  /* ======================================================
     RENDER HELPERS
  ====================================================== */

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

  /* ─── Slide pane — PDF open at the question's page ──── */
  /* During debrief use the focused question's page; otherwise use current MCQ page */
  const currentPage = screen === "chat"
    ? (results[debriefQIdx]?.question?.pageNumber ?? 1)
    : (mcq?.pageNumber ?? 1);
  const slidePane = (
    <div className={styles.slidePane} style={{ width: `${slideWidth}%` }}>
      {pdfSasUrl ? (
        <iframe
          key={currentPage}   /* re-mount iframe when page changes */
          src={`${pdfSasUrl}#toolbar=1&navpanes=0&scrollbar=0&view=FitH&page=${currentPage}`}
          className={styles.pdfFallbackFrame}
          title={`Course PDF — page ${currentPage}`}
        />
      ) : (
        <div className={styles.slidePlaceholder}>
          <div className={styles.slidePlaceholderText}>Loading course material…</div>
        </div>
      )}
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

            {/* ── Key term search chips ── */}
            {pdfSasUrl && (
              <div className={styles.chipSearchWrap}>
                <span className={styles.chipSearchLabel}>Search PDF for:</span>
                <div className={styles.chipSearchRow}>
                  {extractKeyChips(mcq.question, mcq.options).map(word => (
                    <button
                      key={word}
                      className={`${styles.chipSearch} ${copiedChip === word ? styles.chipSearchCopied : ""}`}
                      onClick={() => copyChip(word)}
                      title="Click to copy, then press Ctrl+F in the PDF"
                    >
                      {copiedChip === word ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Copied — press Ctrl+F
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          {word}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

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


            <div className={styles.reviewActions}>
              <button
                className={styles.ghostBtn}
                onClick={() => setScreen("question")}
                disabled={evaluating}
              >
                ← Change my answer
              </button>
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

          {/* Question list — each row clickable to start debrief from that Q */}
          <div className={styles.summaryList}>
            {results.map((r, i) => {
              const correct = r.selected === r.question.correctIndex;
              const sig     = r.signal;
              const jumpToDebrief = () => {
                setDebriefQIdx(i);
                setChatMsgs([]); setChatInput(""); setChatTurns(0);
                setScreen("chat");
                setAiTyping(true);
                tutorProbe({
                  courseId,
                  question:      r.question.question,
                  options:       r.question.options.map(o => o.text),
                  correctIndex:  r.question.correctIndex,
                  selectedIndex: r.selected,
                  isCorrect:     r.selected === r.question.correctIndex,
                  explanation:   r.question.explanation,
                  language:      tutorLang,
                })
                  .then(({ message }) => {
                    setChatMsgs([{ role: "ai", text: message }]);
                    if (sessionIdRef.current) {
                      patchSessionChat(sessionIdRef.current, { role: "ai", text: message, questionPosition: i + 1 }, courseId).catch(() => {});
                    }
                  })
                  .catch(() => setChatMsgs([{ role: "ai", text: "Sorry, I couldn't connect." }]))
                  .finally(() => setAiTyping(false));
              };
              return (
                <button key={i} className={`${styles.summaryRow} ${styles.summaryRowClickable}`} onClick={jumpToDebrief}>
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
                    <span className={styles.summaryDiscussHint}>Discuss →</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CTAs */}
          <div className={styles.summaryActions}>
            <button className={styles.ghostBtn} onClick={() => router.back()}>
              {ui.backToCourse ?? "Back to course"}
            </button>
            <button className={styles.submitBtn} onClick={mode === "assessment" ? startDebrief : () => setScreen("chat")}>
              {mode === "assessment" ? (ui.discussWithAI ?? "Discuss all →") : "Back to debrief →"}
            </button>
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

            {/* Compact context strip */}
            {focusR && (
              <div className={styles.ctxStrip} onClick={() => setCtxExpanded(x => !x)}>
                <div className={styles.ctxTop}>
                  <div className={styles.ctxQuestion}>{focusR.question.question}</div>
                  <div className={styles.ctxToggle}>{ctxExpanded ? "hide ▴" : "show answers ▾"}</div>
                </div>
                <div className={styles.ctxBadges}>
                  <span className={styles.ctxBadgeWrong}>
                    Your answer: {LETTERS[focusR.selected]}
                  </span>
                  {focusR.selected !== focusR.question.correctIndex && (
                    <span className={styles.ctxBadgeCorrect}>
                      Correct: {LETTERS[focusR.question.correctIndex]}
                    </span>
                  )}
                  {focusR.selected === focusR.question.correctIndex && (
                    <span className={styles.ctxBadgeCorrect}>Correct ✓</span>
                  )}
                  {focusR.signal && (
                    <span
                      className={styles.signalBadge}
                      style={{ background: signalStyle(focusR.signal.signal).bg, color: signalStyle(focusR.signal.signal).color }}
                    >
                      {focusR.signal.signal === "Partial misconception" ? "Partial" : focusR.signal.signal}
                    </span>
                  )}
                </div>
                {ctxExpanded && (
                  <div className={styles.ctxOptions} onClick={e => e.stopPropagation()}>
                    {focusR.question.options.map((opt, i) => {
                      const isCorr = i === focusR.question.correctIndex;
                      const isSel  = i === focusR.selected;
                      return (
                        <div key={i} className={[
                          styles.ctxOpt,
                          isCorr           ? styles.ctxOptCorrect : "",
                          isSel && !isCorr ? styles.ctxOptWrong   : "",
                          !isCorr && !isSel ? styles.optDimmed    : "",
                        ].join(" ")}>
                          <span className={styles.ctxOptLtr}>{LETTERS[i]}</span>
                          <span className={styles.ctxOptTxt}>{opt.text}</span>
                          {isCorr && <span className={styles.ctxOptMark}>✓</span>}
                          {isSel && !isCorr && <span className={styles.ctxOptMark}>✗</span>}
                        </div>
                      );
                    })}
                    {focusR.explanation && (
                      <div className={styles.ctxExp}>
                        <span className={styles.ctxExpLabel}>Your reasoning: </span>
                        {focusR.explanation}
                      </div>
                    )}
                  </div>
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
                <div className={styles.chatInputBox}>
                  <textarea
                    className={styles.chatInput}
                    value={chatInput}
                    onChange={e => {
                      setChatInput(e.target.value);
                      /* auto-grow */
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && chatInput.trim()) { e.preventDefault(); sendChat(); }}}
                    placeholder="Reply to the AI tutor…"
                    rows={1}
                  />
                  <button
                    className={styles.chatSendBtn}
                    onClick={sendChat}
                    disabled={!chatInput.trim() || aiTyping}
                    aria-label="Send"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.chatMeta}>
                  <span>{chatTurns}/{MAX_TURNS} exchanges</span>
                  <span>↵ to send · Shift+↵ new line</span>
                </div>
              </div>
            )}

            {chatTurns >= 1 && (
              <div className={styles.chatNavRow}>
                <button className={styles.chatNavBtn} onClick={() => setScreen("summary")}>
                  ← Results
                </button>
                {(() => {
                  /* Find the next question index to discuss */
                  const nextIdx = results.findIndex((_, i) => i > debriefQIdx);
                  const prevIdx = debriefQIdx - 1;
                  return (
                    <>
                      {prevIdx >= 0 && (
                        <button className={styles.chatNavBtn} onClick={() => switchDebriefQ(prevIdx)}>
                          ← Q{prevIdx + 1}
                        </button>
                      )}
                      {nextIdx >= 0 && (
                        <button className={`${styles.chatNavBtn} ${styles.chatNavBtnNext}`} onClick={() => switchDebriefQ(nextIdx)}>
                          Discuss Q{nextIdx + 1} →
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
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
