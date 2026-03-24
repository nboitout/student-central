"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import { useLanguage } from "@/context/LanguageContext";

/* ── Types ─────────────────────────────────────────────── */
type Signal = "Strong" | "Fragile" | "Partial misconception" | "Low mastery";

interface Attempt {
  questionId:  string;
  questionText: string;
  signal:      Signal | null;
  durationSec: number;     /* seconds spent on this question */
  completedAt: string;     /* ISO date string */
}

interface DashboardData {
  courseId:     string;
  courseTitle:  string;
  author:       string;
  totalQ:       number;
  attempts:     Attempt[];
}

/* ── Stub data (replace with real API call) ─────────────── */
function makeStub(courseId: string, courseTitle: string): DashboardData {
  return {
    courseId,
    courseTitle,
    author: "Nicolas Boitout",
    totalQ: 20,
    attempts: [
      { questionId: "1", questionText: "What does the Oracle bond deal signal about AI capex financing?",                                     signal: "Strong",               durationSec: 192, completedAt: new Date().toISOString() },
      { questionId: "2", questionText: "What does the 5-year Oracle stock chart suggest about the last bull scenario?",                       signal: "Fragile",              durationSec: 340, completedAt: new Date().toISOString() },
      { questionId: "3", questionText: "Anthropic leads AI chat for businesses — what is measured on the vertical axis?",                     signal: "Strong",               durationSec: 150, completedAt: new Date().toISOString() },
      { questionId: "4", questionText: "In \"(Un autre) Moment Charnière?\", what event signals a turning point?",                            signal: "Partial misconception", durationSec: 288, completedAt: new Date(Date.now() - 86400000).toISOString() },
      { questionId: "5", questionText: "What specific narrative does Phase 2 introduce about competitive positioning?",                        signal: "Strong",               durationSec: 130, completedAt: new Date(Date.now() - 86400000).toISOString() },
      { questionId: "6", questionText: "What does Elon Musk's tweet on Jan 4, 2026 represent in market terms?",                               signal: "Strong",               durationSec: 125, completedAt: new Date(Date.now() - 518400000).toISOString() },
      { questionId: "7", questionText: "What is the primary claim of the \"2 narratives investors are pricing\" framework?",                   signal: "Fragile",              durationSec: 115, completedAt: new Date(Date.now() - 518400000).toISOString() },
    ],
  };
}

/* ── Helpers ────────────────────────────────────────────── */
const SIGNAL_COLORS: Record<Signal, string> = {
  "Strong":               "#3B6D11",
  "Fragile":              "#BA7517",
  "Partial misconception": "#D85A30",
  "Low mastery":          "#A32D2D",
};
const SIGNAL_BG: Record<Signal, string> = {
  "Strong":               "#EAF3DE",
  "Fragile":              "#FAEEDA",
  "Partial misconception": "#FAECE7",
  "Low mastery":          "#FCEBEB",
};

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} min ${s.toString().padStart(2, "0")} s` : `${s} s`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtDateSub(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function groupByDay(attempts: Attempt[]): { key: string; label: string; sub: string; items: Attempt[] }[] {
  const map = new Map<string, Attempt[]>();
  attempts.forEach(a => {
    const key = new Date(a.completedAt).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  });
  return Array.from(map.entries()).map(([key, items]) => ({
    key,
    label: fmtDate(items[0].completedAt),
    sub:   fmtDateSub(items[0].completedAt),
    items,
  }));
}

/* ── Heatmap: build a 5-week grid for current month ─────── */
function buildHeatmap(attempts: Attempt[]): number[] {
  const now = new Date();
  const year = now.getFullYear(); const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const counts = new Array(daysInMonth).fill(0);
  attempts.forEach(a => {
    const d = new Date(a.completedAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      counts[d.getDate() - 1]++;
    }
  });
  return counts;
}

/* ── Dashboard component ────────────────────────────────── */
function DashboardContent() {
  const params      = useSearchParams();
  const router      = useRouter();
  const courseId    = params.get("id") ?? "";
  const courseTitle = decodeURIComponent(params.get("title") ?? "Course");
  const pdfUrl      = params.get("pdf") ?? "";

  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    /* TODO: replace stub with real API call:
       GET /api/courses/{courseId}/attempts?userId=nicolas  */
    setData(makeStub(courseId, courseTitle));
  }, [courseId, courseTitle]);

  if (!data) return <div className={styles.loading}>Loading…</div>;

  const totalSec    = data.attempts.reduce((s, a) => s + a.durationSec, 0);
  const attempted   = data.attempts.length;
  const pct         = Math.round((attempted / data.totalQ) * 100);
  const maxDur      = Math.max(...data.attempts.map(a => a.durationSec), 1);

  const signalCounts: Record<Signal, number> = {
    "Strong": 0, "Fragile": 0, "Partial misconception": 0, "Low mastery": 0,
  };
  data.attempts.forEach(a => { if (a.signal) signalCounts[a.signal]++; });
  const strong = signalCounts["Strong"];
  const fragile = signalCounts["Fragile"] + signalCounts["Partial misconception"] + signalCounts["Low mastery"];

  const sessions  = groupByDay(data.attempts);
  const heatmap   = buildHeatmap(data.attempts);
  const heatMax   = Math.max(...heatmap, 1);

  const heatColor = (n: number) => {
    if (n === 0) return "var(--color-border-tertiary)";
    const t = n / heatMax;
    if (t < 0.33) return "#B5D4F4";
    if (t < 0.66) return "#378ADD";
    return "#0C447C";
  };

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const offset = (firstDayOfMonth + 6) % 7; /* Monday-first */

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Course dashboard</div>
          <h1 className={styles.courseName}>{data.courseTitle}</h1>
          <div className={styles.courseMeta}>
            {data.author} · {data.totalQ} questions
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.btnBack} onClick={() => router.back()}>← PDF reader</button>
          <button
            className={styles.btnMcq}
            onClick={() => router.push(`/workspace/mcq?id=${courseId}&title=${encodeURIComponent(courseTitle)}&pdf=${encodeURIComponent(pdfUrl)}`)}
          >
            Start tutoring →
          </button>
        </div>
      </header>

      {/* ── KPI strip ── */}
      <div className={styles.kpiRow}>
        {[
          { val: attempted,          label: "Attempted",        cls: styles.valBlue },
          { val: `${pct}%`,          label: "Progress",         cls: "" },
          { val: strong,             label: "Strong reasoning",  cls: styles.valGreen },
          { val: fragile,            label: "Fragile / partial", cls: fragile > 0 ? styles.valAmber : "" },
          { val: fmtDuration(totalSec), label: "Total time spent", cls: styles.valMuted },
        ].map((k, i) => (
          <div key={i} className={styles.kpi}>
            <div className={`${styles.kpiVal} ${k.cls}`}>{k.val}</div>
            <div className={styles.kpiLbl}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Two-column middle ── */}
      <div className={styles.twoCol}>
        {/* Reasoning signals */}
        <div className={styles.card}>
          <div className={styles.cardLabel}>Reasoning signals</div>
          <div className={styles.signalList}>
            {(["Strong", "Fragile", "Partial misconception", "Low mastery"] as Signal[]).map(sig => {
              const n   = signalCounts[sig];
              const pct = attempted > 0 ? Math.round((n / attempted) * 100) : 0;
              return (
                <div key={sig} className={styles.sigRow}>
                  <div className={styles.sigDot} style={{ background: SIGNAL_COLORS[sig] }} />
                  <div className={styles.sigName}>{sig}</div>
                  <div className={styles.sigTrack}>
                    <div className={styles.sigFill} style={{ width: `${pct}%`, background: SIGNAL_COLORS[sig] }} />
                  </div>
                  <div className={styles.sigN}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time per question */}
        <div className={styles.card}>
          <div className={styles.cardLabel}>Time per question</div>
          <div className={styles.timeList}>
            {data.attempts.map((a, i) => (
              <div key={a.questionId} className={styles.tItem}>
                <div className={styles.tNum}>Q{i + 1}</div>
                <div className={styles.tBarWrap}>
                  <div className={styles.tBar} style={{ width: `${Math.round((a.durationSec / maxDur) * 100)}%` }} />
                </div>
                <div className={styles.tDuration}>{fmtDuration(a.durationSec)}</div>
                {a.signal && (
                  <div
                    className={styles.tBadge}
                    style={{ background: SIGNAL_BG[a.signal], color: SIGNAL_COLORS[a.signal] }}
                  >
                    {a.signal === "Partial misconception" ? "Partial" : a.signal}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sessions by day ── */}
      <div className={styles.fullCard}>
        <div className={styles.cardLabel}>Sessions by day</div>
        <div className={styles.sessionList}>
          {sessions.map(s => {
            const dayTotal = s.items.reduce((acc, a) => acc + a.durationSec, 0);
            return (
              <div key={s.key} className={styles.sessionDay}>
                <div className={styles.sDate}>
                  <div className={styles.sDateMain}>{s.label}</div>
                  <div className={styles.sDateSub}>{s.sub} · {fmtDuration(dayTotal)}</div>
                </div>
                <div className={styles.sQuestions}>
                  {s.items.map(a => (
                    <div key={a.questionId} className={styles.sQ}>
                      {a.signal && (
                        <span
                          className={styles.sBadge}
                          style={{ background: SIGNAL_BG[a.signal], color: SIGNAL_COLORS[a.signal] }}
                        >
                          {a.signal === "Partial misconception" ? "Partial" : a.signal}
                        </span>
                      )}
                      <span className={styles.sQText}>{a.questionText}</span>
                      <span className={styles.sQTime}>{fmtDuration(a.durationSec)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Activity heatmap ── */}
      <div className={styles.fullCard}>
        <div className={styles.cardLabel}>
          Activity — {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </div>
        <div className={styles.calDayLabels}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <div key={d} className={styles.calLabel}>{d}</div>
          ))}
        </div>
        <div className={styles.calGrid}>
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} className={styles.calEmpty} />
          ))}
          {heatmap.map((n, i) => (
            <div
              key={i}
              className={styles.calDay}
              style={{ background: heatColor(n) }}
              title={n > 0 ? `${i + 1}: ${n} question${n > 1 ? "s" : ""}` : `${i + 1}: no activity`}
            />
          ))}
        </div>
        <div className={styles.legendRow}>
          <span className={styles.legendLabel}>Less</span>
          <div className={styles.legendBoxes}>
            {["var(--color-border-tertiary)", "#B5D4F4", "#378ADD", "#0C447C"].map((c, i) => (
              <div key={i} className={styles.lb} style={{ background: c }} />
            ))}
          </div>
          <span className={styles.legendLabel}>More</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--surface-low)" }} />}>
      <DashboardContent />
    </Suspense>
  );
}
