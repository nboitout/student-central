"use client";

import { useState, useEffect } from "react";
import styles from "./faculty.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type MCQFunction = "orient" | "understand" | "recognize" | "connect" | "evaluate";
type RightPanel  = "empty" | "edit-q" | "new-q" | "student-detail" | "invite" | "generate-similar";
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

interface Course {
  id:            string;
  title:         string;
  mcqStatus:     "ready" | "generating" | "none" | "failed";
  mcqCount:      number;
  synthesis:     { thesis?: string; key_concepts?: string[] } | null;
  allowDownload:     boolean;
  progressMonitored: boolean;
  /* Real API may include additional fields — ignored here */
  [key: string]: unknown;
}

interface AccessEntry {
  email:        string;
  status:       "invited" | "active";
  sharedAt:     string;
  sessionCount: number;
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

function draftFromDoc(q: MCQDoc): EditDraft {
  return { id: q.id, question: q.question,
           options: [q.options[0].text, q.options[1].text, q.options[2].text, q.options[3].text],
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
  const [pending,          setPending]          = useState<Record<string, ReformResult>>({});
  const [acceptedReforms,  setAcceptedReforms]  = useState<Record<string, AcceptedReform>>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  useEffect(() => setConfirmingDelete(false), [draft.id]);

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
        [/Which/,        "What"],
        [/What is/,      "Identify the"],
        [/illustrates/,  "depicts"],
        [/describes/,    "outlines"],
        [/primary/,      "main"],
        [/relationship/, "connection"],
        [/component/,    "element"],
        [/strategy/,     "approach"],
        [/addresses/,    "tackles"],
        [/fundamental/,  "core"],
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
                  </div>
                </div>
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
          <label className={styles.fieldLabel}>Explanation</label>
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
              <label className={styles.fieldLabel}>Page ref</label>
              <input className={styles.fieldInput} type="number" min={1}
                value={draft.pageNumber}
                onChange={e => set({ pageNumber: e.target.value === "" ? "" : Number(e.target.value) })}
                placeholder="—" />
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
          confirmingDelete ? (
            <>
              <span className={styles.deleteConfirmLabel}>Delete?</span>
              <button className={styles.deleteBtn} onClick={() => { setConfirmingDelete(false); onDelete(); }}>
                Confirm
              </button>
              <button className={styles.cancelBtn} onClick={() => setConfirmingDelete(false)}>
                No
              </button>
            </>
          ) : (
            <button className={styles.deleteBtn} onClick={() => setConfirmingDelete(true)}>
              Delete question
            </button>
          )
        )}
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
  const [middleWidth,   setMiddleWidth]     = useState(340);
  const [slideExpanded, setSlideExpanded]   = useState(true);

  // ── Generate-similar state ──
  const [seedMode,       setSeedMode]       = useState(false);
  const [seedIds,        setSeedIds]        = useState<string[]>([]);
  const [genCount,       setGenCount]       = useState<1|3|5>(3);
  const [genFn,          setGenFn]          = useState<MCQFunction|"same">("same");
  const [genHint,        setGenHint]        = useState("");
  const [genCandidates,  setGenCandidates]  = useState<MCQDoc[]>([]);
  const [genLoading,     setGenLoading]     = useState(false);
  const [facultyId, setFacultyId]           = useState("nicolas");

  // ── Share tab state ──
  const [shareAccess,  setShareAccess]  = useState<AccessEntry[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareEmail,   setShareEmail]   = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL
    ?? "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";

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
        const list: Course[] = Array.isArray(data) ? data : (data.courses ?? []);
        setCourses(list);
        if (list.length > 0) setSelectedCourse(list[0]);
      })
      .catch(err => console.warn("Course fetch failed:", err));
  }, [facultyReady, facultyId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const normalised: MCQDoc[] = raw.map((item: MCQDoc & { level?: string }) => ({
          ...item,
          function: item.function ?? LEVEL_TO_FN[item.level ?? ""] ?? "understand",
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

  const selectCourse = (c: Course) => {
    setSelectedCourse(c); setRightPanel("empty"); setEditDraft(null); setSelectedStudent(null);
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

  /* ── Generate-similar handlers ── */
  const enterSeedMode = () => {
    setSeedMode(true); setSeedIds([]); setRightPanel("empty"); setEditDraft(null);
  };

  const clearSeeds = () => {
    setSeedMode(false); setSeedIds([]); setGenCandidates([]);
    if (rightPanel === "generate-similar") setRightPanel("empty");
  };

  const toggleSeedSimple = (id: string) =>
    setSeedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id)
      : prev.length >= 3 ? prev
      : [...prev, id]
    );

  const openGeneratePanel = () => {
    setGenCandidates([]); setGenHint(""); setRightPanel("generate-similar");
  };

  const handleGenerate = async () => {
    if (!selectedCourse || seedIds.length === 0) return;
    setGenLoading(true);
    setGenCandidates([]);
    const seeds = mcqBank.filter(q => seedIds.includes(q.id));
    const targetFn = genFn === "same" ? (seeds[0]?.function ?? "understand") : genFn;
    try {
      const res = await fetch(`${API}/api/mcq/generate-similar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId:   selectedCourse.id,
          userId:     facultyId,
          seedIds,
          count:      genCount,
          function:   targetFn,
          focusHint:  genHint.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setGenCandidates((data.candidates ?? data.mcqs ?? []).map((q: MCQDoc) => ({
        ...q, id: q.id ?? `cand-${Date.now()}-${Math.random()}`,
      })));
    } catch (e) {
      console.warn("generate-similar failed, using mock:", e);
      /* Mock fallback — mirrors the seed questions with light variation */
      const mock: MCQDoc[] = seeds.slice(0, genCount).map((seed, i) => ({
        id: `cand-${Date.now()}-${i}`,
        function:     targetFn,
        pageNumber:   seed.pageNumber,
        hasVisual:    seed.hasVisual,
        correctIndex: (seed.correctIndex + 1) % 4,
        question:     `[Preview] ${seed.question.replace(/^(What|Which|How)/, m => m === "What" ? "Which" : m === "Which" ? "How" : "What")}`,
        options:      seed.options.map((o, oi) => ({
          ...o, text: oi === (seed.correctIndex + 1) % 4 ? seed.options[seed.correctIndex].text : o.text,
        })),
        explanation: `Generated in the same vein as: "${seed.question.slice(0, 60)}…"`,
      }));
      setGenCandidates(mock);
    } finally {
      setGenLoading(false);
    }
  };

  const acceptCandidate = (q: MCQDoc) => {
    const doc = { ...q, id: `q${Date.now()}` };
    setMcqBank(prev => [...prev, doc]);
    setGenCandidates(prev => prev.filter(c => c.id !== q.id));
    /* fire-and-forget persist — treat same as new question */
    fetch(`${API}/api/mcq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: selectedCourse?.id, userId: facultyId, ...doc }),
    }).catch(err => console.warn("candidate persist failed:", err));
  };

  const editCandidate = (q: MCQDoc) => {
    setGenCandidates(prev => prev.filter(c => c.id !== q.id));
    setEditDraft(draftFromDoc(q));
    setRightPanel("new-q");
  };

  const discardCandidate = (id: string) =>
    setGenCandidates(prev => prev.filter(c => c.id !== id));

  /* ── Share tab handlers ── */
  const handleShareAdd = () => {
    const email = shareEmail.trim().toLowerCase();
    if (!email || !selectedCourse) return;
    setShareEmail("");
    // Optimistic update — row appears immediately
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

  const handleProgressMonitoredToggle = () => {
    if (!selectedCourse) return;
    const next = !selectedCourse.progressMonitored;
    const updated = { ...selectedCourse, progressMonitored: next };
    setSelectedCourse(updated);
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    fetch(`${API}/api/courses/${selectedCourse.id}?userId=${facultyId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progressMonitored: next }),
    }).catch(err => console.warn("progressMonitored update failed:", err));
  };

  /* ── Playlist mode handlers ── */
  const enterPlaylist = () => {
    const sorted = [...mcqBank].sort((a, b) =>
      (a.position ?? 9999) - (b.position ?? 9999)
    );
    setPlaylistOrder(sorted);
    setPlaylistMode(true);
    setMiddleWidth(w => Math.round(w * 1.3));
    setRightPanel("empty"); setEditDraft(null);
  };

  const cancelPlaylist = () => {
    setPlaylistMode(false);
    setMiddleWidth(w => Math.round(w / 1.3));
  };

  const savePlaylist = () => {
    const withPositions = playlistOrder.map((q, i) => ({ ...q, position: i + 1 }));
    setMcqBank(withPositions);
    setPlaylistMode(false);
    setMiddleWidth(w => Math.round(w / 1.3));
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

  /* ── Middle pane resize handler ── */
  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = middleWidth;

    const onMouseMove = (ev: MouseEvent) => {
      const next = Math.max(220, Math.min(640, startW + ev.clientX - startX));
      setMiddleWidth(next);
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup",   onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup",   onMouseUp);
  };

  const groupedMcqs = FN_ORDER.map(fn => ({ fn, qs: mcqBank.filter(q => q.function === fn) }));

  const activeStudents = MOCK_STUDENTS.filter(s => s.status === "active");
  const classAvgScore  = activeStudents.length
    ? Math.round(activeStudents.reduce((s, st) => s + st.avgScore, 0) / activeStudents.length) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.shell}>

      {/* LEFT */}
      <aside className={`${styles.paneLeft} ${leftCollapsed ? styles.paneLeftCollapsed : ""}`}>
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
      <section className={styles.paneMiddle} style={{ width: middleWidth, minWidth: middleWidth }}>
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
                {mcqLoading ? "Loading…" : playlistMode ? "Ordering playlist" : seedMode ? "Select seeds (max 3)" : `${mcqBank.length} questions`}
              </span>
              <div style={{ display:"flex", gap:6 }}>
                {playlistMode ? (
                  <>
                    <button className={styles.addBtn} onClick={savePlaylist}>Done</button>
                    <button className={styles.ghostBtn} onClick={cancelPlaylist}>Cancel</button>
                  </>
                ) : seedMode ? (
                  <>
                    <button className={styles.sparkBtn} onClick={openGeneratePanel} disabled={seedIds.length === 0}>
                      ✦ Generate ({seedIds.length})
                    </button>
                    <button className={styles.ghostBtn} onClick={clearSeeds}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className={styles.sparkBtnGhost} onClick={enterSeedMode} disabled={mcqLoading || mcqBank.length === 0}>✦ Similar</button>
                    <button className={styles.ghostBtn} onClick={enterPlaylist} disabled={mcqLoading || mcqBank.length === 0}>✎ Order</button>
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
                        className={`${styles.qRow} ${editDraft?.id === q.id ? styles.qRowActive : ""} ${seedMode && seedIds.includes(q.id) ? styles.qRowSeed : ""}`}>
                        {seedMode && (
                          <button
                            className={`${styles.seedCheck} ${seedIds.includes(q.id) ? styles.seedCheckOn : ""}`}
                            onClick={() => toggleSeedSimple(q.id)}
                            disabled={!seedIds.includes(q.id) && seedIds.length >= 3}
                            title={seedIds.length >= 3 && !seedIds.includes(q.id) ? "Max 3 seeds" : ""}
                          >
                            {seedIds.includes(q.id) && "✓"}
                          </button>
                        )}
                        {q.position !== undefined && (
                          <span className={styles.posPin} title={`Session position ${q.position}`}>{q.position}</span>
                        )}
                        <div className={styles.qRowMain} onClick={() => !seedMode && openEdit(q)}>
                          <div className={styles.qText}>{q.question}</div>
                          {q.hasVisual && <span className={styles.visualFlag}>visual</span>}
                        </div>
                        {!seedMode && (
                          <div className={styles.qActions}>
                            <button className={styles.editBtn} onClick={() => openEdit(q)}>Edit</button>
                            <button className={styles.delBtnSm} onClick={() => deleteQuestion(q.id)}>Del</button>
                          </div>
                        )}
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
                      {s.sessionCount > 0
                        ? `${s.sessionCount} session${s.sessionCount > 1 ? "s" : ""}`
                        : "No sessions yet"}
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
                <span className={styles.eyebrow} style={{ display: "block", marginBottom: 8 }}>Course settings</span>
                <div className={styles.settingRow}>
                  <div className={styles.settingLabelGroup}>
                    <span className={styles.settingLabel}>Allow PDF download</span>
                    <span className={styles.settingHint}>Students can save the course document</span>
                  </div>
                  <button
                    className={`${styles.toggleBtn} ${selectedCourse.allowDownload ? styles.toggleBtnOn : ""}`}
                    onClick={handleAllowDownloadToggle}
                  >
                    {selectedCourse.allowDownload ? "On" : "Off"}
                  </button>
                </div>
                <div className={styles.settingRow}>
                  <div className={styles.settingLabelGroup}>
                    <span className={styles.settingLabel}>Visible progress tracking</span>
                    <span className={styles.settingHint}>Students see a banner indicating their sessions are reviewed by the instructor</span>
                  </div>
                  <button
                    className={`${styles.toggleBtn} ${selectedCourse.progressMonitored ? styles.toggleBtnOn : ""}`}
                    onClick={handleProgressMonitoredToggle}
                  >
                    {selectedCourse.progressMonitored ? "On" : "Off"}
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
            <div className={styles.uploadZone}>
              <p>Drop a .csv of student emails</p>
              <span className={styles.uploadHint}>one email per line · sends invite to each</span>
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
            </div>
          </div>
        )}

        {/* ── Analytics ── */}
        {activeMode === "analytics" && (
          <div className={styles.panelShell}>
            <div className={styles.statRow}>
              <div className={styles.statBox}><div className={styles.statN}>{activeStudents.length}</div><div className={styles.statLbl}>Students</div></div>
              <div className={styles.statBox}><div className={styles.statN}>{activeStudents.reduce((s,st)=>s+st.sessions,0)}</div><div className={styles.statLbl}>Sessions</div></div>
              <div className={styles.statBox}><div className={styles.statN}>{classAvgScore}%</div><div className={styles.statLbl}>Avg score</div></div>
            </div>
            <div className={styles.panelScroll}>
              {MOCK_STUDENTS.map(s => (
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

      {/* RESIZE HANDLE — drag to adjust middle pane width */}
      <div className={styles.resizeHandle} onMouseDown={onResizeMouseDown} />

      {/* RIGHT */}
      <section className={styles.paneRight}>

        {rightPanel === "empty" && (
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
            {rightPanel === "edit-q" && editDraft.id && Number(editDraft.pageNumber) > 0 && (
              <div className={styles.slideSection}>
                <div className={styles.slideHd}>
                  <span className={styles.eyebrow}>PDF reference</span>
                  <span className={styles.slidePageLabel}>Page {editDraft.pageNumber}</span>
                  <button
                    className={styles.slideToggle}
                    onClick={() => setSlideExpanded(v => !v)}
                  >
                    {slideExpanded ? "Collapse" : "Expand"}
                  </button>
                </div>
                {slideExpanded && (
                  <div className={styles.slideBody}>
                    <div className={styles.slideImgArea}>
                      {/* TODO: replace with <img src={sasUrl}> from getSlideSasUrl(selectedCourse?.id, editDraft.id) */}
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
                      <div className={styles.pageBadge}>p. {editDraft.pageNumber}</div>
                    </div>
                    <div className={styles.slideMeta}>
                      <div className={styles.slideMetaRow}>
                        <span className={styles.fieldLabel}>Page</span>
                        <span className={styles.slideMetaVal}>{editDraft.pageNumber}</span>
                      </div>
                      <div className={styles.slideMetaRow}>
                        <span className={styles.fieldLabel}>Has visual</span>
                        <span className={`${styles.slideMetaVal} ${editDraft.hasVisual ? styles.slideMetaVisual : ""}`}>
                          {editDraft.hasVisual ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className={styles.slideMetaRow}>
                        <span className={styles.fieldLabel}>Source</span>
                        <span className={styles.slideMetaSource}>{selectedCourse?.title}.pdf</span>
                      </div>
                      <a
                        href={`/api/courses/${selectedCourse?.id}/pdf-url`}
                        className={styles.pdfLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open full PDF →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            <QuestionEditor draft={editDraft} onChange={setEditDraft}
              onSave={saveQuestion} onCancel={cancelEdit}
              courseTitle={selectedCourse?.title ?? ""}
              onDelete={rightPanel==="edit-q" && editDraft.id ? ()=>deleteQuestion(editDraft.id!) : undefined} />
          </>
        )}

        {rightPanel==="generate-similar" && (
          <>
            <div className={styles.paneHd}>
              <span style={{ color:"#7c3aed", fontSize:"0.75rem" }}>✦</span>
              <span className={styles.eyebrow}>Generate similar</span>
              <button className={styles.ghostBtn} style={{ marginLeft:"auto" }} onClick={clearSeeds}>✕ Exit</button>
            </div>
            <div className={styles.genScroll}>

              {/* Seeds */}
              <div className={styles.genSection}>
                <span className={styles.fieldLabel}>Seeds — {seedIds.length} selected</span>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {mcqBank.filter(q => seedIds.includes(q.id)).map(q => (
                    <div key={q.id} className={styles.seedChip}>
                      <span className={`${styles.fnChip} ${styles[`fn_${q.function}` as keyof typeof styles]}`} style={{ marginBottom:4, display:"inline-block" }}>
                        {q.function}
                      </span>
                      <div className={styles.seedChipQ}>{q.question.length > 90 ? q.question.slice(0,90)+"…" : q.question}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div className={styles.genSection}>
                <span className={styles.fieldLabel}>How many to generate</span>
                <div style={{ display:"flex", gap:5 }}>
                  {([1,3,5] as (1|3|5)[]).map(n => (
                    <button key={n}
                      className={`${styles.countBtn} ${genCount===n ? styles.countBtnOn : ""}`}
                      onClick={() => setGenCount(n)}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Target function */}
              <div className={styles.genSection}>
                <span className={styles.fieldLabel}>Target function</span>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  <button
                    className={`${styles.countBtn} ${genFn==="same" ? styles.countBtnOn : ""}`}
                    onClick={() => setGenFn("same")}>Same</button>
                  {FN_ORDER.map(fn => (
                    <button key={fn}
                      className={`${styles.fnChip} ${styles[`fn_${fn}` as keyof typeof styles]} ${styles.fnSelBtn} ${genFn===fn ? styles.fnSelBtnOn : ""}`}
                      onClick={() => setGenFn(fn)}>{fn}</button>
                  ))}
                </div>
              </div>

              {/* Focus hint */}
              <div className={styles.genSection}>
                <span className={styles.fieldLabel}>Focus hint <span style={{ opacity:0.4, fontSize:"0.5rem" }}>(optional)</span></span>
                <textarea
                  className={styles.fieldTextarea}
                  rows={2}
                  placeholder="e.g. focus on chapter 3 diagrams, avoid overlap with existing questions…"
                  value={genHint}
                  onChange={e => setGenHint(e.target.value)}
                />
              </div>

              <div className={styles.genSection} style={{ borderBottom:"none" }}>
                <button
                  className={styles.sparkBtn}
                  onClick={handleGenerate}
                  disabled={genLoading || seedIds.length === 0}
                  style={{ alignSelf:"flex-start" }}
                >
                  {genLoading ? "Generating…" : `✦ Generate ${genCount} question${genCount>1?"s":""}`}
                </button>
              </div>

              {/* Candidates */}
              {genCandidates.length > 0 && (
                <>
                  <div style={{ borderTop:"1px solid var(--outline-variant)", margin:"0" }} />
                  <div style={{ padding:"10px 14px 4px" }}>
                    <span className={styles.fieldLabel}>{genCandidates.length} candidate{genCandidates.length>1?"s":""} — accept or discard each</span>
                  </div>
                  {genCandidates.map((q, i) => (
                    <div key={q.id} className={styles.candidateCard}>
                      <div className={styles.candidateHd}>
                        <span className={styles.candidateN}>{i+1}</span>
                        <span className={`${styles.fnChip} ${styles[`fn_${q.function}` as keyof typeof styles]}`}>{q.function}</span>
                      </div>
                      <div className={styles.candidateQ}>{q.question}</div>
                      <div className={styles.candidateOpts}>
                        {q.options.map((o, oi) => (
                          <div key={o.letter} className={`${styles.candidateOptRow} ${oi===q.correctIndex ? styles.candidateOptCorrect : ""}`}>
                            <span className={styles.candidateOptLetter}>{o.letter}</span>
                            <span>{o.text}</span>
                          </div>
                        ))}
                      </div>
                      <div className={styles.candidateActions}>
                        <button className={styles.candidateAcceptBtn} onClick={() => acceptCandidate(q)}>✓ Add to bank</button>
                        <button className={styles.editBtn} onClick={() => editCandidate(q)}>Edit first</button>
                        <button className={styles.deleteBtn} onClick={() => discardCandidate(q.id)}>Discard</button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {genLoading && (
                <div style={{ padding:"20px 14px", textAlign:"center" }}>
                  <span className={styles.eyebrow} style={{ opacity:0.5 }}>Generating questions…</span>
                </div>
              )}
            </div>
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
      </>
      }
    </div>
  );
}
