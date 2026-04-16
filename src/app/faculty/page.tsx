"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./faculty.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseSynthesis {
  title: string;
  domain: string;
  purpose: string;
  thesis: string;
  key_concepts: string[];
  structure: string;
  audience: string;
}

interface Course {
  id: string;
  title: string;
  author?: string;
  source?: string;
  mcqStatus: "none" | "generating" | "ready" | "failed";
  mcqCount?: number;
  synthesis?: CourseSynthesis;
  createdAt: string;
  updatedAt: string;
}

interface SessionQuestion {
  position: number;
  mcqId: string;
  question: string;
  options: string[];
  correctIndex?: number;
  correct_index?: number;
  function: "orient" | "understand" | "recognize" | "connect" | "evaluate";
  hasVisual?: boolean;
  has_visual?: boolean;
  selectedIndex?: number;
  selected_index?: number;
  isCorrect?: boolean;
  is_correct?: boolean;
  durationSec?: number;
  duration_sec?: number;
  studentExplanation?: string;
  student_explanation?: string;
  evaluationSignal?: string;
  evaluation_signal?: string;
  evaluationConfidence?: string;
  evaluation_confidence?: string;
  facultyInsight?: string;
  faculty_insight?: string;
}

interface ChatEntry {
  role: "ai" | "student";
  text: string;
  questionPosition?: number;
  question_position?: number;
  timestamp: string;
}

interface SessionSummary {
  totalQuestions?: number;
  total_questions?: number;
  correctCount?: number;
  correct_count?: number;
  totalDurationSec?: number;
  total_duration_sec?: number;
  signalBreakdown?: Record<string, number>;
  signal_breakdown?: Record<string, number>;
}

interface Session {
  id: string;
  courseId?: string;
  course_id?: string;
  userId?: string;
  user_id?: string;
  mode: "tutoring" | "assessment";
  language: string;
  status: string;
  startedAt?: string;
  started_at?: string;
  completedAt?: string;
  completed_at?: string;
  questions: SessionQuestion[];
  chatHistory?: ChatEntry[];
  chat_history?: ChatEntry[];
  summary: SessionSummary;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIGNAL_META: Record<string, { short: string; cssVar: string }> = {
  Strong:                  { short: "Strong",  cssVar: "--sig-strong"  },
  Fragile:                 { short: "Fragile", cssVar: "--sig-fragile" },
  "Partial misconception": { short: "Partial", cssVar: "--sig-partial" },
  "Low mastery":           { short: "Low",     cssVar: "--sig-low"     },
  unevaluated:             { short: "—",       cssVar: "--sig-none"    },
};

const FN_COLORS: Record<string, string> = {
  orient:     "#60a5fa",
  understand: "#34d399",
  recognize:  "#a78bfa",
  connect:    "#f59e0b",
  evaluate:   "#f87171",
};

// TODO: migrate to api.ts following the request<T> pattern
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScore(s: Session) {
  const c = s.summary?.correctCount ?? s.summary?.correct_count ?? 0;
  const t = s.summary?.totalQuestions ?? s.summary?.total_questions ?? 5;
  return { c, t, pct: t > 0 ? Math.round((c / t) * 100) : 0 };
}

function getBreakdown(s: Session): Record<string, number> {
  return s.summary?.signalBreakdown ?? s.summary?.signal_breakdown ?? {};
}

function getChatForQ(s: Session, pos: number): ChatEntry[] {
  return (s.chatHistory ?? s.chat_history ?? []).filter(
    (m) => (m.questionPosition ?? m.question_position) === pos
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(sec?: number): string {
  if (!sec) return "";
  return sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FacultyDashboard() {
  // Auth
  const [facultyId, setFacultyId] = useState("");

  // Left pane
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Middle pane
  const [studentEmailDraft, setStudentEmailDraft] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");

  // Right pane
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [expandedChat, setExpandedChat] = useState<number | null>(null);

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        const uid = s?.user?.email ?? s?.user?.id ?? "";
        setFacultyId(uid);
      })
      .catch(() => {});
  }, []);

  // ── Load courses ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!facultyId) return;
    setCoursesLoading(true);
    setCoursesError("");
    apiFetch<Course[] | { courses: Course[] }>(`/api/courses?userId=${facultyId}`)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.courses ?? []);
        setCourses(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      })
      .catch((e: Error) => setCoursesError(e.message))
      .finally(() => setCoursesLoading(false));
  }, [facultyId]);

  // ── Load sessions ───────────────────────────────────────────────────────────
  const loadSessions = useCallback(() => {
    if (!selectedCourse || !studentEmail) return;
    setSessionsLoading(true);
    setSessionsError("");
    setSessions([]);
    setSelectedSession(null);
    setExpandedQ(null);
    setExpandedChat(null);
    apiFetch<Session[] | { sessions: Session[] }>(
      `/api/sessions?courseId=${selectedCourse.id}&userId=${encodeURIComponent(studentEmail)}`
    )
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.sessions ?? []);
        setSessions(list);
      })
      .catch((e: Error) => setSessionsError(e.message))
      .finally(() => setSessionsLoading(false));
  }, [selectedCourse, studentEmail]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── Open session detail ─────────────────────────────────────────────────────
  const openSession = useCallback(
    (s: Session) => {
      if (selectedSession?.id === s.id) {
        setSelectedSession(null);
        return;
      }
      setExpandedQ(null);
      setExpandedChat(null);
      setSessionLoading(true);
      const courseId = s.courseId ?? s.course_id ?? selectedCourse?.id ?? "";
      apiFetch<Session>(`/api/sessions/${s.id}?courseId=${courseId}`)
        .then((full) => setSelectedSession(full))
        .catch(() => setSelectedSession(s)) // fallback to list-level data
        .finally(() => setSessionLoading(false));
    },
    [selectedSession, selectedCourse]
  );

  // ── Select course ───────────────────────────────────────────────────────────
  const selectCourse = (c: Course) => {
    setSelectedCourse(c);
    setSessions([]);
    setSelectedSession(null);
    setStudentEmail("");
    setStudentEmailDraft("");
    setExpandedQ(null);
    setExpandedChat(null);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.shell}>

      {/* ── LEFT: Course list ─────────────────────────────────────────────── */}
      <aside className={styles.paneLeft}>
        <div className={styles.paneHeader}>
          <span className={styles.eyebrow}>Courses</span>
          {facultyId && (
            <span className={styles.headerMeta} title={facultyId}>
              {facultyId.split("@")[0]}
            </span>
          )}
        </div>

        {coursesLoading && <p className={styles.hint}>Loading…</p>}
        {coursesError && <p className={styles.errorMsg}>{coursesError}</p>}

        <ul className={styles.courseList}>
          {courses.map((c) => (
            <li
              key={c.id}
              className={`${styles.courseItem} ${selectedCourse?.id === c.id ? styles.courseItemActive : ""}`}
              onClick={() => selectCourse(c)}
            >
              <div className={styles.courseTitle}>{c.title}</div>
              <div className={styles.courseMeta}>
                <span className={`${styles.statusDot} ${styles[`status_${c.mcqStatus}`]}`} />
                <span className={styles.statusLabel}>{c.mcqStatus}</span>
                {c.mcqCount != null && (
                  <span className={styles.mcqCount}>{c.mcqCount} Q</span>
                )}
              </div>
            </li>
          ))}
          {!coursesLoading && courses.length === 0 && !coursesError && (
            <p className={styles.hint}>No courses found.</p>
          )}
        </ul>
      </aside>

      {/* ── MIDDLE: Sessions ──────────────────────────────────────────────── */}
      <section className={styles.paneMiddle}>
        {!selectedCourse ? (
          <div className={styles.emptyState}>
            <span className={styles.eyebrow}>Select a course</span>
            <p>Choose a course from the panel on the left.</p>
          </div>
        ) : (
          <>
            <div className={styles.paneHeader}>
              <span className={styles.eyebrow}>Sessions</span>
              <span className={styles.headerMeta} title={selectedCourse.title}>
                {selectedCourse.title}
              </span>
            </div>

            {/* Synthesis strip */}
            {selectedCourse.synthesis && (
              <div className={styles.synthesisStrip}>
                <span className={styles.eyebrow}>Synthesis</span>
                <p className={styles.synthesisThesis}>
                  {selectedCourse.synthesis.thesis}
                </p>
                <div className={styles.conceptRow}>
                  {selectedCourse.synthesis.key_concepts.slice(0, 5).map((k) => (
                    <span key={k} className={styles.conceptChip}>
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Student selector */}
            <div className={styles.studentBlock}>
              <div className={styles.studentInputRow}>
                <input
                  className={styles.studentInput}
                  type="email"
                  placeholder="Student email…"
                  value={studentEmailDraft}
                  onChange={(e) => setStudentEmailDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setStudentEmail(studentEmailDraft.trim());
                  }}
                />
                <button
                  className={styles.loadBtn}
                  onClick={() => setStudentEmail(studentEmailDraft.trim())}
                >
                  Load
                </button>
              </div>
              <p className={styles.apiNote}>
                {/* Flagged: cross-student view needs GET /api/sessions?courseId={id} (no userId filter) */}
                Multi-student view pending backend endpoint
              </p>
            </div>

            {/* Session list */}
            {sessionsLoading && <p className={styles.hint}>Loading sessions…</p>}
            {sessionsError && <p className={styles.errorMsg}>{sessionsError}</p>}

            {sessions.length > 0 && (
              <ul className={styles.sessionList}>
                {sessions.map((s, i) => {
                  const { c, t, pct } = getScore(s);
                  const bd = getBreakdown(s);
                  const isActive = selectedSession?.id === s.id;
                  const startedAt = s.startedAt ?? s.started_at ?? "";
                  const dur =
                    s.summary?.totalDurationSec ?? s.summary?.total_duration_sec;
                  return (
                    <li
                      key={s.id}
                      className={`${styles.sessionCard} ${isActive ? styles.sessionCardActive : ""}`}
                      onClick={() => openSession(s)}
                    >
                      <div className={styles.sessionCardTop}>
                        <span className={styles.sessionIndex}>
                          #{sessions.length - i}
                        </span>
                        <span className={styles.sessionDate}>
                          {formatDate(startedAt)}
                        </span>
                        <span className={styles.sessionLang}>{s.language}</span>
                        <span
                          className={`${styles.sessionMode} ${styles[`mode_${s.mode}`]}`}
                        >
                          {s.mode}
                        </span>
                      </div>

                      <div className={styles.scoreRow}>
                        <div className={styles.scoreBar}>
                          <div
                            className={styles.scoreBarFill}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={styles.scoreLabel}>{c}/{t}</span>
                        <span className={styles.scorePct}>{pct}%</span>
                        {dur != null && dur > 0 && (
                          <span className={styles.duration}>
                            {formatDuration(dur)}
                          </span>
                        )}
                      </div>

                      <div className={styles.signalRow}>
                        {Object.entries(SIGNAL_META).map(([key, { short, cssVar }]) => {
                          const n = bd[key] ?? 0;
                          if (n === 0) return null;
                          return (
                            <span
                              key={key}
                              className={styles.signalChip}
                              style={
                                { "--chip-color": `var(${cssVar})` } as React.CSSProperties
                              }
                            >
                              {short} {n}
                            </span>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {!sessionsLoading && studentEmail && sessions.length === 0 && !sessionsError && (
              <p className={styles.hint}>No sessions for {studentEmail}.</p>
            )}
          </>
        )}
      </section>

      {/* ── RIGHT: Session detail ─────────────────────────────────────────── */}
      <section className={styles.paneRight}>
        {!selectedSession ? (
          <div className={styles.emptyState}>
            {sessionLoading ? (
              <p className={styles.hint}>Loading session…</p>
            ) : (
              <>
                <span className={styles.eyebrow}>Session detail</span>
                <p>Select a session to inspect results and chat replay.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className={styles.paneHeader}>
              <span className={styles.eyebrow}>Session detail</span>
              <span
                className={styles.statusBadge}
                data-status={selectedSession.status}
              >
                {selectedSession.status}
              </span>
              <span className={styles.headerMeta} style={{ marginLeft: "auto" }}>
                {formatDate(
                  selectedSession.startedAt ?? selectedSession.started_at
                )}
              </span>
            </div>

            {/* Summary bar */}
            {(() => {
              const { c, t, pct } = getScore(selectedSession);
              const dur =
                selectedSession.summary?.totalDurationSec ??
                selectedSession.summary?.total_duration_sec;
              const bd = getBreakdown(selectedSession);
              return (
                <div className={styles.summaryBar}>
                  <div className={styles.summaryScore}>
                    <span className={styles.summaryScoreBig}>{pct}%</span>
                    <span className={styles.summaryScoreSub}>{c} / {t}</span>
                  </div>
                  <div className={styles.summarySignals}>
                    {Object.entries(SIGNAL_META).map(([key, { short, cssVar }]) => (
                      <div key={key} className={styles.summarySignalItem}>
                        <span
                          className={styles.summarySignalN}
                          style={{ color: `var(${cssVar})` }}
                        >
                          {bd[key] ?? 0}
                        </span>
                        <span className={styles.summarySignalLabel}>{short}</span>
                      </div>
                    ))}
                  </div>
                  {dur != null && dur > 0 && (
                    <span className={styles.summaryDur}>{formatDuration(dur)}</span>
                  )}
                </div>
              );
            })()}

            {/* Question list */}
            <ul className={styles.qList}>
              {selectedSession.questions.map((q) => {
                const signal =
                  q.evaluationSignal ?? q.evaluation_signal ?? "unevaluated";
                const sigMeta =
                  SIGNAL_META[signal] ?? SIGNAL_META["unevaluated"];
                const isCorrect = q.isCorrect ?? q.is_correct ?? false;
                const selIdx = q.selectedIndex ?? q.selected_index ?? -1;
                const corrIdx = q.correctIndex ?? q.correct_index ?? 0;
                const dur = q.durationSec ?? q.duration_sec;
                const explanation =
                  q.studentExplanation ?? q.student_explanation;
                const insight = q.facultyInsight ?? q.faculty_insight;
                const fnColor = FN_COLORS[q.function] ?? "#999";
                const chat = getChatForQ(selectedSession, q.position);
                const isQOpen = expandedQ === q.position;
                const isChatOpen = expandedChat === q.position;

                return (
                  <li key={q.position} className={styles.qCard}>
                    {/* Header row */}
                    <div
                      className={styles.qHeader}
                      onClick={() =>
                        setExpandedQ(isQOpen ? null : q.position)
                      }
                    >
                      <span className={styles.qPos}>Q{q.position}</span>
                      <span
                        className={styles.qFn}
                        style={{ color: fnColor }}
                      >
                        {q.function}
                      </span>
                      <span
                        className={`${styles.qCorrect} ${isCorrect ? styles.correct : styles.incorrect}`}
                      >
                        {isCorrect ? "✓" : "✗"}
                      </span>
                      <span
                        className={styles.qSignal}
                        style={{ color: `var(${sigMeta.cssVar})` }}
                      >
                        {sigMeta.short}
                      </span>
                      {dur != null && (
                        <span className={styles.qDur}>{dur}s</span>
                      )}
                      <span className={styles.qChevron}>
                        {isQOpen ? "▲" : "▼"}
                      </span>
                    </div>

                    {/* Body */}
                    {isQOpen && (
                      <div className={styles.qBody}>
                        <p className={styles.qText}>{q.question}</p>

                        <ul className={styles.optionList}>
                          {q.options.map((opt, idx) => (
                            <li
                              key={idx}
                              className={[
                                styles.option,
                                idx === corrIdx ? styles.optionCorrect : "",
                                idx === selIdx && idx !== corrIdx
                                  ? styles.optionWrong
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <span className={styles.optionLetter}>
                                {String.fromCharCode(65 + idx)}
                              </span>
                              {opt}
                            </li>
                          ))}
                        </ul>

                        {explanation && (
                          <div className={styles.explanationBlock}>
                            <span className={styles.eyebrow}>
                              Student explanation
                            </span>
                            <p className={styles.explanationText}>
                              {explanation}
                            </p>
                          </div>
                        )}

                        {insight && (
                          <div className={styles.insightBlock}>
                            <span className={styles.eyebrow}>
                              Faculty insight
                            </span>
                            <p className={styles.insightText}>{insight}</p>
                          </div>
                        )}

                        {chat.length > 0 && (
                          <div className={styles.chatSection}>
                            <button
                              className={styles.chatToggleBtn}
                              onClick={() =>
                                setExpandedChat(isChatOpen ? null : q.position)
                              }
                            >
                              {isChatOpen ? "Hide" : "Show"} chat replay (
                              {chat.length} turns)
                            </button>
                            {isChatOpen && (
                              <div className={styles.chatReplay}>
                                {chat.map((m, mi) => (
                                  <div
                                    key={mi}
                                    className={`${styles.chatMsg} ${m.role === "ai" ? styles.chatMsgAi : styles.chatMsgStudent}`}
                                  >
                                    <span className={styles.chatRole}>
                                      {m.role === "ai" ? "Tutor" : "Student"}
                                    </span>
                                    <p className={styles.chatText}>{m.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
