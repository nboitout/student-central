"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import styles from "./mcq.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import { createSession, getSession, setCurrentUser, getSessionQuestion, patchSessionAnswer, patchSessionExplanation, patchSessionChat, completeSession, updateCourse, tutorProbe, tutorReply, type MCQOption, type MCQQuestion, type ReasoningSignal, type SessionQuestion, type StoredSession, type TutorMessage } from "@/lib/api";

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

const LATEX_HINT = "\\\\(?:frac|sum|int|sqrt|beta|alpha|gamma|theta|mu|sigma|pi|lambda)";

function normalizeMathMarkdown(raw: string): string {
  let text = raw;
  /* Standard LaTeX math delimiters -> markdown math delimiters */
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, expr) => `$$${expr}$$`);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, expr) => `$${expr}$`);

  /* Common model pattern: [ formula with LaTeX commands ] */
  text = text.replace(
    new RegExp(`^\\s*\\[\\s*([\\s\\S]*?${LATEX_HINT}[\\s\\S]*?)\\s*\\]\\s*$`, "m"),
    (_m, expr) => `$$${expr}$$`
  );

  /* Inline parenthesized latex snippets inside prose */
  text = text.replace(
    new RegExp(`\\(\\s*([^()]*${LATEX_HINT}[^()]*)\\s*\\)`, "g"),
    (_m, expr) => `($${expr}$)`
  );
  return text;
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
  const [userId,    setUserId]    = useState<string>("");
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
  const [voiceState,   setVoiceState]   = useState<"idle"|"recording"|"transcribing"|"ready">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
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
  const [ctxRevealed, setCtxRevealed] = useState(false);
  const [mcqVotes, setMcqVotes] = useState<Record<number, "up" | "down" | null>>({});
  const [reportedMistakes, setReportedMistakes] = useState<Record<number, boolean>>({});
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

  const thumbIcon = (dir: "up" | "down") => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === "up" ? (
        <>
          <path d="M14 10V5a3 3 0 0 0-3-3l-1 7" />
          <path d="M7 22H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3" />
          <path d="M7 21h9.4a2 2 0 0 0 2-1.7l1.1-7A2 2 0 0 0 17.5 10H14" />
        </>
      ) : (
        <>
          <path d="M10 14v5a3 3 0 0 0 3 3l1-7" />
          <path d="M17 2h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3" />
          <path d="M17 3H7.6a2 2 0 0 0-2 1.7l-1.1 7A2 2 0 0 0 6.5 14H10" />
        </>
      )}
    </svg>
  );

  const feedbackBar = (
    <div className={styles.mcqFeedbackBar}>
      <div className={styles.voteGroup}>
        <button
          className={`${styles.voteBtn} ${mcqVotes[qIndex] === "up" ? styles.voteBtnActive : ""}`}
          onClick={() => setMcqVotes(prev => ({ ...prev, [qIndex]: prev[qIndex] === "up" ? null : "up" }))}
          aria-label="Thumbs up"
          aria-pressed={mcqVotes[qIndex] === "up"}
          type="button"
        >
          {thumbIcon("up")}
        </button>
        <button
          className={`${styles.voteBtn} ${mcqVotes[qIndex] === "down" ? styles.voteBtnActive : ""}`}
          onClick={() => setMcqVotes(prev => ({ ...prev, [qIndex]: prev[qIndex] === "down" ? null : "down" }))}
          aria-label="Thumbs down"
          aria-pressed={mcqVotes[qIndex] === "down"}
          type="button"
        >
          {thumbIcon("down")}
        </button>
      </div>
      <button
        className={styles.reportMistakeBtn}
        onClick={() => setReportedMistakes(prev => ({ ...prev, [qIndex]: !prev[qIndex] }))}
        type="button"
      >
        {reportedMistakes[qIndex] ? "Mistake reported" : "Report a mistake"}
      </button>
    </div>
  );

  /* ── Resizable split ── */
  const [slideWidth, setSlideWidth] = useState(55);
  const bodyRef    = useRef<HTMLDivElement>(null);
  const dragging   = useRef(false);
  const dividerRef    = useRef<HTMLDivElement>(null);
  const chatBottomRef   = useRef<HTMLDivElement>(null);
  const chatRestoredRef = useRef(false);  /* true while restoring history — suppresses probe */

  /* Auto-scroll chat to bottom whenever messages change */
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, aiTyping]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setVoiceState("transcribing");
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          console.log("[STT] blob size:", audioBlob.size, "chunks:", audioChunksRef.current.length);
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");
          const res = await fetch(
            `https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io/api/stt?language=${tutorLang}`,
            { method: "POST", body: formData }
          );
          console.log("[STT] response status:", res.status);
          /* Read as text first — backend may return plain text on 500 */
          const raw = await res.text();
          console.log("[STT] response raw:", raw);
          if (!res.ok) {
            /* Backend 500: STT service error — let user know and fall back */
            setChatError("Voice transcription failed — please type your answer.");
            setTimeout(() => setChatError(null), 4000);
            setVoiceState("idle");
            return;
          }
          const json = JSON.parse(raw);
          const text: string = json.text ?? "";
          if (text.trim()) {
            setChatInput(text.trim());
            setVoiceState("ready");
          } else {
            /* Empty transcription — let user retry or type */
            setVoiceState("idle");
          }
        } catch (err) {
          console.error("[STT] error:", err);
          setVoiceState("idle");
        }
      };
      recorder.start(250);  /* timeslice: chunks accumulate during recording, not after onstop */
      mediaRecorderRef.current = recorder;
      setVoiceState("recording");
    } catch {
      setVoiceState("idle");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  };

  const cancelVoice = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setChatInput("");
    setVoiceState("idle");
  };

  const startSessionWithUser = async (uid: string) => {
    setScreen("loading"); setLoadError(null);
    try {
      const { sessionId: sid, question: firstQuestion } = await createSession({
        courseId, mode, language: tutorLang, userId: uid || "unknown",
      });
      setSession(sid);
      applyQuestion(firstQuestion, 0);
      setScreen("question");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to start session");
      setScreen("loading");
    }
  };

  const startSession = useCallback(async (uid?: string) => {
    setScreen("loading"); setLoadError(null);

    /* ── Resume path: load existing completed session ── */
    if (resumeSessionId) {
      try {
        const stored = await getSession(resumeSessionId, courseId, uid);
        setSession(resumeSessionId);
        const hydrated = hydrateResults(stored);

        /* ── Restore chat history ── */
        const history = stored.chatHistory ?? [];

        /* Derive which question the learner was on last */
        const lastPos = history.length > 0
          ? (history[history.length - 1].questionPosition ?? 1)
          : 1;
        const resumeQIdx = Math.max(0, lastPos - 1);

        /* Normalise role: backend may store student messages as "user" */
        const activeMsgs = history
          .filter(m => m.questionPosition === lastPos)
          .map(m => ({
            role: (m.role === "user" ? "student" : m.role) as "ai" | "student",
            text: m.text,
          }));

        const turns = activeMsgs.filter(m => m.role === "student").length;

        if (activeMsgs.length > 0) {
          /* Set the restored flag BEFORE any state updates so runDebrief
             cannot fire between state flushes */
          chatRestoredRef.current = true;

          /* Batch all state in one synchronous pass */
          setResults(hydrated);
          setQuestions(hydrated.map(r => r.question));
          setDebriefQIdx(resumeQIdx);
          setChatMsgs(activeMsgs);
          setChatTurns(turns);
          setChatInput("");
          setChatError(null);
          setScreen("chat");

          /* Release the guard after React has flushed and rendered */
          requestAnimationFrame(() => {
            requestAnimationFrame(() => { chatRestoredRef.current = false; });
          });
        } else {
          /* No chat history — start a fresh debrief probe */
          setResults(hydrated);
          setQuestions(hydrated.map(r => r.question));
          startDebriefWithResults(hydrated);
        }
      } catch (err) {
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
      setScreen("loading"); /* stay on loading screen so error is visible */
    }
  }, [courseId, mode, tutorLang, resumeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    /* Resolve real userId before starting session */
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(s => {
        const uid = s?.user?.email ?? s?.user?.id ?? "";
        if (uid) { setCurrentUser(uid); setUserId(uid); }
        return uid;
      })
      .catch(() => "")
      .then(uid => {
        /* If resuming a session, use the original startSession which handles the resume path */
        if (resumeSessionId) {
          startSession(uid);
        } else {
          startSessionWithUser(uid);
        }
        /* Fetch PDF SAS URL */
        if (courseId) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io"}/api/courses/${courseId}/pdf-url?userId=${uid || "anonymous"}`)
            .then(r => r.json())
            .then(({ sasUrl }) => { if (sasUrl) setPdfSasUrl(sasUrl); })
            .catch(() => {});
        }
      });
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
      if (sid) {
        completeSession(sid, courseId).catch(() => {});
        /* Update exercisesDone on the course */
        updateCourse(courseId, { exercisesDone: MAX_QUESTIONS }).catch(() => {});
      }
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
    if (chatRestoredRef.current) return;  /* restored session — don't overwrite chat */
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
    if (sessionIdRef.current) {
      completeSession(sessionIdRef.current, courseId).catch(() => {});
      updateCourse(courseId, { exercisesDone: MAX_QUESTIONS }).catch(() => {});
    }
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
    if (chatRestoredRef.current) return;  /* don't fire probe while restoring */
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
          {loadError
            ? <div className={styles.errorBanner} style={{ maxWidth: 480, wordBreak: "break-word" }}>{loadError}</div>
            : <>
                <div className={styles.spinner} />
                <div className={styles.loadingText}>
                  {screen === "waiting" ? (ui.preparingQuestions ?? "Preparing…") : (ui.generating ?? "Generating…")}
                </div>
                <div className={styles.loadingHint}>
                  {screen === "waiting" ? (ui.preparingHint ?? "Analysing document…") : (ui.generatingHint ?? "Reading with AI")}
                </div>
                {screen === "waiting" && <div className={styles.retryHint}>{ui.retryHint ?? "Checking again…"}</div>}
              </>
          }
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
  if (screen === "question" && !mcq) {
    /* mcq null but screen=question means session created but question missing */
    return (
      <div className={styles.page}>
        {headerEl}
        <div className={styles.loadingPane}>
          <div className={styles.spinner} />
          <div className={styles.loadingText}>{loadError ?? (ui.generating ?? "Loading question…")}</div>
        </div>
      </div>
    );
  }

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
            {feedbackBar}
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
            {feedbackBar}
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
                  {/* Show letter + answer text, outcome mark only — correct answer hidden until conversation reveals it */}
                  <span className={focusR.selected === focusR.question.correctIndex ? styles.ctxBadgeCorrect : styles.ctxBadgeWrong}>
                    {LETTERS[focusR.selected]}. {focusR.question.options[focusR.selected]?.text}
                    {" "}{focusR.selected === focusR.question.correctIndex ? "✓" : "✗"}
                  </span>
                </div>
                {ctxExpanded && (
                  <div className={styles.ctxOptions} onClick={e => e.stopPropagation()}>
                    {focusR.question.options.map((opt, i) => {
                      const isCorr = i === focusR.question.correctIndex;
                      const isSel  = i === focusR.selected;
                      return (
                        <div key={i} className={[
                          styles.ctxOpt,
                          ctxRevealed && isCorr           ? styles.ctxOptCorrect : "",
                          isSel && !isCorr                ? styles.ctxOptWrong   : "",
                          (!isSel && !(ctxRevealed && isCorr)) ? styles.optDimmed : "",
                        ].join(" ")}>
                          <span className={styles.ctxOptLtr}>{LETTERS[i]}</span>
                          <span className={styles.ctxOptTxt}>{opt.text}</span>
                          {ctxRevealed && isCorr && <span className={styles.ctxOptMark}>✓</span>}
                          {isSel && !isCorr && <span className={styles.ctxOptMark}>✗</span>}
                        </div>
                      );
                    })}
                    {!ctxRevealed && (
                      <button
                        className={styles.ctxRevealBtn}
                        onClick={e => { e.stopPropagation(); setCtxRevealed(true); }}
                      >
                        Reveal answer
                      </button>
                    )}
                    {focusR.explanation && ctxRevealed && (
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
                  <div className={styles.chatMarkdown}>
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {normalizeMathMarkdown(msg.text)}
                    </ReactMarkdown>
                  </div>
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
              <div ref={chatBottomRef} />
            </div>

            {chatTurns < MAX_TURNS && (
              <div className={styles.chatInputWrap}>

                {/* ── Recording state ── */}
                {voiceState === "recording" && (
                  <div className={styles.voiceRecording}>
                    <div className={styles.voiceWaveform}>
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className={styles.voiceBar} style={{ animationDelay: `${i * 0.07}s` }} />
                      ))}
                    </div>
                    <span className={styles.voiceLabel}>Listening…</span>
                    <button className={styles.voiceStopBtn} onClick={stopRecording} aria-label="Stop recording">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                    </button>
                  </div>
                )}

                {/* ── Transcribing state ── */}
                {voiceState === "transcribing" && (
                  <div className={styles.voiceTranscribing}>
                    <div className={styles.voiceSpinner} />
                    <span className={styles.voiceTranscribingText}>Transcribing…</span>
                  </div>
                )}

                {/* ── Idle / ready: normal input box ── */}
                {(voiceState === "idle" || voiceState === "ready") && (
                  <div className={styles.chatInputBox}>
                    <textarea
                      className={styles.chatInput}
                      value={chatInput}
                      onChange={e => {
                        setChatInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey && chatInput.trim()) {
                          e.preventDefault();
                          setVoiceState("idle");
                          sendChat();
                        }
                      }}
                      placeholder={voiceState === "ready" ? "Edit transcript before sending…" : "Reply to the AI tutor…"}
                      rows={1}
                    />
                    <div className={styles.chatBtnGroup}>
                      {voiceState === "ready" ? (
                        <button className={styles.voiceClearBtn} onClick={cancelVoice} aria-label="Clear transcript" title="Clear and re-record">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      ) : (
                        <button className={styles.voiceMicBtn} onClick={startRecording} aria-label="Speak your answer" title="Speak your answer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
                            <path d="M19 10a7 7 0 0 1-14 0"/>
                            <line x1="12" y1="19" x2="12" y2="22"/>
                          </svg>
                        </button>
                      )}
                      <button
                        className={styles.chatSendBtn}
                        onClick={() => { setVoiceState("idle"); sendChat(); }}
                        disabled={!chatInput.trim() || aiTyping}
                        aria-label="Send"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                <div className={styles.chatMeta}>
                  <span>{chatTurns}/{MAX_TURNS} exchanges</span>
                  {voiceState === "ready"
                    ? <span style={{ color: "#185FA5" }}>Edit transcript · ↵ to send</span>
                    : <span>↵ to send · Shift+↵ new line</span>
                  }
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
