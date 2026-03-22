"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./mcq.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

/* ── MCQ bank (questions & answers stay in English — course language) ── */
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
  const { lang } = useLanguage();
  const ui       = getT(lang).mcq;
  const id       = params.get("id") ?? "default";
  const courseId = MCQ_BANK[id] ? id : "default";
  const { title, mcq } = MCQ_BANK[courseId];

  const [selected,  setSelected]  = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [screen,    setScreen]    = useState<Screen>("question");

  const isCorrect = selected === mcq.correctIndex;

  useEffect(() => {
    if (submitted) {
      const t = setTimeout(() => setScreen("result"), 400);
      return () => clearTimeout(t);
    }
  }, [submitted]);

  const handleSubmit = () => { if (selected === null) return; setSubmitted(true); };
  const handleRetry  = () => { setSelected(null); setSubmitted(false); setScreen("question"); };

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
          <div className={styles.headerTitle}>{title}</div>
        </div>
        <div className={styles.headerRight} />
      </header>

      <main className={styles.main}>
        <div className={styles.card}>

          {screen === "question" && (
            <>
              <div className={styles.questionWrap}>
                <div className={styles.questionLabel}>{ui.questionLabel}</div>
                {/* Question text stays in English — course language */}
                <h1 className={styles.question}>{mcq.question}</h1>
              </div>
              <div className={styles.options}>
                {mcq.options.map((opt, i) => {
                  const isSelected   = selected === i;
                  const isCorrectOpt = submitted && i === mcq.correctIndex;
                  const isWrongOpt   = submitted && isSelected && i !== mcq.correctIndex;
                  return (
                    <button key={i} className={[styles.option, isSelected && !submitted ? styles.optSelected : "", isCorrectOpt ? styles.optCorrect : "", isWrongOpt ? styles.optWrong : ""].join(" ")} onClick={() => { if (!submitted) setSelected(i); }} disabled={submitted}>
                      <span className={styles.optLetter}>{LETTERS[i]}</span>
                      <span className={styles.optText}>{opt}</span>
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

          {screen === "result" && (
            <>
              <div className={`${styles.resultBanner} ${isCorrect ? styles.bannerCorrect : styles.bannerWrong}`}>
                <div className={styles.resultIconWrap}>
                  <span className={styles.resultIcon}>{isCorrect ? "✓" : "✗"}</span>
                </div>
                <div>
                  <div className={styles.resultTitle}>{isCorrect ? ui.correctTitle : ui.incorrectTitle}</div>
                  <div className={styles.resultSub}>
                    {isCorrect ? ui.correctSub : `${ui.incorrectPrefix} "${mcq.options[mcq.correctIndex]}"`}
                  </div>
                </div>
              </div>

              <div className={styles.recapSection}>
                <div className={styles.sectionLabel}>{ui.yourAnswer}</div>
                <div className={`${styles.recapAnswer} ${isCorrect ? styles.recapCorrect : styles.recapWrong}`}>
                  <span className={styles.optLetter}>{LETTERS[selected!]}</span>
                  <span>{mcq.options[selected!]}</span>
                </div>
              </div>

              {/* Explanation stays in English — course language */}
              <div className={styles.explanationSection}>
                <div className={styles.sectionLabel}>{ui.whyMatters}</div>
                <p className={styles.explanationText}>{mcq.explanation}</p>
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

export default function MCQPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--surface-low)", minHeight: "100vh" }} />}>
      <MCQContent />
    </Suspense>
  );
}
