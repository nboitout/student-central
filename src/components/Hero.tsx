"use client";

import { useState } from "react";
import styles from "./Hero.module.css";

const STEPS = [
  { num: "01", label: "Answer the question" },
  { num: "02", label: "Explain your reasoning" },
  { num: "03", label: "Faculty receives the signal" },
];

export default function Hero() {
  const [active, setActive] = useState(0);

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.inner}>

        {/* ── Left col ── */}
        <div className={styles.left}>
          <div className={styles.eyebrow}>
            <span className="ribbon">Assessment beyond the multiple-choice score</span>
          </div>
          <h1 className={styles.h1}>
            See the thinking behind{" "}
            <em className={styles.em}>every answer</em>
          </h1>
          <p className={styles.sub}>
            Student Central helps educators go beyond MCQs by combining answer
            selection with short AI-guided discussion. The result: educators
            gain a deeper view of student reasoning, misconceptions, confidence,
            and true topic mastery.
          </p>
          <div className={styles.actions}>
            <a
              className="btn-p"
              href="https://app.stg.tutor.studentcentral.ai/login"
              target="_blank"
              rel="noopener noreferrer"
            >
              Try it
            </a>
            <a className="btn-s" href="/workspace">
              My Workspace
            </a>
          </div>
          <div className={styles.trustStrip}>
            {[
              "Built for higher education",
              "Course-aligned assessment flows",
              "Faculty-controlled prompts and review",
              "No student data used to train public models",
            ].map((t) => (
              <div key={t} className={styles.trustItem}>
                <span className={styles.trustDot} />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right col: step carousel ── */}
        <div className={styles.visual}>

          {/* Tab row */}
          <div className={styles.stepTabs}>
            {STEPS.map((s, i) => (
              <button
                key={i}
                className={`${styles.stepTab} ${active === i ? styles.stepTabActive : ""}`}
                onClick={() => setActive(i)}
              >
                <span className={styles.stepTabNum}>{s.num}</span>
                <span className={styles.stepTabLabel}>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className={styles.panel}>

            {/* Step 1 — MCQ */}
            {active === 0 && (
              <div className={styles.panelInner}>
                <div className={styles.assessTopic}>Assessment moment</div>
                <div className={styles.assessQ}>
                  Which of the following best explains why stablecoins reduce
                  friction in cross-border payments?
                </div>
                <div className={styles.mcqOpt}>
                  <span className={styles.radio} />
                  Because stablecoins are pegged to fiat currencies, eliminating
                  exchange rate risk entirely.
                </div>
                <div className={`${styles.mcqOpt} ${styles.selected}`}>
                  <span className={styles.radio}>
                    <span className={styles.radioFill} />
                  </span>
                  Because settlement can be faster and more programmable than
                  traditional correspondent banking flows.
                </div>
                <div className={styles.mcqOpt}>
                  <span className={styles.radio} />
                  Because central banks are legally required to accept stablecoin
                  payments.
                </div>
              </div>
            )}

            {/* Step 2 — Discuss */}
            {active === 1 && (
              <div className={styles.panelInner}>
                <div className={styles.chatThread}>
                  <div className={`${styles.chatMsg} ${styles.chatAI}`}>
                    <span className={styles.chatSender}>AI Tutor</span>
                    What made you choose this answer?
                  </div>
                  <div className={`${styles.chatMsg} ${styles.chatStudent}`}>
                    <span className={styles.chatSender}>Student</span>
                    I think it&apos;s because stablecoins are faster… like they don&apos;t go through banks the same way.
                  </div>
                  <div className={`${styles.chatMsg} ${styles.chatAI}`}>
                    <span className={styles.chatSender}>AI Tutor</span>
                    What do you mean by &ldquo;not the same way&rdquo;?
                  </div>
                  <div className={`${styles.chatMsg} ${styles.chatStudent}`}>
                    <span className={styles.chatSender}>Student</span>
                    Like… normally payments go through several banks, right? And that takes time.
                  </div>
                  <div className={`${styles.chatMsg} ${styles.chatAI}`}>
                    <span className={styles.chatSender}>AI Tutor</span>
                    Exactly. And how is it different with stablecoins?
                  </div>
                  <div className={`${styles.chatMsg} ${styles.chatStudent}`}>
                    <span className={styles.chatSender}>Student</span>
                    With stablecoins it can go directly on the blockchain, so fewer intermediaries and faster settlement.
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Signal */}
            {active === 2 && (
              <div className={`${styles.panelInner} ${styles.panelDark}`}>
                <div className={styles.insightHdr}>Assessment signal</div>
                {[
                  { label: "Answer correctness",          badge: "Correct", cls: styles.bgGreen },
                  { label: "Explanation quality",         badge: "Strong",  cls: styles.bgBlue  },
                  { label: "Misconception risk",          badge: "Low",     cls: styles.bgGray  },
                  { label: "Confidence of understanding", badge: "High",    cls: styles.bgGreen },
                ].map(({ label, badge, cls }) => (
                  <div key={label} className={styles.sigRow}>
                    <span className={styles.sigLabel}>{label}</span>
                    <span className={`${styles.sigBadge} ${cls}`}>{badge}</span>
                  </div>
                ))}
                <div className={styles.insightDiv} />
                <div className={styles.insightSub}>Why this matters</div>
                {[
                  "Distinguished mechanism from consequence",
                  "Rejected distractor with valid reasoning",
                  "Demonstrated transfer beyond memorized wording",
                ].map((b) => (
                  <div key={b} className={styles.insightBul}>{b}</div>
                ))}
              </div>
            )}

          </div>

          {/* Prev / Next nav */}
          <div className={styles.carouselNav}>
            <button
              className={styles.navBtn}
              onClick={() => setActive(i => Math.max(0, i - 1))}
              disabled={active === 0}
            >
              ← Prev
            </button>
            <div className={styles.dots}>
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${active === i ? styles.dotActive : ""}`}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
            <button
              className={styles.navBtn}
              onClick={() => setActive(i => Math.min(STEPS.length - 1, i + 1))}
              disabled={active === STEPS.length - 1}
            >
              Next →
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
