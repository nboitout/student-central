"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./mcq.module.css";

/* ── MCQ bank ───────────────────────────────────────────── */
interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const MCQ_BANK: Record<string, { title: string; mcq: MCQQuestion }> = {
  "1": {
    title: "International Software Management",
    mcq: {
      question: "Which software development lifecycle model is best suited for projects with well-defined, stable requirements?",
      options: ["Agile / Scrum", "Waterfall", "DevOps continuous delivery", "Spiral model"],
      correctIndex: 1,
      explanation: "The Waterfall model follows a sequential, phase-by-phase approach and works best when requirements are clear and unlikely to change — making it ideal for well-defined projects.",
    },
  },
  "2": {
    title: "AGILE Project Management",
    mcq: {
      question: "In Agile, what is the primary purpose of a Sprint Retrospective?",
      options: [
        "To demonstrate completed work to stakeholders",
        "To plan the backlog for the next sprint",
        "To inspect the team process and identify improvements",
        "To review individual developer performance",
      ],
      correctIndex: 2,
      explanation: "The Sprint Retrospective is a dedicated ceremony for the team to reflect on how they worked — identifying what went well, what didn't, and agreeing on actionable improvements for the next sprint.",
    },
  },
  "3": {
    title: "Digital Transformation",
    mcq: {
      question: "Which concept best describes the use of AI to continuously monitor and adapt business processes based on real-time data?",
      options: [
        "Business Process Reengineering",
        "ERP consolidation",
        "Intelligent process automation",
        "Digital twin simulation",
      ],
      correctIndex: 2,
      explanation: "Intelligent process automation (IPA) combines AI and automation to monitor, analyse, and adapt business processes dynamically — going well beyond rule-based automation.",
    },
  },
  default: {
    title: "Course",
    mcq: {
      question: "Which of the following best describes a key characteristic of digital transformation in organisations?",
      options: [
        "Replacing all legacy IT systems with cloud infrastructure",
        "Integrating digital technology into all areas of the business",
        "Automating the entire workforce with AI",
        "Moving all operations fully online",
      ],
      correctIndex: 1,
      explanation: "Digital transformation is fundamentally about integrating digital technology across all business areas — changing how the organisation operates and delivers value, not simply adopting new tools.",
    },
  },
};

const LETTERS = ["A", "B", "C", "D"];

type Screen = "question" | "result";

function MCQContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const id       = params.get("id") ?? "default";
  const courseId = MCQ_BANK[id] ? id : "default";
  const { title, mcq } = MCQ_BANK[courseId];

  const [selected,  setSelected]  = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [screen,    setScreen]    = useState<Screen>("question");

  const isCorrect = selected === mcq.correctIndex;

  /* Animate to result after brief delay */
  useEffect(() => {
    if (submitted) {
      const t = setTimeout(() => setScreen("result"), 400);
      return () => clearTimeout(t);
    }
  }, [submitted]);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
  };

  const handleRetry = () => {
    setSelected(null);
    setSubmitted(false);
    setScreen("question");
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to workspace
        </button>
        <div className={styles.headerCenter}>
          <div className={styles.headerEyebrow}>Multiple Choice Question</div>
          <div className={styles.headerTitle}>{title}</div>
        </div>
        <div className={styles.headerRight} />
      </header>

      {/* Content */}
      <main className={styles.main}>
        <div className={styles.card}>

          {/* ── Question screen ── */}
          {screen === "question" && (
            <>
              <div className={styles.questionWrap}>
                <div className={styles.questionLabel}>Question</div>
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
                      <span className={styles.optText}>{opt}</span>
                      {isCorrectOpt && <span className={styles.optMark}>✓</span>}
                      {isWrongOpt   && <span className={styles.optMark}>✗</span>}
                    </button>
                  );
                })}
              </div>

              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={() => router.back()}>Cancel</button>
                <button
                  className={`${styles.submitBtn} ${selected === null ? styles.submitDisabled : ""}`}
                  onClick={handleSubmit}
                  disabled={selected === null || submitted}
                >
                  Submit answer
                </button>
              </div>
            </>
          )}

          {/* ── Result screen ── */}
          {screen === "result" && (
            <>
              {/* Banner */}
              <div className={`${styles.resultBanner} ${isCorrect ? styles.bannerCorrect : styles.bannerWrong}`}>
                <div className={styles.resultIconWrap}>
                  <span className={styles.resultIcon}>{isCorrect ? "✓" : "✗"}</span>
                </div>
                <div>
                  <div className={styles.resultTitle}>{isCorrect ? "Correct answer" : "Incorrect answer"}</div>
                  <div className={styles.resultSub}>
                    {isCorrect
                      ? "You selected the right answer."
                      : `The correct answer was: "${mcq.options[mcq.correctIndex]}"`}
                  </div>
                </div>
              </div>

              {/* Your answer */}
              <div className={styles.recapSection}>
                <div className={styles.sectionLabel}>Your answer</div>
                <div className={`${styles.recapAnswer} ${isCorrect ? styles.recapCorrect : styles.recapWrong}`}>
                  <span className={styles.optLetter}>{LETTERS[selected!]}</span>
                  <span>{mcq.options[selected!]}</span>
                </div>
              </div>

              {/* Explanation */}
              <div className={styles.explanationSection}>
                <div className={styles.sectionLabel}>Why this matters</div>
                <p className={styles.explanationText}>{mcq.explanation}</p>
              </div>

              {/* CTA strip */}
              <div className={styles.ctaStrip}>
                <div className={styles.ctaLeft}>
                  <div className={styles.ctaHeadline}>Want to go deeper?</div>
                  <div className={styles.ctaSub}>Explore this topic with AI-guided discussion in Student Central.</div>
                </div>
                <a
                  href="https://app.stg.tutor.studentcentral.ai/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.ctaBtn}
                >
                  Open Student Central →
                </a>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={() => router.back()}>Back to workspace</button>
                <button className={styles.submitBtn} onClick={handleRetry}>Try again</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MCQPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0e1120", minHeight: "100vh" }} />}>
      <MCQContent />
    </Suspense>
  );
}
