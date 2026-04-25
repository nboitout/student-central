"use client";
import styles from "./BloomSection.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

export default function BloomSection() {
  const { lang } = useLanguage();
  const tx = getT(lang).bloom;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}><span className="ribbon">{tx.ribbon}</span></div>
            <h2 className={styles.headline}>
              {tx.h2a}<br />
              {tx.h2em}
            </h2>
          </div>
          <div>
            <p className={styles.sub}>{tx.sub}</p>
          </div>
        </div>

        <svg className={styles.visual} viewBox="0 0 680 328" xmlns="http://www.w3.org/2000/svg" aria-label={tx.visualLabel}>
          <polygon points="330,18 309,66 351,66" fill="#FCA5A5" />
          <polygon points="309,66 288,114 372,114 351,66" fill="#FDE68A" />
          <polygon points="288,114 267,162 393,162 372,114" fill="#BBF7D0" />
          <polygon points="267,162 246,210 414,210 393,162" fill="#86EFAC" />
          <polygon points="246,210 225,258 435,258 414,210" fill="#93C5FD" />
          <polygon points="225,258 204,308 456,308 435,258" fill="#BFDBFE" />

          <line x1="288" y1="114" x2="372" y2="114" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
          <line x1="246" y1="210" x2="414" y2="210" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />

          {tx.levels.map((level, i) => (
            <text key={level.label} x="330" y={levelY[i]} textAnchor="middle" fontSize="11" fill={levelColors[i]} fontFamily="system-ui,sans-serif" fontWeight="500">
              {level.label}
            </text>
          ))}

          <rect x="4" y="50" width="168" height="30" rx="5" fill="#FEF3C7" />
          <text x="88" y="69" textAnchor="middle" fontSize="11" fill="#92400e" fontFamily="system-ui,sans-serif" fontWeight="600">{tx.professorZone.title}</text>
          {tx.professorZone.items.map((item, i) => (
            <text key={item} x="10" y={90 + i * 13} fontSize="9.5" fill="#a16207" fontFamily="system-ui,sans-serif">- {item}</text>
          ))}
          <line x1="172" y1="66" x2="304" y2="66" stroke="#D97706" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.55" />
          <polygon points="300,62 300,70 308,66" fill="#D97706" opacity="0.55" />

          <rect x="4" y="146" width="168" height="30" rx="5" fill="#EEF2FF" />
          <text x="88" y="165" textAnchor="middle" fontSize="11" fill="#3730a3" fontFamily="system-ui,sans-serif" fontWeight="600">{tx.guidedZone.title}</text>
          {tx.guidedZone.items.map((item, i) => (
            <text key={item} x="10" y={185 + i * 13} fontSize="9.5" fill="#4338ca" fontFamily="system-ui,sans-serif">- {item}</text>
          ))}
          <line x1="172" y1="162" x2="260" y2="162" stroke="#6366f1" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.55" />
          <polygon points="256,158 256,166 264,162" fill="#6366f1" opacity="0.55" />

          <rect x="4" y="242" width="168" height="30" rx="5" fill="#DBEAFE" />
          <text x="88" y="261" textAnchor="middle" fontSize="11" fill="#1e40af" fontFamily="system-ui,sans-serif" fontWeight="600">{tx.aiZone.title}</text>
          {tx.aiZone.items.map((item, i) => (
            <text key={item} x="10" y={281 + i * 13} fontSize="9.5" fill="#1d4ed8" fontFamily="system-ui,sans-serif">- {item}</text>
          ))}
          <line x1="172" y1="258" x2="218" y2="258" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.55" />
          <polygon points="214,254 214,262 222,258" fill="#3B82F6" opacity="0.55" />

          <text x="600" y="28" textAnchor="middle" fontSize="8.5" fill="#94a3b8" fontFamily="system-ui,sans-serif" letterSpacing="1.5">{tx.flowLabel}</text>
          <line x1="590" y1="84" x2="590" y2="242" stroke="#e2e8f0" strokeWidth="2" />
          <polygon points="585,108 595,108 590,97" fill="#cbd5e1" />
          <polygon points="585,203 595,203 590,192" fill="#cbd5e1" />

          <circle cx="590" cy="66" r="16" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
          <text x="590" y="70" textAnchor="middle" fontSize="7.5" fill="#92400e" fontFamily="system-ui,sans-serif" fontWeight="700">{tx.flow.professor.short}</text>
          <text x="613" y="62" fontSize="10.5" fill="#92400e" fontFamily="system-ui,sans-serif" fontWeight="600">{tx.flow.professor.title}</text>
          <text x="613" y="75" fontSize="9" fill="#a16207" fontFamily="system-ui,sans-serif">{tx.flow.professor.action}</text>

          <circle cx="590" cy="162" r="16" fill="#EEF2FF" stroke="#6366f1" strokeWidth="1.5" />
          <text x="590" y="166" textAnchor="middle" fontSize="7.5" fill="#3730a3" fontFamily="system-ui,sans-serif" fontWeight="700">{tx.flow.student.short}</text>
          <text x="613" y="158" fontSize="10.5" fill="#3730a3" fontFamily="system-ui,sans-serif" fontWeight="600">{tx.flow.student.title}</text>
          <text x="613" y="171" fontSize="9" fill="#4338ca" fontFamily="system-ui,sans-serif">{tx.flow.student.action}</text>

          <circle cx="590" cy="258" r="16" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
          <text x="590" y="262" textAnchor="middle" fontSize="7.5" fill="#1e40af" fontFamily="system-ui,sans-serif" fontWeight="700">{tx.flow.ai.short}</text>
          <text x="613" y="254" fontSize="10.5" fill="#1e40af" fontFamily="system-ui,sans-serif" fontWeight="600">{tx.flow.ai.title}</text>
          <text x="613" y="267" fontSize="9" fill="#1d4ed8" fontFamily="system-ui,sans-serif">{tx.flow.ai.action}</text>
        </svg>

        <p className={styles.quote}>{tx.quote}</p>

        <div className={styles.cols}>
          <div className={styles.col}>
            <p className={`${styles.colHead} ${styles.aiHead}`}>{tx.aiListTitle}</p>
            <ul>
              {tx.aiList.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className={styles.col}>
            <p className={`${styles.colHead} ${styles.profHead}`}>{tx.profListTitle}</p>
            <ul>
              {tx.profList.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const levelY = [46, 94, 142, 190, 238, 287];
const levelColors = ["#7f1d1d", "#78350f", "#14532d", "#14532d", "#1e3a8a", "#1e3a8a"];
