"use client";

import { useState } from "react";
import styles from "./Hero.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

export default function Hero() {
  const { lang } = useLanguage();
  const tx = getT(lang).hero;
  const [active, setActive] = useState(0);

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.eyebrow}>
            <span className="ribbon">{tx.ribbon}</span>
          </div>
          <h1 className={styles.h1}>
            {tx.h1a}{" "}<em className={styles.em}>{tx.h1em}</em>
          </h1>
          <p className={styles.sub}>{tx.sub}</p>
          <div className={styles.actions}>
            <a className="btn-p" href="https://app.stg.tutor.studentcentral.ai/login" target="_blank" rel="noopener noreferrer">{tx.tryIt}</a>
            <a className="btn-s" href="/workspace">{tx.myWorkspace}</a>
          </div>
          <div className={styles.trustStrip}>
            {tx.trust.map((t) => (
              <div key={t} className={styles.trustItem}>
                <span className={styles.trustDot} />{t}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.stepTabs}>
            {tx.steps.map((s, i) => (
              <button key={i} className={`${styles.stepTab} ${active === i ? styles.stepTabActive : ""}`} onClick={() => setActive(i)}>
                <span className={styles.stepTabNum}>{s.num}</span>
                <span className={styles.stepTabLabel}>{s.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.panel}>
            {active === 0 && (
              <div className={styles.panelInner}>
                <div className={styles.assessTopic}>{tx.step1.topic}</div>
                <div className={styles.assessQ}>{tx.step1.q}</div>
                {tx.step1.opts.map((opt, i) => (
                  <div key={i} className={`${styles.mcqOpt} ${i === tx.step1.selected ? styles.selected : ""}`}>
                    <span className={styles.radio}>{i === tx.step1.selected && <span className={styles.radioFill} />}</span>
                    {opt}
                  </div>
                ))}
              </div>
            )}

            {active === 1 && (
              <div className={styles.panelInner}>
                <div className={styles.chatThread}>
                  <div className={`${styles.chatMsg} ${styles.chatAI}`}><span className={styles.chatSender}>{tx.step2.senderAI}</span>{tx.step2.ai1}</div>
                  <div className={`${styles.chatMsg} ${styles.chatStudent}`}><span className={styles.chatSender}>{tx.step2.senderStudent}</span>{tx.step2.s1}</div>
                  <div className={`${styles.chatMsg} ${styles.chatAI}`}><span className={styles.chatSender}>{tx.step2.senderAI}</span>{tx.step2.ai2}</div>
                  <div className={`${styles.chatMsg} ${styles.chatStudent}`}><span className={styles.chatSender}>{tx.step2.senderStudent}</span>{tx.step2.s2}</div>
                  <div className={`${styles.chatMsg} ${styles.chatAI}`}><span className={styles.chatSender}>{tx.step2.senderAI}</span>{tx.step2.ai3}</div>
                  <div className={`${styles.chatMsg} ${styles.chatStudent}`}><span className={styles.chatSender}>{tx.step2.senderStudent}</span>{tx.step2.s3}</div>
                </div>
              </div>
            )}

            {active === 2 && (
              <div className={`${styles.panelInner} ${styles.panelDark}`}>
                <div className={styles.dashVerdict}>
                  <span className={styles.dashVerdictIcon}>✓</span>
                  <div>
                    <div className={styles.dashVerdictTitle}>{tx.step3.verdictTitle}</div>
                    <div className={styles.dashVerdictSub}>{tx.step3.verdictSub}</div>
                  </div>
                </div>
                <div className={styles.dashSection}>
                  <div className={styles.dashSectionLabel}>{tx.step3.section1Label}</div>
                  <div className={styles.dashPoints}>
                    {tx.step3.section1Points.map((p) => (
                      <div key={p} className={styles.dashPoint}><span className={styles.dashDotGreen} />{p}</div>
                    ))}
                  </div>
                </div>
                <div className={styles.dashSection}>
                  <div className={styles.dashSectionLabel}>{tx.step3.section2Label}</div>
                  <div className={styles.dashPoints}>
                    <div className={styles.dashPoint}><span className={styles.dashDotAmber} />{tx.step3.section2Points[0]}</div>
                    <div className={styles.dashPoint}><span className={styles.dashDotNeutral} />{tx.step3.section2Points[1]}</div>
                  </div>
                </div>
                <div className={styles.dashReliable}>
                  <div className={styles.dashSectionLabel}>{tx.step3.reliableLabel}</div>
                  <div className={styles.dashReliableVerdict}>{tx.step3.reliableVerdict}</div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.carouselNav}>
            <button className={styles.navBtn} onClick={() => setActive(i => Math.max(0, i - 1))} disabled={active === 0}>{tx.prev}</button>
            <div className={styles.dots}>
              {tx.steps.map((_, i) => (
                <button key={i} className={`${styles.dot} ${active === i ? styles.dotActive : ""}`} onClick={() => setActive(i)} />
              ))}
            </div>
            <button className={styles.navBtn} onClick={() => setActive(i => Math.min(tx.steps.length - 1, i + 1))} disabled={active === tx.steps.length - 1}>{tx.next}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
