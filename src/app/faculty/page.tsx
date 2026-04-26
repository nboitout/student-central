"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./faculty.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type MCQFunction = "orient" | "understand" | "recognize" | "connect" | "evaluate";
type RightPanel  =
  | "empty" | "edit-q" | "new-q" | "student-detail"
  | "invite" | "generate-similar" | "group-detail" | "group-create";
type Mode        = "questions" | "share" | "students" | "analytics";

interface MCQOption { letter: string; text: string; }

interface MCQDoc {
  id: string;
  question: string;
  options: MCQOption[];
  correctIndex: number;
  explanation: string;
  function: MCQFunction;
  pageNumber: number;
  hasVisual: boolean;
  position?: number;  /* faculty-assigned playlist position — undefined = auto */
}

type RawMCQDoc = Partial<MCQDoc> & {
  level?: string;
  correct_index?: number;
  page_number?: number;
  has_visual?: boolean;
};

interface Course {
  id:        string;
  isOwned?:  boolean;
  title:     string;
  mcqStatus: "ready" | "generating" | "none" | "failed";
  mcqCount:  number;
  synthesis: { thesis?: string; key_concepts?: string[] } | null;
  allowDownload: boolean;
  visibleProgressTracking: boolean;
  /* Real API may include additional fields — ignored here */
  [key: string]: unknown;
}

interface MockStudent {
  id: string;
  email: string;
  initials: string;
  status: "active" | "invited" | "pending";
  joinedAt: string;
  sessions: number;
  avgScore: number;
  signalBreakdown: Record<string, number>;
  functionCoverage: MCQFunction[];
  weakConcepts: string[];
}

interface AccessEntry {
  email:        string;
  status:       "invited" | "pending" | "active" | "declined";
  sharedAt:     string;
  sessionCount: number;
}

interface Group {
  id:        string;
  name:      string;
  facultyId: string;
  members:   string[];
  courseIds: string[];
  createdAt: string;
  updatedAt?: string;
}

interface GroupAnalytics {
  sessions: unknown[];
  memberCount: number;
}

interface EditDraft {
  id?: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  function: MCQFunction;
  pageNumber: number | "";
  hasVisual: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STUDENTS: MockStudent[] = [
  { id: "s1", email: "alice.bernard@m2.univ.fr", initials: "AB", status: "active",
    joinedAt: "10 Apr 2026", sessions: 3, avgScore: 74,
    signalBreakdown: { Strong: 5, Fragile: 4, "Partial misconception": 3, "Low mastery": 1, unevaluated: 2 },
    functionCoverage: ["orient", "understand", "recognize"],
    weakConcepts: ["Canary vs blue-green trade-offs"] },
  { id: "s2", email: "c.martin@m2.univ.fr", initials: "CM", status: "active",
    joinedAt: "11 Apr 2026", sessions: 2, avgScore: 52,
    signalBreakdown: { Strong: 2, Fragile: 3, "Partial misconception": 4, "Low mastery": 1, unevaluated: 0 },
    functionCoverage: ["orient", "understand"],
    weakConcepts: ["Delegate architecture", "Verification triggers"] },
  { id: "s3", email: "t.dupont@m2.univ.fr", initials: "TD", status: "invited",
    joinedAt: "—", sessions: 0, avgScore: 0,
    signalBreakdown: { Strong: 0, Fragile: 0, "Partial misconception": 0, "Low mastery": 0, unevaluated: 0 },
    functionCoverage: [], weakConcepts: [] },
  { id: "s4", email: "l.rey@m2.univ.fr", initials: "LR", status: "pending",
    joinedAt: "—", sessions: 0, avgScore: 0,
    signalBreakdown: { Strong: 0, Fragile: 0, "Partial misconception": 0, "Low mastery": 0, unevaluated: 0 },
    functionCoverage: [], weakConcepts: [] },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const FN_ORDER: MCQFunction[] = ["orient", "understand", "recognize", "connect", "evaluate"];

const FN_DISTRIBUTION: Record<MCQFunction, number> = {
  orient: 4, understand: 5, recognize: 5, connect: 4, evaluate: 2,
};

const SIGNAL_META = [
  { key: "Strong",                short: "Strong",  cls: "sigStrong"  },
  { key: "Fragile",               short: "Fragile", cls: "sigFragile" },
  { key: "Partial misconception", short: "Partial", cls: "sigPartial" },
  { key: "Low mastery",           short: "Low",     cls: "sigLow"     },
  { key: "unevaluated",           short: "—",       cls: "sigNone"    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusPillCls(status: MockStudent["status"] | AccessEntry["status"], s: Record<string, string>) {
  if (status === "active")  return `${s.pill} ${s.pillActive}`;
  if (status === "invited") return `${s.pill} ${s.pillInvited}`;
  return `${s.pill} ${s.pillPending}`;
}

function emailInitials(email: string): string {
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function blankDraft(): EditDraft {
  return { question: "", options: ["", "", "", ""], correctIndex: 0,
           explanation: "", function: "orient", pageNumber: "", hasVisual: false };
}

function parseStudentEmails(text: string): string[] {
  const emails = text
    .split(/\r?\n/)
    .map(line => line.trim().split(/[;,]/)[0]?.trim().toLowerCase() ?? "")
    .filter(line => line.includes("@"));
  return Array.from(new Set(emails));
}

function normalizeGroup(group: Partial<Group>): Group {
  return {
    id: group.id ?? `g${Date.now()}`,
    name: group.name ?? "Untitled group",
    facultyId: group.facultyId ?? "",
    members: Array.isArray(group.members) ? group.members : [],
    courseIds: Array.isArray(group.courseIds) ? group.courseIds : [],
    createdAt: group.createdAt ?? new Date().toISOString(),
    updatedAt: group.updatedAt,
  };
}

function draftFromDoc(q: MCQDoc): EditDraft {
  return { id: q.id, question: q.question,
           options: [
             q.options[0]?.text ?? "",
             q.options[1]?.text ?? "",
             q.options[2]?.text ?? "",
             q.options[3]?.text ?? "",
           ],
           correctIndex: q.correctIndex, explanation: q.explanation,
           function: q.function, pageNumber: q.pageNumber, hasVisual: q.hasVisual };
}

// ─── Reformulation result type ────────────────────────────────────────────────

interface ReformResult { original: string; reformulated: string; }

function ReformulationPanel({ result, onKeep, onAccept }: {
  result:    ReformResult;
  onKeep:    () => void;
  onAccept:  (finalText: string) => void;
}) {
  const [editing,    setEditing]    = useState(false);
  const [editedText, setEditedText] = useState(result.reformulated);

  const enterEdit = () => {
    setEditedText(result.reformulated);
    setEditing(true);
  };

  return (
    <div className={styles.reformulationPanel}>
      <div className={styles.reformulationHd}>
        <span className={styles.reformulationHdLabel}>
          {editing ? "Edit reformulation" : "Reformulation ready"}
        </span>
        <button className={styles.reformulationDismiss} onClick={onKeep}>✕</button>
      </div>
      <div className={styles.reformulationCompare}>
        <div className={styles.reformulationCol}>
          <span className={styles.reformulationColLabel}>Original</span>
          <p className={styles.reformulationText}>{result.original}</p>
        </div>
        <div className={styles.reformulationCol}>
          <span className={styles.reformulationColLabel}>
            {editing ? "Your edit" : "Reformulated"}
          </span>
          {editing ? (
            <textarea
              className={styles.reformulationEditArea}
              value={editedText}
              onChange={e => setEditedText(e.target.value)}
              autoFocus
              rows={4}
            />
          ) : (
            <p className={`${styles.reformulationText} ${styles.reformulationTextNew}`}>
              {result.reformulated}
            </p>
          )}
        </div>
      </div>
      <div className={styles.reformulationActions}>
        <button className={styles.keepBtn} onClick={onKeep}>Keep original</button>
        {!editing && (
          <button className={styles.editReformBtn} onClick={enterEdit}>Edit ↗</button>
        )}
        <button
          className={styles.acceptBtn}
          onClick={() => onAccept(editing ? editedText.trim() || result.reformulated : result.reformulated)}
          disabled={editing && !editedText.trim()}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

// ─── QuestionEditor ───────────────────────────────────────────────────────────

interface AcceptedReform { original: string; reformulated: string; }

function QuestionEditor({ draft, onChange, onSave, onCancel, onDelete, courseTitle }: {
  draft: EditDraft;
  onChange: (d: EditDraft) => void;
  onSave: (accepted: Record<string, AcceptedReform>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  courseTitle: string;
}) {
  const set = (patch: Partial<EditDraft>) => onChange({ ...draft, ...patch });
  const setOpt = (i: number, val: string) => {
    const opts = [...draft.options] as [string, string, string, string];
    opts[i] = val;
    set({ options: opts });
  };

  const [reformulating,    setReformulating]    = useState<string | null>(null);
  const [replacing,        setReplacing]        = useState<string | null>(null);
  const [replaceErrors,    setReplaceErrors]    = useState<Record<string, string>>({});
  const [pending,          setPending]          = useState<Record<string, ReformResult>>({});
  const [acceptedReforms,  setAcceptedReforms]  = useState<Record<string, AcceptedReform>>({});

  const reformulate = async (field: string, text: string) => {
    if (!text.trim() || reformulating) return;
    setReformulating(field);
    setPending(prev => { const n = { ...prev }; delete n[field]; return n; });
    try {
      const API = process.env.NEXT_PUBLIC_API_URL
        ?? "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";
      const type = field === "question"    ? "question"
                 : field === "explanation" ? "explanation"
                 :                          "option";
      const res = await fetch(`${API}/api/mcq/reformulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          type,
          pedagogical_function: draft.function,
          course_title:         courseTitle,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const { reformulated } = await res.json();
      setPending(prev => ({ ...prev, [field]: { original: text, reformulated } }));
    } catch (e) {
      console.warn("Reformulate failed:", e);
      /* Endpoint not yet live — fall back to mock so the UI remains usable */
      const swaps: [RegExp, string][] = [
        [/Which/,        "What"],
        [/What is/,      "Identify the"],
        [/illustrates/,  "depicts"],
        [/describes/,    "outlines"],
        [/primary/,      "main"],
        [/relationship/, "connection"],
        [/component/,    "element"],
        [/strategy/,     "approach"],
        [/addresses/,    "tackles"],
        [/fundamental/,  "core"],
      ];
      let reformulated = text;
      for (const [pat, rep] of swaps) {
        if (pat.test(reformulated)) { reformulated = reformulated.replace(pat, rep); break; }
      }
      if (reformulated === text) reformulated = text.replace(/\?$/, " — select the best answer.");
      setPending(prev => ({ ...prev, [field]: { original: text, reformulated } }));
    } finally {
      setReformulating(null);
    }
  };

  const replaceDistractor = async (field: string, optionIndex: number) => {
    if (optionIndex === draft.correctIndex || replacing) return;
    const currentDistractor = draft.options[optionIndex]?.trim();
    const correctAnswer = draft.options[draft.correctIndex]?.trim();
    if (!draft.question.trim() || !currentDistractor || !correctAnswer) return;

    setReplacing(field);
    setPending(prev => { const n = { ...prev }; delete n[field]; return n; });
    setReplaceErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

    try {
      const API = process.env.NEXT_PUBLIC_API_URL
        ?? "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";
      const res = await fetch(`${API}/api/mcq/distractor/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: draft.question,
          correctAnswer,
          currentDistractor,
          existingOptions: draft.options,
          explanation: draft.explanation,
          pedagogical_function: draft.function,
          course_title: courseTitle,
          pageNumber: Number(draft.pageNumber) || 0,
          optionIndex,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const replacement = data.distractor ?? data.replacement ?? data.option ?? data.text ?? "";
      if (!replacement.trim()) throw new Error("Empty distractor replacement");
      setPending(prev => ({ ...prev, [field]: { original: currentDistractor, reformulated: replacement.trim() } }));
    } catch (e) {
      console.warn("Distractor replacement failed:", e);
      setReplaceErrors(prev => ({ ...prev, [field]: "Replacement unavailable" }));
    } finally {
      setReplacing(null);
    }
  };
  const applyToField = (field: string, text: string) => {
    if (field === "question")    { set({ question: text });    return; }
    if (field === "explanation") { set({ explanation: text }); return; }
    const idx = parseInt(field.replace("opt-", ""));
    const opts = [...draft.options] as [string, string, string, string];
    opts[idx] = text;
    set({ options: opts });
  };

  const dismiss = (field: string) =>
    setPending(prev => { const n = { ...prev }; delete n[field]; return n; });

  const acceptReform = (field: string, finalText: string) => {
    const result = pending[field];
    applyToField(field, finalText);
    setAcceptedReforms(prev => ({ ...prev, [field]: { original: result.original, reformulated: finalText } }));
    dismiss(field);
  };

  const rfClass = (field: string) =>
    reformulating === field
      ? `${styles.reformulateBtn} ${styles.reformulateBtnLoading}`
      : styles.reformulateBtn;

  const rfOptClass = (field: string) =>
    reformulating === field
      ? `${styles.reformulateBtnOpt} ${styles.reformulateBtnLoading}`
      : styles.reformulateBtnOpt;

  const replaceClass = (field: string) =>
    replacing === field
      ? `${styles.replaceDistractorBtn} ${styles.reformulateBtnLoading}`
      : styles.replaceDistractorBtn;

  return (
    <div className={styles.editorShell}>
      <div className={styles.editorScroll}>

        {/* ── Question ── */}
        <div className={styles.editorSection}>
          <label className={styles.fieldLabel}>Question text</label>
          <div className={styles.textareaWrapper}>
            <textarea className={styles.fieldTextarea} rows={3}
              value={draft.question} onChange={e => set({ question: e.target.value })}
              placeholder="Type the question…" />
            <button className={rfClass("question")}
              onClick={() => reformulate("question", draft.question)}
              disabled={!!reformulating || !draft.question.trim()} title="Reformulate with AI">
              {reformulating === "question" ? "Reformulating…" : "Reformulate"}
            </button>
          </div>
        </div>
        {pending["question"] && (
          <ReformulationPanel result={pending["question"]}
            onKeep={()   => dismiss("question")}
            onAccept={(t) => acceptReform("question", t)} />
        )}

        {/* ── Options ── */}
        <div className={styles.editorSection}>
          <label className={styles.fieldLabel}>Options — click letter to mark correct</label>
          {draft.options.map((opt, i) => {
            const field = `opt-${i}`;
            return (
              <div key={i}>
                <div className={`${styles.optEditorRow} ${draft.correctIndex === i ? styles.optEditorCorrect : ""}`}>
                  <button
                    className={`${styles.correctBtn} ${draft.correctIndex === i ? styles.correctBtnActive : ""}`}
                    onClick={() => set({ correctIndex: i })}>
                    {String.fromCharCode(65 + i)}
                  </button>
                  <div className={styles.optInputWrapper}>
                    <input className={styles.optInput} value={opt}
                      onChange={e => setOpt(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}…`} />
                    <button className={rfOptClass(field)}
                      onClick={() => reformulate(field, opt)}
                      disabled={!!reformulating || !opt.trim()} title="Reformulate with AI">
                      {reformulating === field ? "…" : "Reformulate"}
                    </button>
                    {draft.correctIndex !== i && (
                      <button className={replaceClass(field)}
                        onClick={() => replaceDistractor(field, i)}
                        disabled={!!replacing || !draft.question.trim() || !draft.options[draft.correctIndex]?.trim() || !opt.trim()}
                        title="Generate a new distractor">
                        {replacing === field ? "…" : "Replace"}
                      </button>
                    )}
                  </div>
                </div>
                {replaceErrors[field] && (
                  <div className={styles.replaceError}>{replaceErrors[field]}</div>
                )}
                {pending[field] && (
                  <ReformulationPanel result={pending[field]}
                    onKeep={()   => dismiss(field)}
                    onAccept={(t) => acceptReform(field, t)} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Explanation ── */}
        <div className={styles.editorSection}>
          <div className={styles.explanationHeader}>
            <label className={styles.fieldLabel}>Explanation</label>
            <label className={styles.pageRefControl}>
              <span className={styles.fieldLabel}>Page ref</span>
              <input className={styles.pageRefInput} type="number" min={1}
                value={draft.pageNumber}
                onChange={e => set({ pageNumber: e.target.value === "" ? "" : Number(e.target.value) })}
                placeholder="—" />
            </label>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea className={styles.fieldTextarea} rows={3}
              value={draft.explanation} onChange={e => set({ explanation: e.target.value })}
              placeholder="Why is this the correct answer?" />
            <button className={rfClass("explanation")}
              onClick={() => reformulate("explanation", draft.explanation)}
              disabled={!!reformulating || !draft.explanation.trim()} title="Reformulate with AI">
              {reformulating === "explanation" ? "Reformulating…" : "Reformulate"}
            </button>
          </div>
        </div>
        {pending["explanation"] && (
          <ReformulationPanel result={pending["explanation"]}
            onKeep={()   => dismiss("explanation")}
            onAccept={(t) => acceptReform("explanation", t)} />
        )}

        {/* ── Meta ── */}
        <div className={styles.editorSection}>
          <div className={styles.metaRow}>
            <div className={styles.metaField}>
              <label className={styles.fieldLabel}>Function</label>
              <select className={styles.fieldSelect} value={draft.function}
                onChange={e => set({ function: e.target.value as MCQFunction })}>
                {FN_ORDER.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>

            <div className={styles.metaField}>
              <label className={styles.fieldLabel}>Has visual</label>
              <button className={`${styles.toggleBtn} ${draft.hasVisual ? styles.toggleBtnOn : ""}`}
                onClick={() => set({ hasVisual: !draft.hasVisual })}>
                {draft.hasVisual ? "Yes" : "No"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.editorActions}>
        <button className={styles.saveBtn} onClick={() => { onSave(acceptedReforms); setAcceptedReforms({}); }}>
          {draft.id ? "Save changes" : "Create question"}
        </button>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        {onDelete && (
          <button className={styles.deleteBtn} onClick={onDelete}>Delete question</button>
        )}
      </div>
    </div>
  );
}


// ─── Teach Intro Modal ────────────────────────────────────────────────────────

function TeachIntro({ onClose }: { onClose: () => void }) {
  const [dontShow, setDontShow] = React.useState(false);

  const handleClose = () => {
    if (dontShow) {
      try { localStorage.setItem("teachIntroSeen", "true"); } catch {}
    }
    onClose();
  };

  const TABS: [string, string][] = [
    ["Questions", "Review and edit the MCQ bank generated from your course PDF — reorder, reformulate, or add questions manually."],
    ["Students",  "Manage your class roster, send bulk invitations, and track who has joined."],
    ["Share",     "Grant students access to your course in one click — they see it instantly in their workspace, no email needed."],
    ["Analytics", "Monitor session performance, signal breakdowns, and weak concepts across your whole class."],
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      padding: "40px 32px 32px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: "0.625rem", fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--primary)", marginBottom: 8,
        }}>Faculty dashboard</div>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 700,
          color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.2,
          marginBottom: 12,
        }}>Welcome to Teach</div>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.875rem",
          color: "var(--on-surface-variant)", lineHeight: 1.65, margin: 0,
        }}>
          The four tabs above are your instructor toolkit. Here&apos;s what each one does:
        </p>
      </div>

      {/* Tab descriptions — visually linked to the 4 tabs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
        {TABS.map(([tab, desc], i) => (
          <div key={tab} style={{
            borderLeft: "3px solid var(--primary)",
            paddingLeft: 16, paddingBottom: 24,
            opacity: 1 - i * 0.08,
          }}>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: "0.6875rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--primary)", marginBottom: 5,
            }}>{tab}</div>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: "0.8125rem",
              color: "var(--on-surface-variant)", lineHeight: 1.6,
            }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "0.5px solid var(--outline-variant)",
        paddingTop: 20, display: "flex",
        alignItems: "center", justifyContent: "space-between",
      }}>
        <label style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          fontFamily: "var(--font-body)", fontSize: "0.8125rem",
          color: "var(--on-surface-variant)",
        }}>
          <input
            type="checkbox"
            checked={dontShow}
            onChange={e => setDontShow(e.target.checked)}
            style={{ width: 14, height: 14, cursor: "pointer", accentColor: "var(--primary)" }}
          />
          Don&apos;t show me this again
        </label>
        <button onClick={handleClose} style={{
          fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 700,
          color: "#fff", background: "var(--primary)", border: "none",
          padding: "9px 24px", cursor: "pointer", transition: "opacity 0.15s",
        }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          Got it →
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FacultyDashboard() {
  const [courses,        setCourses]        = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeMode, setActiveMode]         = useState<Mode>("questions");
  const [rightPanel, setRightPanel]         = useState<RightPanel>("empty");
  const [mcqBank, setMcqBank]               = useState<MCQDoc[]>([]);
  const [mcqLoading,    setMcqLoading]    = useState(false);
  const [playlistMode,  setPlaylistMode] = useState(false);
  const [playlistOrder, setPlaylistOrder] = useState<MCQDoc[]>([]);
  const [dragIdx,       setDragIdx]      = useState<number | null>(null);
  const [editDraft, setEditDraft]           = useState<EditDraft | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<MockStudent | null>(null);
  const [leftCollapsed, setLeftCollapsed]   = useState(false);
  const [slideExpanded, setSlideExpanded]   = useState(true);
  const [coursePdfUrl, setCoursePdfUrl]     = useState<string | null>(null);
  const [coursePdfLoading, setCoursePdfLoading] = useState(false);
  const [coursePdfError, setCoursePdfError] = useState<string | null>(null);
  const [facultyId, setFacultyId]           = useState("nicolas");
  const [middleWidth, setMiddleWidth]       = useState(380);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState<boolean>(() => {
    try { return localStorage.getItem("skipQuestionDeleteConfirm") === "true"; } catch { return false; }
  });
  const [dontShowDeleteConfirm, setDontShowDeleteConfirm] = useState(false);
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try { return localStorage.getItem("teachIntroSeen") !== "true"; } catch { return true; }
  });

  // Groups
  const [groups,         setGroups]         = useState<Group[]>([]);
  const [groupsLoading,  setGroupsLoading]  = useState(false);
  const [selectedGroup,  setSelectedGroup]  = useState<Group | null>(null);
  const [pendingCsv,     setPendingCsv]     = useState<string[] | null>(null);
  const [newGroupName,   setNewGroupName]   = useState("");

  // Analytics view toggle
  const [analyticsView,  setAnalyticsView]  = useState<"students" | "group">("students");
  const [analyticsGroup, setAnalyticsGroup] = useState<Group | null>(null);
  const [groupAnalytics, setGroupAnalytics] = useState<GroupAnalytics | null>(null);
  const [groupAnalyticsLoading, setGroupAnalyticsLoading] = useState(false);

  // ── Share tab state ──
  const [shareAccess,  setShareAccess]  = useState<AccessEntry[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareEmail,   setShareEmail]   = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL
    ?? "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";

  const startMiddleResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = middleWidth;
    const leftWidth = leftCollapsed ? 48 : 210;
    const minWidth = 280;
    const minRightWidth = 460;

    const onMove = (event: MouseEvent) => {
      const maxWidth = Math.max(minWidth, window.innerWidth - leftWidth - minRightWidth);
      const next = Math.min(maxWidth, Math.max(minWidth, startWidth + event.clientX - startX));
      setMiddleWidth(next);
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  /* ── Resolve facultyId from NextAuth session on mount ── */
  const [facultyReady, setFacultyReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(s => {
        const uid = s?.user?.email ?? s?.user?.id ?? "nicolas";
        setFacultyId(uid);
      })
      .catch(() => {})
      .finally(() => setFacultyReady(true));
  }, []);

  /* ── Fetch course list once facultyId is resolved ── */
  useEffect(() => {
    if (!facultyReady) return;
    fetch(`${API}/api/courses?userId=${facultyId}`)
      .then(r => r.json())
      .then(data => {
        const list: Course[] = (Array.isArray(data) ? data : (data.courses ?? []))
          .filter((c: Course) => c.isOwned !== false);
        setCourses(list);
        setSelectedCourse(list[0] ?? null);
      })
      .catch(err => console.warn("Course fetch failed:", err));
  }, [facultyReady, facultyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!facultyReady) return;
    setGroupsLoading(true);
    fetch(`${API}/api/groups?facultyId=${facultyId}`)
      .then(r => r.json())
      .then(d => setGroups((d.groups ?? []).map(normalizeGroup)))
      .catch(err => console.warn("Groups fetch failed:", err))
      .finally(() => setGroupsLoading(false));
  }, [facultyReady, facultyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!facultyReady || !selectedCourse?.id) {
      setCoursePdfUrl(null);
      setCoursePdfError(null);
      setCoursePdfLoading(false);
      return;
    }

    setCoursePdfUrl(null);
    setCoursePdfLoading(true);
    setCoursePdfError(null);
    let cancelled = false;
    const controller = new AbortController();
    fetch(`/api/courses/${selectedCourse.id}/pdf-url?userId=${encodeURIComponent(facultyId)}`, {
      signal: controller.signal,
    })
      .then(async r => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.detail ?? `PDF URL fetch failed with ${r.status}`);
        return data;
      })
      .then(data => {
        const pdfUrl = data.url ?? data.sasUrl ?? null;
        if (!pdfUrl) console.warn("PDF URL response did not include url or sasUrl:", data);
        if (!cancelled) {
          setCoursePdfUrl(pdfUrl);
          setCoursePdfError(pdfUrl ? null : "PDF URL missing");
        }
      })
      .catch(err => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.warn("PDF URL fetch failed:", err);
        if (cancelled) return;
        setCoursePdfUrl(null);
        setCoursePdfError(err instanceof Error ? err.message : "PDF unavailable");
      })
      .finally(() => {
        if (!cancelled) setCoursePdfLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [facultyReady, selectedCourse?.id, facultyId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fetch MCQ bank — waits for facultyId to be resolved ── */
  useEffect(() => {
    if (!facultyReady || !selectedCourse || activeMode !== "questions") return;
    setMcqLoading(true);
    setMcqBank([]);
    fetch(`${API}/api/mcq/bank/${selectedCourse?.id}?userId=${facultyId}`)
      .then(r => r.json())
      .then(data => {
        /* Response shape: { mcqs: [...], count: N, courseId: string } */
        const raw = Array.isArray(data) ? data : (data.mcqs ?? []);
        /* Normalise legacy MCQs that use level instead of function.
           Generated before the five-function taxonomy — map to closest equivalent. */
        const LEVEL_TO_FN: Record<string, MCQFunction> = {
          basic:        "understand",
          intermediate: "recognize",
          advanced:     "evaluate",
        };
        const normalised: MCQDoc[] = raw.map((item: RawMCQDoc) => ({
          id: item.id ?? `q${Date.now()}`,
          question: item.question ?? "",
          options: item.options ?? [],
          correctIndex: item.correctIndex ?? item.correct_index ?? 0,
          explanation: item.explanation ?? "",
          function: item.function ?? LEVEL_TO_FN[item.level ?? ""] ?? "understand",
          pageNumber: item.pageNumber ?? item.page_number ?? 0,
          hasVisual: item.hasVisual ?? item.has_visual ?? false,
          position: item.position,
        }));
        setMcqBank(normalised);
      })
      .catch(err => { console.warn("MCQ bank fetch failed:", err); setMcqBank([]); })
      .finally(() => setMcqLoading(false));
  }, [selectedCourse?.id, activeMode, facultyId, facultyReady]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fetch access list for Share tab ── */
  useEffect(() => {
    if (!facultyReady || !selectedCourse || activeMode !== "share") return;
    setShareLoading(true);
    fetch(`${API}/api/courses/${selectedCourse.id}/access?userId=${facultyId}`)
      .then(r => r.json())
      .then(data => setShareAccess(data.access ?? []))
      .catch(err => console.warn("Access fetch failed:", err))
      .finally(() => setShareLoading(false));
  }, [selectedCourse?.id, activeMode, facultyId, facultyReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeMode !== "analytics") return;
    if (analyticsView !== "group" || !analyticsGroup || !selectedCourse) return;

    setGroupAnalyticsLoading(true);
    fetch(`${API}/api/analytics/group/${analyticsGroup.id}?courseId=${selectedCourse.id}`)
      .then(r => r.json())
      .then(data => setGroupAnalytics({
        sessions: data.sessions ?? [],
        memberCount: data.memberCount ?? analyticsGroup.members.length,
      }))
      .catch(err => {
        console.warn("Group analytics fetch failed:", err);
        setGroupAnalytics(null);
      })
      .finally(() => setGroupAnalyticsLoading(false));
  }, [analyticsView, analyticsGroup?.id, selectedCourse?.id, activeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectCourse = (c: Course) => {
    setSelectedCourse(c); setRightPanel("empty"); setEditDraft(null); setSelectedStudent(null); setSelectedGroup(null);
  };

  const switchMode = (m: Mode) => {
    setActiveMode(m); setRightPanel("empty"); setEditDraft(null); setSelectedStudent(null);
  };

  const openEdit = (q: MCQDoc) => { setEditDraft(draftFromDoc(q)); setRightPanel("edit-q"); };
  const openNew  = ()           => { setEditDraft(blankDraft());    setRightPanel("new-q");  };
  const cancelEdit = ()         => { setRightPanel("empty"); setEditDraft(null); };

  const saveQuestion = (acceptedReforms: Record<string, AcceptedReform>) => {
    if (!editDraft) return;
    const doc: MCQDoc = {
      id: editDraft.id ?? `q${Date.now()}`,
      question: editDraft.question,
      options: (["A","B","C","D"] as const).map((l, i) => ({ letter: l, text: editDraft.options[i] })),
      correctIndex: editDraft.correctIndex,
      explanation: editDraft.explanation,
      function: editDraft.function,
      pageNumber: Number(editDraft.pageNumber) || 0,
      hasVisual: editDraft.hasVisual,
    };

    /* Persist to backend — fire-and-forget, local state update is immediate */
    if (editDraft.id) {
      const API = process.env.NEXT_PUBLIC_API_URL
        ?? "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";
      const now = new Date().toISOString();
      const reformulations = Object.entries(acceptedReforms).map(([field, r]) => ({
        field,
        original:     r.original,
        reformulated: r.reformulated,
        acceptedAt:   now,
      }));
      fetch(`${API}/api/mcq/${editDraft.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId:      selectedCourse?.id ?? "",
          question:      doc.question,
          options:       doc.options,
          correctIndex:  doc.correctIndex,
          explanation:   doc.explanation,
          function:      doc.function,
          pageNumber:    doc.pageNumber,
          hasVisual:     doc.hasVisual,
          reformulations: reformulations.length > 0 ? reformulations : undefined,
        }),
      }).catch(err => console.warn("MCQ save failed:", err));
    }

    /* Always update local state immediately — UI stays responsive */
    if (editDraft.id) {
      setMcqBank(prev => prev.map(q => q.id === doc.id ? doc : q));
    } else {
      setMcqBank(prev => [...prev, doc]);
    }
    setRightPanel("empty"); setEditDraft(null);
  };

  const deleteQuestion = (id: string) => {
    setMcqBank(prev => prev.filter(q => q.id !== id));
    setRightPanel("empty"); setEditDraft(null);
  };

  const requestDeleteQuestion = (id: string) => {
    if (skipDeleteConfirm) {
      deleteQuestion(id);
      return;
    }
    setDontShowDeleteConfirm(false);
    setDeleteConfirmId(id);
  };

  const confirmDeleteQuestion = () => {
    if (!deleteConfirmId) return;
    if (dontShowDeleteConfirm) {
      try { localStorage.setItem("skipQuestionDeleteConfirm", "true"); } catch {}
      setSkipDeleteConfirm(true);
    }
    deleteQuestion(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const cancelDeleteQuestion = () => {
    setDeleteConfirmId(null);
    setDontShowDeleteConfirm(false);
  };

  /* ── Share tab handlers ── */
  const handleShareAdd = () => {
    const email = shareEmail.trim().toLowerCase();
    if (!email || !selectedCourse) return;
    setShareEmail("");
    setShareAccess(prev => {
      if (prev.find(e => e.email === email)) return prev;
      return [...prev, { email, status: "invited", sharedAt: new Date().toISOString(), sessionCount: 0 }];
    });
    fetch(`${API}/api/courses/${selectedCourse.id}/access`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentEmail: email, userId: facultyId }),
    }).catch(err => console.warn("Share add failed:", err));
  };

  const handleShareRemove = (email: string) => {
    if (!selectedCourse) return;
    setShareAccess(prev => prev.filter(e => e.email !== email));
    fetch(`${API}/api/courses/${selectedCourse.id}/access/${encodeURIComponent(email)}?userId=${facultyId}`, {
      method: "DELETE",
    }).catch(err => console.warn("Share remove failed:", err));
  };

  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const emails = parseStudentEmails(text);
      if (emails.length === 0) return;
      setPendingCsv(emails);
      setNewGroupName(`Imported group ${new Date().toISOString().slice(0, 10)}`);
      setRightPanel("group-create");
    };
    reader.readAsText(file);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !pendingCsv?.length) return;
    const optimistic: Group = {
      id: `g${Date.now()}`,
      name: newGroupName.trim(),
      facultyId,
      members: pendingCsv,
      courseIds: [],
      createdAt: new Date().toISOString(),
    };
    setGroups(prev => [optimistic, ...prev]);
    setSelectedGroup(optimistic);
    setRightPanel("group-detail");
    setPendingCsv(null);

    fetch(`${API}/api/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: optimistic.name,
        facultyId,
        members: optimistic.members,
      }),
    })
      .then(r => r.json())
      .then((real: Group) => {
        const normalized = normalizeGroup(real);
        setGroups(prev => prev.map(g => g.id === optimistic.id ? normalized : g));
        setSelectedGroup(normalized);
        setAnalyticsGroup(prev => prev?.id === optimistic.id ? normalized : prev);
      })
      .catch(console.warn);
  };

  const handleRenameGroup = (name: string) => {
    if (!selectedGroup) return;
    const updated = { ...selectedGroup, name };
    setSelectedGroup(updated);
    setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updated : g));
  };

  const persistRenameGroup = () => {
    if (!selectedGroup || !selectedGroup.name.trim()) return;
    fetch(`${API}/api/groups/${selectedGroup.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: selectedGroup.name.trim() }),
    }).catch(console.warn);
  };

  const handleShareGroup = () => {
    if (!selectedGroup || !selectedCourse) return;
    if ((selectedGroup.courseIds ?? []).includes(selectedCourse.id)) return;

    const updated = { ...selectedGroup, courseIds: [...(selectedGroup.courseIds ?? []), selectedCourse.id] };
    setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updated : g));
    setSelectedGroup(updated);
    setAnalyticsGroup(prev => prev?.id === selectedGroup.id ? updated : prev);
    fetch(`${API}/api/groups/${selectedGroup.id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: selectedCourse.id, facultyId }),
    }).catch(console.warn);
  };

  const handleDeleteGroup = () => {
    if (!selectedGroup) return;
    const groupId = selectedGroup.id;
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setSelectedGroup(null);
    setAnalyticsGroup(prev => prev?.id === groupId ? null : prev);
    setRightPanel("empty");
    fetch(`${API}/api/groups/${groupId}?facultyId=${facultyId}`, {
      method: "DELETE",
    }).catch(console.warn);
  };

  const handleRemovePendingEmail = (email: string) => {
    setPendingCsv(prev => prev?.filter(e => e !== email) ?? []);
  };

  const handleRemoveGroupMember = (email: string) => {
    if (!selectedGroup) return;
    const updated = {
      ...selectedGroup,
      members: (selectedGroup.members ?? []).filter(member => member !== email),
    };
    setSelectedGroup(updated);
    setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updated : g));
    fetch(`${API}/api/groups/${selectedGroup.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: updated.members }),
    }).catch(console.warn);
  };

  const handleAllowDownloadToggle = () => {
    if (!selectedCourse) return;
    const next = !selectedCourse.allowDownload;
    const updated = { ...selectedCourse, allowDownload: next };
    setSelectedCourse(updated);
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    fetch(`${API}/api/courses/${selectedCourse.id}?userId=${facultyId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowDownload: next }),
    }).catch(err => console.warn("allowDownload update failed:", err));
  };

  const handleVisibleProgressToggle = () => {
    if (!selectedCourse) return;
    const next = !(selectedCourse.visibleProgressTracking ?? true);
    const updated = { ...selectedCourse, visibleProgressTracking: next };
    setSelectedCourse(updated);
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    fetch(`${API}/api/courses/${selectedCourse.id}?userId=${facultyId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibleProgressTracking: next }),
    }).catch(err => console.warn("visibleProgressTracking update failed:", err));
  };

  /* ── Playlist mode handlers ── */
  const enterPlaylist = () => {
    /* Sort by existing position if set, otherwise current bank order */
    const sorted = [...mcqBank].sort((a, b) =>
      (a.position ?? 9999) - (b.position ?? 9999)
    );
    setPlaylistOrder(sorted);
    setPlaylistMode(true);
    setRightPanel("empty"); setEditDraft(null);
  };

  const cancelPlaylist = () => { setPlaylistMode(false); };

  const savePlaylist = () => {
    const API = process.env.NEXT_PUBLIC_API_URL
      ?? "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";
    /* Assign position 1-N based on drag order */
    const withPositions = playlistOrder.map((q, i) => ({ ...q, position: i + 1 }));
    setMcqBank(withPositions);
    setPlaylistMode(false);
    /* Batch persist — fire and forget */
    fetch(`${API}/api/mcq/batch-positions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId:  selectedCourse?.id ?? "",
        positions: withPositions.map(q => ({ id: q.id, position: q.position })),
      }),
    }).catch(err => console.warn("Batch positions failed:", err));
  };

  const onDragStart = (idx: number) => setDragIdx(idx);

  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...playlistOrder];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setPlaylistOrder(next);
    setDragIdx(idx);
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragIdx(null); };

  const groupedMcqs = FN_ORDER.map(fn => ({ fn, qs: mcqBank.filter(q => q.function === fn) }));

  const analyticsStudents = analyticsView === "group" && analyticsGroup
    ? MOCK_STUDENTS.filter(s => (analyticsGroup.members ?? []).includes(s.email.toLowerCase()) || (analyticsGroup.members ?? []).includes(s.email))
    : MOCK_STUDENTS;
  const activeStudents = analyticsStudents.filter(s => s.status === "active");
  const classAvgScore  = activeStudents.length
    ? Math.round(activeStudents.reduce((s, st) => s + st.avgScore, 0) / activeStudents.length) : 0;
  const analyticsStudentCount = analyticsView === "group" && analyticsGroup
    ? (groupAnalytics?.memberCount ?? (analyticsGroup.members ?? []).length)
    : analyticsStudents.length;
  const editDraftPage = Number(editDraft?.pageNumber) || 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.shell}>

      {/* LEFT */}
      <aside className={`${styles.paneLeft} ${leftCollapsed ? styles.paneLeftCollapsed : ""}`}>
        <a
          className={styles.workspaceBtn}
          href="/workspace"
          title="Workspace"
        >
          {leftCollapsed ? "W" : "Workspace"}
        </a>
        <div className={styles.paneHd}>
          {!leftCollapsed && <span className={styles.eyebrow}>Courses</span>}
          {!leftCollapsed && <span className={styles.hdMeta}>{facultyId}</span>}
          <button
            className={styles.collapseBtn}
            onClick={() => setLeftCollapsed(v => !v)}
            title={leftCollapsed ? "Expand course list" : "Collapse course list"}
          >
            {leftCollapsed ? "›" : "‹"}
          </button>
        </div>

        {leftCollapsed ? (
          <div className={styles.collapsedList}>
            {courses.map(c => (
              <div
                key={c.id}
                className={`${styles.courseDot} ${selectedCourse?.id === c.id ? styles.courseDotActive : ""}`}
                onClick={() => selectCourse(c)}
                title={c.title}
              >
                {c.title.charAt(0)}
              </div>
            ))}
          </div>
        ) : (
        <ul className={styles.courseList}>
          {courses.length === 0 && <li className={styles.courseItem} style={{opacity:0.4, cursor:"default"}}>Loading courses…</li>}
          {courses.map(c => (
            <li key={c.id}
              className={`${styles.courseItem} ${selectedCourse?.id === c.id ? styles.courseItemActive : ""}`}
              onClick={() => selectCourse(c)}>
              <div className={styles.courseTitle}>{c.title}</div>
              <div className={styles.courseMeta}>
                <span className={`${styles.statusDot} ${styles[`status_${c.mcqStatus}` as keyof typeof styles]}`} />
                <span className={styles.statusLabel}>{c.mcqStatus}</span>
                <span className={styles.mcqCount}>{c.mcqCount} Q</span>
              </div>
            </li>
          ))}
        </ul>
        )}
      </aside>

      {/* MIDDLE + RIGHT — only render once a course is selected */}
      {selectedCourse && <>
      <section
        className={styles.paneMiddle}
        style={playlistMode
          ? { flex: "1", maxWidth: "none", borderRight: "none" }
          : {
              width: middleWidth,
              flexBasis: middleWidth,
              maxWidth: `calc(100vw - ${leftCollapsed ? 48 : 210}px - 460px)`,
            }
        }
      >
        <div className={styles.paneHd}>
          <span className={styles.eyebrow}>
            {!selectedCourse ? "Select a course" : selectedCourse.title.length > 30 ? selectedCourse.title.slice(0, 30) + "…" : selectedCourse.title}
          </span>
        </div>

        <div className={styles.synthesisStrip}>
          <p className={styles.synthesisThesis}>{selectedCourse?.synthesis?.thesis ?? ""}</p>
          <div className={styles.conceptRow}>
            {(selectedCourse?.synthesis?.key_concepts ?? []).map(k => (
              <span key={k} className={styles.conceptChip}>{k}</span>
            ))}
          </div>
        </div>

        <div className={styles.modeTabs}>
          {(["questions","students","share","analytics"] as Mode[]).map(m => (
            <button key={m}
              className={`${styles.tab} ${activeMode === m ? styles.tabActive : ""}`}
              onClick={() => switchMode(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Questions ── */}
        {activeMode === "questions" && (
          <div className={styles.panelShell}>
            <div className={styles.panelHd}>
              <span className={styles.eyebrow}>
                {mcqLoading ? "Loading…" : playlistMode ? "Ordering playlist" : `${mcqBank.length} questions`}
              </span>
              <div style={{ display:"flex", gap:6 }}>
                {playlistMode ? (
                  <>
                    <button className={styles.addBtn} onClick={savePlaylist}>Done</button>
                    <button className={styles.ghostBtn} onClick={cancelPlaylist}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className={styles.ghostBtn} onClick={enterPlaylist} disabled={mcqLoading || mcqBank.length === 0}>✎ Order playlist</button>
                    <button className={styles.addBtn} onClick={openNew} disabled={mcqLoading}>+ New</button>
                  </>
                )}
              </div>
            </div>

            {/* ── Playlist mode: flat draggable list ── */}
            {playlistMode && (
              <>
                <div className={styles.playlistHint}>Drag rows to reorder · Done saves the order</div>
                <div className={styles.panelScroll}>
                  {playlistOrder.map((q, i) => (
                    <div
                      key={q.id}
                      className={`${styles.playlistRow} ${dragIdx === i ? styles.playlistRowDragging : ""}`}
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragOver={e => onDragOver(e, i)}
                      onDrop={onDrop}
                    >
                      <span className={styles.dragHandle}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <line x1="3" y1="5" x2="13" y2="5"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="11" x2="13" y2="11"/>
                        </svg>
                      </span>
                      <span className={styles.playlistPos}>{i + 1}</span>
                      <span className={`${styles.fnChip} ${styles[`fn_${q.function}` as keyof typeof styles]}`} style={{ fontSize:"0.5625rem", flexShrink:0 }}>{q.function}</span>
                      <span className={styles.playlistQ}>{q.question}</span>
                      <span className={styles.qPageRef}>p.{q.pageNumber}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Normal mode: grouped view ── */}
            {!playlistMode && (
              <div className={styles.panelScroll}>
                {groupedMcqs.map(({ fn, qs }) => (
                  <div key={fn}>
                    <div className={styles.fnGroupHd}>
                      <span className={`${styles.fnChip} ${styles[`fn_${fn}` as keyof typeof styles]}`}>{fn}</span>
                      <span className={styles.fnCount}>{qs.length} / {FN_DISTRIBUTION[fn]}</span>
                    </div>
                    {qs.map(q => (
                      <div key={q.id}
                        className={`${styles.qRow} ${editDraft?.id === q.id ? styles.qRowActive : ""}`}>
                        {q.position !== undefined && (
                          <span className={styles.posPin} title={`Session position ${q.position}`}>{q.position}</span>
                        )}
                        <div className={styles.qRowMain} onClick={() => openEdit(q)}>
                          <div className={styles.qText}>{q.question}</div>
                          {q.hasVisual && <span className={styles.visualFlag}>visual</span>}
                        </div>
                        <div className={styles.qActions}>
                          <button className={styles.editBtn} onClick={() => openEdit(q)}>Edit</button>
                          <button className={styles.delBtnSm} onClick={() => requestDeleteQuestion(q.id)}>Del</button>
                        </div>
                      </div>
                    ))}
                    {qs.length === 0 && (
                      <div className={styles.emptyGroup}>No {fn} questions yet</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Share ── */}
        {activeMode === "share" && (
          <div className={styles.panelShell}>
            <div className={styles.shareInputRow}>
              <input
                className={styles.shareInput}
                type="email"
                placeholder="Student email address…"
                value={shareEmail}
                onChange={e => setShareEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleShareAdd()}
              />
              <button className={styles.addBtn} onClick={handleShareAdd} disabled={!shareEmail.trim()}>
                Share
              </button>
            </div>
            <div className={styles.panelHd}>
              <span className={styles.eyebrow}>
                {shareLoading
                  ? "Loading…"
                  : `${shareAccess.length} student${shareAccess.length !== 1 ? "s" : ""} with access`}
              </span>
              <button className={styles.ghostBtn}>Export</button>
            </div>
            <div className={styles.panelScroll}>
              {shareAccess.map(s => (
                <div key={s.email} className={styles.studentRow}>
                  <div className={`${styles.avatar} ${styles[`avatar_${s.status}` as keyof typeof styles]}`}>
                    {emailInitials(s.email)}
                  </div>
                  <div className={styles.studentInfo}>
                    <div className={styles.studentEmail}>{s.email}</div>
                    <div className={styles.studentMeta}>
                      {s.sessionCount > 0 ? `${s.sessionCount} session${s.sessionCount > 1 ? "s" : ""}` : "No sessions yet"}
                    </div>
                  </div>
                  <span className={statusPillCls(s.status, styles)}>{s.status}</span>
                  <button className={styles.delBtnSm} onClick={() => handleShareRemove(s.email)}>Remove</button>
                </div>
              ))}
              {!shareLoading && shareAccess.length === 0 && (
                <div className={styles.emptyGroup}>No students yet — share this course using the input above.</div>
              )}
              <div className={styles.courseSettingsBlock}>
                <span className={styles.eyebrow} style={{ display:"block", marginBottom:8 }}>Course settings</span>
                <div className={styles.settingRow}>
                  <div>
                    <span className={styles.settingLabel}>Allow PDF download</span>
                    <div style={{fontSize:"0.75rem",color:"var(--on-surface-variant)",opacity:0.7,marginTop:2}}>Students can save the course document</div>
                  </div>
                  <button
                    className={`${styles.toggleBtn} ${selectedCourse.allowDownload ? styles.toggleBtnOn : ""}`}
                    onClick={handleAllowDownloadToggle}
                  >
                    {selectedCourse.allowDownload ? "On" : "Off"}
                  </button>
                </div>
                <div className={styles.settingRow}>
                  <div>
                    <span className={styles.settingLabel}>Visible progress tracking</span>
                    <div style={{fontSize:"0.75rem",color:"var(--on-surface-variant)",opacity:0.7,marginTop:2}}>Students see a banner indicating their sessions are reviewed by the instructor</div>
                  </div>
                  <button
                    className={`${styles.toggleBtn} ${(selectedCourse.visibleProgressTracking ?? true) ? styles.toggleBtnOn : ""}`}
                    onClick={handleVisibleProgressToggle}
                  >
                    {(selectedCourse.visibleProgressTracking ?? true) ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Students ── */}
        {activeMode === "students" && (
          <div className={styles.panelShell}>
            <div className={styles.panelHd}>
              <span className={styles.eyebrow}>Roster — {MOCK_STUDENTS.length}</span>
              <button className={styles.addBtn} onClick={() => setRightPanel("invite")}>+ Invite</button>
            </div>
            <div
              className={`${styles.uploadZone} ${styles.uploadZoneHidden}`}
              onClick={() => csvInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleCsvFile(file);
              }}
            >
              <p>Drop a .csv of student emails</p>
              <span className={styles.uploadHint}>one email per line</span>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className={styles.fileInput}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleCsvFile(file);
                  e.currentTarget.value = "";
                }}
              />
            </div>
            <div className={styles.panelScroll}>
              {MOCK_STUDENTS.map(s => (
                <div key={s.id} className={styles.studentRow}>
                  <div className={`${styles.avatar} ${styles[`avatar_${s.status}` as keyof typeof styles]}`}>{s.initials}</div>
                  <div className={styles.studentInfo}>
                    <div className={styles.studentEmail}>{s.email}</div>
                    <div className={styles.studentMeta}>{s.joinedAt !== "—" ? `Joined ${s.joinedAt}` : "Invited 14 Apr"}</div>
                  </div>
                  <span className={statusPillCls(s.status, styles)}>{s.status}</span>
                </div>
              ))}
              <div className={styles.groupsSection}>
                <div className={styles.groupsSectionHd}>
                  <span className={styles.eyebrow}>{groupsLoading ? "Groups loading" : `Groups - ${groups.length}`}</span>
                  <button className={styles.addBtn} onClick={() => csvInputRef.current?.click()}>+ Group</button>
                </div>
                {groups.map(g => (
                  <div
                    key={g.id}
                    className={`${styles.groupRow} ${selectedGroup?.id === g.id ? styles.groupRowActive : ""}`}
                    onClick={() => { setSelectedGroup(g); setRightPanel("group-detail"); }}
                  >
                    <span className={styles.groupInitial}>{g.name[0]?.toUpperCase() ?? "G"}</span>
                    <div className={styles.groupMeta}>
                      <span className={styles.groupName}>{g.name}</span>
                      <span className={styles.groupCount}>{(g.members ?? []).length} students</span>
                    </div>
                    {(g.courseIds ?? []).includes(selectedCourse?.id ?? "") && (
                      <span className={styles.groupSharedChip}>Shared</span>
                    )}
                  </div>
                ))}
                {!groupsLoading && groups.length === 0 && (
                  <div className={styles.emptyGroup}>No groups yet - upload a CSV to create one.</div>
                )}
                <div
                  className={styles.uploadZone}
                  onClick={() => csvInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleCsvFile(file);
                  }}
                >
                  <p>Drop a .csv of student emails</p>
                  <span className={styles.uploadHint}>one email per line</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Analytics ── */}
        {activeMode === "analytics" && (
          <div className={styles.panelShell}>
            <div className={styles.analyticsControls}>
              <div className={styles.analyticsToggle}>
                <button
                  className={`${styles.toggleBtn} ${analyticsView === "students" ? styles.toggleBtnOn : ""}`}
                  onClick={() => setAnalyticsView("students")}
                >
                  Students
                </button>
                <button
                  className={`${styles.toggleBtn} ${analyticsView === "group" ? styles.toggleBtnOn : ""}`}
                  onClick={() => setAnalyticsView("group")}
                  disabled={groups.length === 0}
                >
                  Groups
                </button>
              </div>
              {analyticsView === "group" && (
                <select
                  className={styles.fieldSelect}
                  value={analyticsGroup?.id ?? ""}
                  onChange={e => {
                    const g = groups.find(group => group.id === e.target.value) ?? null;
                    setAnalyticsGroup(g);
                  }}
                >
                  <option value="">Select a group...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({(g.members ?? []).length})</option>
                  ))}
                </select>
              )}
            </div>
            <div className={styles.statRow}>
              <div className={styles.statBox}><div className={styles.statN}>{analyticsStudentCount}</div><div className={styles.statLbl}>Students</div></div>
              <div className={styles.statBox}><div className={styles.statN}>{analyticsView === "group" && analyticsGroup ? (groupAnalytics?.sessions.length ?? 0) : activeStudents.reduce((s,st)=>s+st.sessions,0)}</div><div className={styles.statLbl}>Sessions</div></div>
              <div className={styles.statBox}><div className={styles.statN}>{classAvgScore}%</div><div className={styles.statLbl}>Avg score</div></div>
            </div>
            <div className={styles.panelScroll}>
              {analyticsView === "group" && !analyticsGroup && (
                <div className={styles.emptyGroup}>Select a group to view class analytics.</div>
              )}
              {groupAnalyticsLoading && (
                <div className={styles.emptyGroup}>Loading group analytics...</div>
              )}
              {analyticsStudents.map(s => (
                <div key={s.id}
                  className={`${styles.analyticsRow} ${selectedStudent?.id===s.id ? styles.analyticsRowActive : ""}`}
                  onClick={() => { setSelectedStudent(s); setRightPanel("student-detail"); }}>
                  <div className={styles.analyticsLabel}>{s.email}</div>
                  <div className={styles.analyticsMeta}>
                    {s.sessions > 0 ? `${s.sessions} session${s.sessions>1?"s":""} · ${s.avgScore}%` : "No sessions"}
                  </div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width:`${s.avgScore}%` }} />
                  </div>
                </div>
              ))}
              <div className={styles.weakBlock}>
                <span className={styles.eyebrow} style={{ display:"block", marginBottom:8 }}>Weak concepts — class</span>
                {["Canary vs blue-green trade-offs","Delegate architecture"].map(c => (
                  <div key={c} className={styles.weakItem}>{c}</div>
                ))}
              </div>
              <div className={styles.signalBlock}>
                <span className={styles.eyebrow} style={{ display:"block", marginBottom:10 }}>Signal breakdown — all sessions</span>
                <div className={styles.signalGrid}>
                  {SIGNAL_META.map(sm => (
                    <div key={sm.key} className={styles.signalItem}>
                      <span className={`${styles.signalN} ${styles[sm.cls as keyof typeof styles]}`}>
                        {activeStudents.reduce((s,st)=>s+(st.signalBreakdown[sm.key]??0),0)}
                      </span>
                      <span className={styles.signalLbl}>{sm.short}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {!playlistMode && (
        <div
          className={styles.resizeHandle}
          onMouseDown={startMiddleResize}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize middle pane"
          title="Resize middle pane"
        />
      )}

      {/* RIGHT */}
      <section className={styles.paneRight} style={playlistMode ? { display: "none" } : undefined}>

        {rightPanel === "empty" && (
          showIntro ? (
            <TeachIntro onClose={() => setShowIntro(false)} />
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.eyebrow}>
                {activeMode==="questions" && "Select a question"}
                {activeMode==="share"     && "Share settings"}
                {activeMode==="students"  && "Invitation"}
                {activeMode==="analytics" && "Select a student"}
              </span>
              <p>
                {activeMode==="questions" && "Click a question to edit, or create a new one."}
                {activeMode==="share"     && "Enter a student email above to share this course."}
                {activeMode==="students"  && "Click Invite to send bulk invitations."}
                {activeMode==="analytics" && "Click a student row to inspect their progress."}
              </p>
            </div>
          )
        )}

        {(rightPanel==="edit-q"||rightPanel==="new-q") && editDraft && (
          <>
            <div className={styles.paneHd}>
              <span className={styles.eyebrow}>{rightPanel==="new-q" ? "New question" : "Edit question"}</span>
              <span className={`${styles.fnChip} ${styles[`fn_${editDraft.function}` as keyof typeof styles]}`}>
                {editDraft.function}
              </span>
            </div>

            {/* PDF slide preview — only when editing existing question with a page ref */}
            {rightPanel === "edit-q" && editDraft.id && (
              <div className={styles.slideSection}>
                <div className={styles.slideHd}>
                  <span className={styles.eyebrow}>PDF reference</span>
                  <span className={styles.slidePageLabel}>
                    {editDraftPage > 0 ? `Page ${editDraftPage}` : "Page not set"}
                  </span>
                  <div className={styles.slideHdActions}>
                    {coursePdfUrl ? (
                      <a
                        href={`${coursePdfUrl}#page=${editDraftPage > 0 ? editDraftPage : 1}`}
                        className={styles.pdfLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open full PDF →
                      </a>
                    ) : (
                      <span className={styles.pdfUnavailable}>
                        {coursePdfLoading ? "Loading PDF" : coursePdfError ?? "PDF unavailable"}
                      </span>
                    )}
                    <button
                      className={styles.slideToggle}
                      onClick={() => setSlideExpanded(v => !v)}
                    >
                      {slideExpanded ? "Collapse" : "Expand"}
                    </button>
                  </div>
                </div>
                {slideExpanded && (
                  <div className={styles.slideBody}>
                    <div className={styles.slideImgArea}>
                      {coursePdfUrl ? (
                        <iframe
                          key={`${coursePdfUrl}-${editDraftPage > 0 ? editDraftPage : 1}`}
                          className={styles.pdfFrame}
                          src={`${coursePdfUrl}#page=${editDraftPage > 0 ? editDraftPage : 1}`}
                          title={`PDF preview for ${selectedCourse?.title ?? "course"}`}
                        />
                      ) : (
                        <div className={styles.slidePlaceholder}>
                          <div className={styles.slidePlaceholderTitle} />
                          {editDraft.hasVisual
                            ? <div className={styles.slidePlaceholderDiagram} />
                            : null}
                          <div className={styles.slidePlaceholderLines}>
                            <div className={styles.slidePlaceholderLine} />
                            <div className={`${styles.slidePlaceholderLine} ${styles.slidePlaceholderLineShort}`} />
                            <div className={styles.slidePlaceholderLine} />
                            <div className={`${styles.slidePlaceholderLine} ${styles.slidePlaceholderLineShort}`} />
                          </div>
                        </div>
                      )}
                      {coursePdfLoading && <div className={styles.pdfState}>Loading PDF</div>}
                      {!coursePdfLoading && coursePdfError && <div className={styles.pdfState}>{coursePdfError}</div>}
                      <div className={styles.pageBadge}>{editDraftPage > 0 ? `p. ${editDraftPage}` : "p. -"}</div>
                    </div>

                  </div>
                )}
              </div>
            )}

            <QuestionEditor draft={editDraft} onChange={setEditDraft}
              onSave={saveQuestion} onCancel={cancelEdit}
              courseTitle={selectedCourse?.title ?? ""}
              onDelete={rightPanel==="edit-q" && editDraft.id ? ()=>requestDeleteQuestion(editDraft.id!) : undefined} />
          </>
        )}

        {rightPanel==="invite" && (
          <>
            <div className={styles.paneHd}><span className={styles.eyebrow}>Invitation preview</span></div>
            <div className={styles.inviteShell}>
              <div className={styles.invitePreview}>
                <div className={styles.inviteSubject}>You&apos;ve been enrolled in &ldquo;{selectedCourse?.title}&rdquo;</div>
                <div className={styles.inviteBody}>
                  <p>Hello,</p>
                  <p>Your professor has shared a course with you on <strong>Student Central</strong>. Click below to access your MCQ session and AI tutor.</p>
                  <p className={styles.inviteLink}>→ Open Student Central</p>
                  <p>Once logged in, the course will appear in your workspace automatically.</p>
                </div>
              </div>
              <div className={styles.editorSection} style={{ padding:"12px 16px" }}>
                <label className={styles.fieldLabel}>Paste emails or upload CSV</label>
                <textarea className={styles.fieldTextarea} rows={5}
                  defaultValue={"alice.bernard@m2.univ.fr\nc.martin@m2.univ.fr\nt.dupont@m2.univ.fr"} />
                <p className={styles.inviteHint}>3 valid addresses · Course: {selectedCourse?.title}</p>
              </div>
              <div className={styles.editorActions}>
                <button className={styles.saveBtn}>Send invitations</button>
                <button className={styles.cancelBtn} onClick={()=>setRightPanel("empty")}>Cancel</button>
              </div>
            </div>
          </>
        )}

        {rightPanel==="group-create" && (
          <div className={styles.editorShell}>
            <div className={styles.paneHd}><span className={styles.eyebrow}>Create group</span></div>
            <div className={styles.editorScroll}>
              <div className={styles.editorSection}>
                <label className={styles.fieldLabel}>Group name</label>
                <input
                  className={styles.fieldInput}
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. M2 Data Science 2026"
                  autoFocus
                />
              </div>

              <div className={styles.editorSection}>
                <label className={styles.fieldLabel}>Members - {pendingCsv?.length ?? 0}</label>
                {pendingCsv?.map(email => (
                  <div key={email} className={styles.memberRow}>
                    <span className={styles.avatar}>{email[0].toUpperCase()}</span>
                    <span className={styles.memberEmail}>{email}</span>
                    <button className={styles.delBtnSm} onClick={() => handleRemovePendingEmail(email)}>x</button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.editorActions}>
              <button
                className={styles.saveBtn}
                disabled={!newGroupName.trim() || !pendingCsv?.length}
                onClick={handleCreateGroup}
              >
                Create group
              </button>
              <button className={styles.cancelBtn} onClick={() => { setPendingCsv(null); setRightPanel("empty"); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {rightPanel==="group-detail" && selectedGroup && (
          <div className={styles.editorShell}>
            <div className={styles.paneHd}><span className={styles.eyebrow}>Group</span></div>
            <div className={styles.editorScroll}>
              <div className={styles.editorSection}>
                <label className={styles.fieldLabel}>Group name</label>
                <input
                  className={styles.fieldInput}
                  value={selectedGroup.name}
                  onChange={e => handleRenameGroup(e.target.value)}
                  onBlur={persistRenameGroup}
                />
                <span className={styles.settingHint}>
                  {(selectedGroup.members ?? []).length} students
                  {(selectedGroup.courseIds ?? []).length > 0 && ` - shared with ${(selectedGroup.courseIds ?? []).length} course(s)`}
                </span>
              </div>

              {selectedCourse && (
                <div className={styles.editorSection}>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabelGroup}>
                      <span className={styles.settingLabel}>Share with &quot;{selectedCourse.title}&quot;</span>
                      <span className={styles.settingHint}>
                        {(selectedGroup.courseIds ?? []).includes(selectedCourse.id)
                          ? "Already shared - students have access"
                          : "Adds all members to this course"}
                      </span>
                    </div>
                    <button
                      className={styles.saveBtn}
                      disabled={(selectedGroup.courseIds ?? []).includes(selectedCourse.id)}
                      onClick={handleShareGroup}
                    >
                      {(selectedGroup.courseIds ?? []).includes(selectedCourse.id) ? "Shared" : "Share"}
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.editorSection}>
                <label className={styles.fieldLabel}>Members</label>
                {(selectedGroup.members ?? []).map(email => (
                  <div key={email} className={styles.memberRow}>
                    <span className={styles.avatar}>{email[0].toUpperCase()}</span>
                    <span className={styles.memberEmail}>{email}</span>
                    <button className={styles.delBtnSm} onClick={() => handleRemoveGroupMember(email)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.editorActions}>
              <button className={styles.deleteBtn} onClick={handleDeleteGroup}>Delete group</button>
            </div>
          </div>
        )}

        {rightPanel==="student-detail" && selectedStudent && (
          <>
            <div className={styles.paneHd}>
              <span className={styles.eyebrow}>{selectedStudent.email}</span>
              <span className={statusPillCls(selectedStudent.status, styles)}>{selectedStudent.status}</span>
            </div>
            <div className={styles.studentDetailShell}>
              <div className={styles.signalSummary}>
                {SIGNAL_META.map(sm => (
                  <div key={sm.key} className={styles.signalSummaryItem}>
                    <span className={`${styles.signalSummaryN} ${styles[sm.cls as keyof typeof styles]}`}>
                      {selectedStudent.signalBreakdown[sm.key]??0}
                    </span>
                    <span className={styles.signalLbl}>{sm.short}</span>
                  </div>
                ))}
              </div>
              <div className={styles.detailSection}>
                <span className={styles.eyebrow}>Session progression</span>
                <div className={styles.sessionBars}>
                  {selectedStudent.sessions > 0
                    ? Array.from({ length: selectedStudent.sessions }).map((_,i) => {
                        const score = Math.min(100, Math.round(selectedStudent.avgScore*(0.7+(i/selectedStudent.sessions)*0.6)));
                        return (
                          <div key={i} className={styles.sessionBarItem}>
                            <div className={styles.sessionBarOuter}>
                              <div className={styles.sessionBarInner} style={{ height:`${score}%` }} />
                            </div>
                            <span className={styles.sessionBarLbl}>S{i+1} {score}%</span>
                          </div>
                        );
                      })
                    : <p className={styles.noDataHint}>No sessions yet.</p>
                  }
                </div>
              </div>
              <div className={styles.detailSection}>
                <span className={styles.eyebrow}>Function coverage</span>
                <div className={styles.fnCoverageRow}>
                  {FN_ORDER.map(fn => (
                    <span key={fn}
                      className={`${styles.fnChip} ${styles[`fn_${fn}` as keyof typeof styles]} ${!selectedStudent.functionCoverage.includes(fn)?styles.fnChipDim:""}`}>
                      {fn}{selectedStudent.functionCoverage.includes(fn)?" ✓":""}
                    </span>
                  ))}
                </div>
              </div>
              {selectedStudent.weakConcepts.length > 0 && (
                <div className={styles.detailSection}>
                  <span className={styles.eyebrow}>Consistently weak</span>
                  {selectedStudent.weakConcepts.map(c=>(
                    <div key={c} className={styles.weakItem}>{c}</div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {deleteConfirmId && (
        <div className={styles.confirmOverlay} onClick={cancelDeleteQuestion}>
          <div className={styles.confirmDialog} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmEyebrow}>Delete question</div>
            <h2 className={styles.confirmTitle}>Delete this question?</h2>
            <p className={styles.confirmBody}>
              This removes the question from the course bank immediately.
            </p>
            <label className={styles.confirmCheckRow}>
              <input
                className={styles.confirmCheckbox}
                type="checkbox"
                checked={dontShowDeleteConfirm}
                onChange={e => setDontShowDeleteConfirm(e.target.checked)}
              />
              <span>Don&apos;t show me this again</span>
            </label>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={cancelDeleteQuestion}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={confirmDeleteQuestion}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
    }
    </div>
  );
}
