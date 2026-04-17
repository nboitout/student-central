"use client";

import { useState, useEffect } from "react";
import styles from "./faculty.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type MCQFunction = "orient" | "understand" | "recognize" | "connect" | "evaluate";
type RightPanel  = "empty" | "edit-q" | "new-q" | "student-detail" | "invite";
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
}

interface Course {
  id:        string;
  title:     string;
  mcqStatus: "ready" | "generating" | "none" | "failed";
  mcqCount:  number;
  synthesis: { thesis?: string; key_concepts?: string[] } | null;
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

const MOCK_COURSES: Course[] = [
  { id: "c1", title: "Harness Engineering with Codex", mcqStatus: "ready", mcqCount: 20,
    synthesis: {
      thesis: "Harness provides a developer-first CI/CD platform that enforces policy guardrails and automated deployment verification to reduce release risk at enterprise scale.",
      key_concepts: ["Pipelines", "Delegates", "Feature Flags", "Canary Deployments", "Policy Engine"],
    },
  },
  { id: "c2", title: "Harness Engineering", mcqStatus: "ready", mcqCount: 20,
    synthesis: {
      thesis: "An introduction to Harness CI/CD fundamentals covering pipeline construction, secret management, and multi-cloud deployment strategies.",
      key_concepts: ["CI Stages", "Secrets", "Connectors", "Multi-cloud", "Rollback"],
    },
  },
  { id: "c3", title: "World Models", mcqStatus: "ready", mcqCount: 20,
    synthesis: {
      thesis: "World models are learned internal representations that enable agents to simulate future states and plan efficiently without real-world interaction.",
      key_concepts: ["Latent Space", "RSSM", "Dreamer", "Model-Based RL", "Imagination"],
    },
  },
];

const MOCK_MCQS: MCQDoc[] = [
  // orient × 4
  { id: "q01", function: "orient", pageNumber: 2, hasVisual: false, correctIndex: 1,
    question: "What is the primary goal of the Harness CI/CD platform as described in this document?",
    options: [
      { letter: "A", text: "To replace Kubernetes container orchestration entirely" },
      { letter: "B", text: "To automate software delivery with policy guardrails" },
      { letter: "C", text: "To provide real-time production incident monitoring" },
      { letter: "D", text: "To optimise cloud infrastructure costs automatically" },
    ],
    explanation: "Harness positions itself as a developer-centric delivery platform built around policy enforcement and automated guardrails, not a replacement for orchestration or monitoring tools." },
  { id: "q02", function: "orient", pageNumber: 4, hasVisual: true, correctIndex: 2,
    question: "Which diagram in chapter 1 illustrates the relationship between the Harness control plane and the delegate?",
    options: [
      { letter: "A", text: "The multi-cloud topology map" },
      { letter: "B", text: "The pipeline execution graph" },
      { letter: "C", text: "The agent/control-plane architecture diagram" },
      { letter: "D", text: "The secret manager integration flowchart" },
    ],
    explanation: "Chapter 1 opens with the agent/control-plane diagram showing how delegates communicate outbound to the Harness SaaS, eliminating inbound firewall rules." },
  { id: "q03", function: "orient", pageNumber: 1, hasVisual: false, correctIndex: 0,
    question: "According to the introduction, which problem does Harness primarily address?",
    options: [
      { letter: "A", text: "Slow, error-prone manual release processes" },
      { letter: "B", text: "Lack of container image signing standards" },
      { letter: "C", text: "Insufficient compute capacity in cloud providers" },
      { letter: "D", text: "Absence of multi-region database replication" },
    ],
    explanation: "The introduction frames Harness as a solution to slow, risky manual releases — it automates the delivery pipeline with built-in verification and rollback." },
  { id: "q04", function: "orient", pageNumber: 6, hasVisual: false, correctIndex: 3,
    question: "Which of the following best describes the Harness delegate component?",
    options: [
      { letter: "A", text: "A SaaS module that runs in Harness's own data centre" },
      { letter: "B", text: "A load balancer for routing pipeline traffic" },
      { letter: "C", text: "A secret vault for storing deployment credentials" },
      { letter: "D", text: "A lightweight agent installed in the customer's infrastructure" },
    ],
    explanation: "The delegate is a customer-installed agent that executes pipeline tasks locally, communicating outbound to the Harness control plane so credentials never leave the customer's environment." },
  // understand × 5
  { id: "q05", function: "understand", pageNumber: 10, hasVisual: false, correctIndex: 1,
    question: "What does the delegate handle that distinguishes it from a traditional CI agent?",
    options: [
      { letter: "A", text: "It compiles source code before pushing to the registry" },
      { letter: "B", text: "It executes tasks locally and never exposes secrets to Harness SaaS" },
      { letter: "C", text: "It pulls pipeline definitions directly from Git on each run" },
      { letter: "D", text: "It manages Kubernetes cluster auto-scaling decisions" },
    ],
    explanation: "Unlike traditional agents that receive credentials from a central server, the Harness delegate executes within the customer's environment so secrets remain under customer control." },
  { id: "q06", function: "understand", pageNumber: 13, hasVisual: false, correctIndex: 0,
    question: "How does Harness differ from a traditional Jenkins-based CI pipeline?",
    options: [
      { letter: "A", text: "Harness offers built-in deployment verification and automated rollback, whereas Jenkins requires custom scripting" },
      { letter: "B", text: "Jenkins supports canary deployments natively; Harness does not" },
      { letter: "C", text: "Harness pipelines run exclusively on Kubernetes; Jenkins supports bare metal" },
      { letter: "D", text: "Jenkins has a policy engine; Harness relies on external OPA servers" },
    ],
    explanation: "The document contrasts Harness's built-in verification strategies and automatic rollback against Jenkins, which requires teams to script these capabilities themselves." },
  { id: "q07", function: "understand", pageNumber: 16, hasVisual: true, correctIndex: 2,
    question: "What are the three phases of a Harness canary deployment as shown in figure 3.2?",
    options: [
      { letter: "A", text: "Build → Test → Release" },
      { letter: "B", text: "Stage → Verify → Promote" },
      { letter: "C", text: "Canary → Verification → Full rollout (or rollback)" },
      { letter: "D", text: "Primary → Shadow → Cutover" },
    ],
    explanation: "Figure 3.2 shows the three-phase canary flow: route a small percentage of traffic to the canary, run automated verification, then either promote or rollback." },
  { id: "q08", function: "understand", pageNumber: 19, hasVisual: false, correctIndex: 3,
    question: "Which Harness module manages runtime configuration without a new deployment?",
    options: [
      { letter: "A", text: "CD — Continuous Delivery" },
      { letter: "B", text: "CI — Continuous Integration" },
      { letter: "C", text: "CCM — Cloud Cost Management" },
      { letter: "D", text: "FF — Feature Flags" },
    ],
    explanation: "Feature Flags (FF) allow teams to toggle functionality at runtime via configuration, decoupling feature release from code deployment." },
  { id: "q09", function: "understand", pageNumber: 22, hasVisual: false, correctIndex: 1,
    question: "What triggers an automatic rollback in a Harness pipeline?",
    options: [
      { letter: "A", text: "Any failed unit test in the CI stage" },
      { letter: "B", text: "A verification step that detects anomalies against a defined baseline" },
      { letter: "C", text: "A manual approval gate being rejected" },
      { letter: "D", text: "A pod restart count exceeding the Kubernetes threshold" },
    ],
    explanation: "Harness rollback is triggered by continuous verification — it compares post-deployment metrics against a baseline and rolls back automatically if anomalies exceed configured thresholds." },
  // recognize × 5
  { id: "q10", function: "recognize", pageNumber: 25, hasVisual: false, correctIndex: 0,
    question: "A team deploys a new API version to 5% of production traffic, monitors error rates for 10 minutes, then expands or reverts. Which Harness concept applies?",
    options: [
      { letter: "A", text: "Canary deployment with continuous verification" },
      { letter: "B", text: "Blue-green deployment with manual approval" },
      { letter: "C", text: "Rolling deployment with health checks" },
      { letter: "D", text: "Feature flag with metric-based gating" },
    ],
    explanation: "The described pattern — incremental traffic shift + automated metric monitoring + promote/rollback decision — is the Harness canary deployment with continuous verification." },
  { id: "q11", function: "recognize", pageNumber: 27, hasVisual: false, correctIndex: 2,
    question: "An engineer installs a small process on a Kubernetes node. It contacts Harness SaaS outbound on port 443 and receives task instructions. What component is this?",
    options: [
      { letter: "A", text: "The Harness Operator" },
      { letter: "B", text: "The pipeline runner" },
      { letter: "C", text: "The delegate" },
      { letter: "D", text: "The connector" },
    ],
    explanation: "An outbound-only agent installed in customer infrastructure that receives task instructions from the control plane is exactly the delegate model." },
  { id: "q12", function: "recognize", pageNumber: 30, hasVisual: false, correctIndex: 1,
    question: "A team ships code daily but toggles features on only for internal users. External users get the previous experience. Which mechanism does this match?",
    options: [
      { letter: "A", text: "Canary deployment" },
      { letter: "B", text: "Feature flags" },
      { letter: "C", text: "Blue-green deployment" },
      { letter: "D", text: "A/B testing at infrastructure level" },
    ],
    explanation: "Shipping code while controlling visibility per user segment through configuration — without a new deployment — is the Feature Flags pattern." },
  { id: "q13", function: "recognize", pageNumber: 32, hasVisual: true, correctIndex: 3,
    question: "The diagram shows two identical production environments: one receives live traffic while the other is updated, then traffic is switched instantly. What strategy is this?",
    options: [
      { letter: "A", text: "Canary deployment" },
      { letter: "B", text: "Rolling update" },
      { letter: "C", text: "Shadow deployment" },
      { letter: "D", text: "Blue-green deployment" },
    ],
    explanation: "Maintaining two mirror environments and switching traffic in a single cutover is the blue-green pattern, which eliminates downtime but doubles infrastructure cost during the switch." },
  { id: "q14", function: "recognize", pageNumber: 35, hasVisual: false, correctIndex: 0,
    question: "A policy blocks any pipeline that lacks a manual approval gate before production. In which Harness module would this rule be configured?",
    options: [
      { letter: "A", text: "Policy Engine (OPA-based)" },
      { letter: "B", text: "Feature Flags" },
      { letter: "C", text: "Continuous Verification" },
      { letter: "D", text: "Secret Manager" },
    ],
    explanation: "Harness uses an Open Policy Agent (OPA)-based Policy Engine to enforce governance rules such as mandatory approval gates before production stages." },
  // connect × 4
  { id: "q15", function: "connect", pageNumber: 38, hasVisual: false, correctIndex: 2,
    question: "How do Feature Flags and canary deployments complement each other in the document's recommended release workflow?",
    options: [
      { letter: "A", text: "Feature Flags replace canary by enabling instant rollback without redeployment" },
      { letter: "B", text: "Canary eliminates the need for Feature Flags by routing users at the infrastructure level" },
      { letter: "C", text: "Canary validates infrastructure stability; Feature Flags control user exposure within a stable deployment" },
      { letter: "D", text: "They address the same problem and should not be used together" },
    ],
    explanation: "The document recommends using canary deployments to validate infrastructure health, then layering Feature Flags on top to progressively expose features to user segments." },
  { id: "q16", function: "connect", pageNumber: 40, hasVisual: false, correctIndex: 1,
    question: "How does the delegate architecture relate to the Secret Manager integration described in chapter 4?",
    options: [
      { letter: "A", text: "The delegate stores secrets in its local filesystem to avoid SaaS round-trips" },
      { letter: "B", text: "The delegate fetches secrets directly from the customer's vault at runtime, so they never traverse the Harness control plane" },
      { letter: "C", text: "The delegate requires Harness SaaS to decrypt secrets before task execution" },
      { letter: "D", text: "Secret Manager and the delegate are independent subsystems with no integration" },
    ],
    explanation: "Because the delegate runs in customer infrastructure, it can fetch secrets from on-premises or cloud vaults at execution time — credentials never reach Harness's servers." },
  { id: "q17", function: "connect", pageNumber: 43, hasVisual: false, correctIndex: 0,
    question: "The Policy Engine and Continuous Verification both act as gatekeepers. What fundamental difference determines when each is applied?",
    options: [
      { letter: "A", text: "Policy Engine enforces pre-deployment governance rules; Verification evaluates post-deployment runtime signals" },
      { letter: "B", text: "Policy Engine runs after deployment; Verification runs before" },
      { letter: "C", text: "Both run pre-deployment but on different artifact types" },
      { letter: "D", text: "Policy Engine is optional; Verification is always mandatory" },
    ],
    explanation: "Policy Engine gates are evaluated before deployment begins; Continuous Verification runs after deployment using live signals to decide whether to proceed or roll back." },
  { id: "q18", function: "connect", pageNumber: 46, hasVisual: false, correctIndex: 3,
    question: "How does the document link the shift-left principle to both the CI stage and the Policy Engine?",
    options: [
      { letter: "A", text: "Shift-left applies only to testing in CI; Policy Engine is a post-deployment concern" },
      { letter: "B", text: "The Policy Engine enforces shift-left by running security scans after production deployment" },
      { letter: "C", text: "Shift-left in CI means running unit tests; Policy Engine adds integration tests in staging" },
      { letter: "D", text: "Both embody shift-left by surfacing failures early — CI catches code defects, Policy Engine catches governance violations, before production" },
    ],
    explanation: "The document ties shift-left to both dimensions: CI surfaces bugs early in the development cycle; Policy Engine surfaces compliance violations before they reach production." },
  // evaluate × 2
  { id: "q19", function: "evaluate", pageNumber: 50, hasVisual: false, correctIndex: 1,
    question: "Evaluate the trade-offs between canary and blue-green deployments. Under what conditions should a team prefer blue-green?",
    options: [
      { letter: "A", text: "When incremental metric comparison is more important than zero-downtime cutover" },
      { letter: "B", text: "When the application cannot tolerate partial state inconsistencies across versions and instant cutover is preferable to gradual traffic shift" },
      { letter: "C", text: "When infrastructure cost is constrained and running two full environments is not feasible" },
      { letter: "D", text: "When the team requires automated metric-based rollback rather than manual intervention" },
    ],
    explanation: "Blue-green is recommended when state consistency is critical — stateful applications or schema migrations that make running two versions simultaneously problematic benefit from the atomic cutover." },
  { id: "q20", function: "evaluate", pageNumber: 54, hasVisual: false, correctIndex: 2,
    question: "The document argues that the delegate model improves security over traditional agent architectures. Critically assess this claim — what assumption must hold for it to be valid?",
    options: [
      { letter: "A", text: "The Harness SaaS control plane must be certified as a zero-trust environment" },
      { letter: "B", text: "The customer's Kubernetes cluster must have network policies preventing all egress except to Harness" },
      { letter: "C", text: "The customer's own infrastructure must already be secure, since the delegate's security boundary is only as strong as the environment it runs in" },
      { letter: "D", text: "Secrets must be encrypted end-to-end between the vault and the delegate using customer-managed keys" },
    ],
    explanation: "The delegate model shifts the trust boundary into the customer's infrastructure. This is only an improvement if that environment is itself hardened — a compromised node running the delegate nullifies the security benefit." },
];

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

function statusPillCls(status: MockStudent["status"], s: Record<string, string>) {
  if (status === "active")  return `${s.pill} ${s.pillActive}`;
  if (status === "invited") return `${s.pill} ${s.pillInvited}`;
  return `${s.pill} ${s.pillPending}`;
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

function ReformulationPanel({ result, onKeep, onEdit, onAccept }: {
  result: ReformResult;
  onKeep:   () => void;
  onEdit:   () => void;
  onAccept: () => void;
}) {
  return (
    <div className={styles.reformulationPanel}>
      <div className={styles.reformulationHd}>
        <span className={styles.reformulationHdLabel}>Reformulation ready</span>
        <button className={styles.reformulationDismiss} onClick={onKeep}>✕</button>
      </div>
      <div className={styles.reformulationCompare}>
        <div className={styles.reformulationCol}>
          <span className={styles.reformulationColLabel}>Original</span>
          <p className={styles.reformulationText}>{result.original}</p>
        </div>
        <div className={styles.reformulationCol}>
          <span className={styles.reformulationColLabel}>Reformulated</span>
          <p className={`${styles.reformulationText} ${styles.reformulationTextNew}`}>
            {result.reformulated}
          </p>
        </div>
      </div>
      <div className={styles.reformulationActions}>
        <button className={styles.keepBtn}       onClick={onKeep}>Keep original</button>
        <button className={styles.editReformBtn} onClick={onEdit}>Edit ↗</button>
        <button className={styles.acceptBtn}     onClick={onAccept}>Accept</button>
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

  const acceptReform = (field: string) => {
    const result = pending[field];
    applyToField(field, result.reformulated);
    setAcceptedReforms(prev => ({ ...prev, [field]: { original: result.original, reformulated: result.reformulated } }));
    dismiss(field);
  };

  const editReform = (field: string) => {
    applyToField(field, pending[field].reformulated);
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
            onEdit={()   => editReform("question")}
            onAccept={() => acceptReform("question")} />
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
                    onEdit={()   => editReform(field)}
                    onAccept={() => acceptReform(field)} />
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
            onEdit={()   => editReform("explanation")}
            onAccept={() => acceptReform("explanation")} />
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
          <button className={styles.deleteBtn} onClick={onDelete}>Delete question</button>
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
  const [mcqLoading, setMcqLoading]         = useState(false);
  const [editDraft, setEditDraft]           = useState<EditDraft | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<MockStudent | null>(null);
  const [leftCollapsed, setLeftCollapsed]   = useState(false);
  const [slideExpanded, setSlideExpanded]   = useState(true);
  const [facultyId, setFacultyId]           = useState("nicolas");

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
    fetch(`${API}/api/mcq/bank/${selectedCourse.id}?userId=${facultyId}`)
      .then(r => r.json())
      .then(data => {
        /* Response shape: { mcqs: [...], count: N, courseId: string } */
        const raw: MCQDoc[] = Array.isArray(data) ? data : (data.mcqs ?? []);
        setMcqBank(raw);
      })
      .catch(err => { console.warn("MCQ bank fetch failed:", err); setMcqBank([]); })
      .finally(() => setMcqLoading(false));
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
          courseId:      selectedCourse.id,
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
      <section className={styles.paneMiddle}>
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
          {(["questions","share","students","analytics"] as Mode[]).map(m => (
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
                {mcqLoading ? "Loading…" : `${mcqBank.length} questions`}
              </span>
              <button className={styles.addBtn} onClick={openNew} disabled={mcqLoading}>+ New question</button>
            </div>
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
                      <div className={styles.qRowMain} onClick={() => openEdit(q)}>
                        <div className={styles.qText}>{q.question}</div>
                        {q.hasVisual && <span className={styles.visualFlag}>visual</span>}
                      </div>
                      <div className={styles.qActions}>
                        <button className={styles.editBtn} onClick={() => openEdit(q)}>Edit</button>
                        <button className={styles.delBtnSm} onClick={() => deleteQuestion(q.id)}>Del</button>
                      </div>
                    </div>
                  ))}
                  {qs.length === 0 && (
                    <div className={styles.emptyGroup}>No {fn} questions yet</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Share ── */}
        {activeMode === "share" && (
          <div className={styles.panelShell}>
            <div className={styles.shareInputRow}>
              <input className={styles.shareInput} type="email" placeholder="Student email address…" />
              <button className={styles.addBtn}>Share</button>
            </div>
            <div className={styles.panelHd}>
              <span className={styles.eyebrow}>{MOCK_STUDENTS.filter(s=>s.status!=="pending").length} students with access</span>
              <button className={styles.ghostBtn}>Export</button>
            </div>
            <div className={styles.panelScroll}>
              {MOCK_STUDENTS.filter(s => s.status !== "pending").map(s => (
                <div key={s.id} className={styles.studentRow}>
                  <div className={`${styles.avatar} ${styles[`avatar_${s.status}` as keyof typeof styles]}`}>{s.initials}</div>
                  <div className={styles.studentInfo}>
                    <div className={styles.studentEmail}>{s.email}</div>
                    <div className={styles.studentMeta}>{s.sessions > 0 ? `${s.sessions} session${s.sessions>1?"s":""}` : "No sessions yet"}</div>
                  </div>
                  <span className={statusPillCls(s.status, styles)}>{s.status}</span>
                  <button className={styles.delBtnSm}>Remove</button>
                </div>
              ))}
              <div className={styles.courseSettingsBlock}>
                <span className={styles.eyebrow} style={{ display:"block", marginBottom:8 }}>Course settings</span>
                <div className={styles.settingRow}>
                  <span className={styles.settingLabel}>Allow PDF download</span>
                  <span className={styles.toggleOff}>Off</span>
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
