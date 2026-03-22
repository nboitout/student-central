"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./course.module.css";

/* ── Course registry (mirrors workspace/page.tsx) ──────── */
interface CourseRecord {
  id: string;
  title: string;
  author: string;
  source: string;            // blob filename in Azure
  status: "Not Started" | "In Progress" | "Completed";
  exercisesTotal: number;
  exercisesDone: number;
}

const COURSES: Record<string, CourseRecord> = {
  "1": { id: "1", title: "International Software Management", author: "Nicolas Boitout", source: "2025 – IMBS – 1 – Software Development Life Cycle.pdf", status: "Not Started", exercisesTotal: 20, exercisesDone: 0 },
  "2": { id: "2", title: "AGILE Project Management: Principles, Frameworks, and Practices", author: "Unknown", source: "2025 – IMBS – 2 – Agile Project Management.pdf", status: "In Progress", exercisesTotal: 20, exercisesDone: 12 },
  "3": { id: "3", title: "Digital Transformation and Change Management with AI and Analytics", author: "Marco Iansiti, Satya Nadella, Nicolas Boitout", source: "2025 – IMBS – 3 – Digital Transformation & Change.pdf", status: "Not Started", exercisesTotal: 20, exercisesDone: 0 },
  "4": { id: "4", title: "The Geek Way: Embracing a Radical Mindset for Extraordinary Business", author: "Andrew McAfee, Reid Hoffman", source: "2025 – IMBS – 4 – Culture Principles.pdf", status: "Not Started", exercisesTotal: 20, exercisesDone: 0 },
  "5": { id: "5", title: "Digital Transformation and the Impact of Software on the Modern Economy", author: "Nicolas Boitout", source: "2025 – IMBS – 5 – How to understand our digital economy.pdf", status: "Not Started", exercisesTotal: 19, exercisesDone: 0 },
  "6": { id: "6", title: "Introduction to Cloud Computing and Its Evolution", author: "Microsoft Educational Team", source: "2025 – IMBS – 5 – Introduction to Cloud Computing.pdf", status: "In Progress", exercisesTotal: 20, exercisesDone: 16 },
};

/* ── Blob URL construction ──────────────────────────────────
   Your coding agent stores PDFs in Azure Blob Storage.
   Set NEXT_PUBLIC_AZURE_BLOB_BASE_URL in your .env / Vercel
   environment variables to point to your container's base URL.
   
   Example:
     NEXT_PUBLIC_AZURE_BLOB_BASE_URL=
       https://scblob.blob.core.windows.net/courses

   The final URL will be:  {baseUrl}/{encoded-filename}
   Make sure the container allows public read (or use SAS tokens).
─────────────────────────────────────────────────────────── */
function getPdfUrl(source: string): string {
  const base = process.env.NEXT_PUBLIC_AZURE_BLOB_BASE_URL ?? "";
  if (!base) return "";
  return `${base}/${encodeURIComponent(source)}`;
}

/* ── Helpers ─────────────────────────────────────────────── */
const STATUS_LABELS: Record<string, string> = {
  "Not Started": "NOT STARTED",
  "In Progress": "IN PROGRESS",
  "Completed":   "COMPLETED",
};

function progressPercent(c: CourseRecord) {
  return Math.round((c.exercisesDone / c.exercisesTotal) * 100);
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
function CourseReaderContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const id       = params.get("id") ?? "1";
  const course   = COURSES[id] ?? COURSES["1"];
  const pdfUrl   = getPdfUrl(course.source);

  /* Sidebar collapse on mobile */
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* PDF load state */
  const [pdfStatus, setPdfStatus] = useState<"loading" | "ready" | "error">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* Zoom — injected as a CSS transform on the iframe wrapper */
  const [zoom, setZoom] = useState(100);
  const zoomIn  = useCallback(() => setZoom(z => Math.min(z + 10, 200)), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 10, 50)),  []);
  const zoomReset = useCallback(() => setZoom(100), []);

  const pct = progressPercent(course);

  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Workspace
          </button>
        </div>

        <div className={styles.headerCenter}>
          <span className={styles.headerEyebrow}>Course Materials</span>
          <span className={styles.headerTitle}>{course.title}</span>
        </div>

        <div className={styles.headerRight}>
          {/* Sidebar toggle (mobile) */}
          <button
            className={`${styles.iconBtn} ${sidebarOpen ? styles.iconBtnActive : ""}`}
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18"/><line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>

          {/* Download */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              download={course.source}
              className={styles.iconBtn}
              title="Download PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </a>
          )}
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* ── Sidebar ──────────────────────────────────────── */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>

          {/* Course identity */}
          <div className={styles.sidebarSection}>
            <div className={`${styles.statusChip} ${styles[`status${course.status.replace(" ", "")}`]}`}>
              {STATUS_LABELS[course.status]}
            </div>
            <h1 className={styles.sidebarTitle}>{course.title}</h1>
            <p className={styles.sidebarAuthor}>{course.author}</p>
          </div>

          {/* Progress */}
          <div className={styles.sidebarDivider} />
          <div className={styles.sidebarSection}>
            <div className={styles.progressHeader}>
              <span className={styles.sidebarLabel}>Progress</span>
              <span className={styles.progressPct}>{pct}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.progressStats}>
              <span className={styles.progressStat}>
                <strong>{course.exercisesDone}</strong> done
              </span>
              <span className={styles.progressStat}>
                <strong>{course.exercisesTotal - course.exercisesDone}</strong> remaining
              </span>
              <span className={styles.progressStat}>
                <strong>{course.exercisesTotal}</strong> total
              </span>
            </div>
          </div>

          {/* Source file */}
          <div className={styles.sidebarDivider} />
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>Source document</div>
            <div className={styles.sourceFile}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>{course.source}</span>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.sidebarDivider} />
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>Assessment</div>
            <button
              className={styles.mcqBtn}
              onClick={() => router.push(`/workspace/mcq?id=${course.id}`)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Start MCQ
            </button>
            <a
              href="https://app.stg.tutor.studentcentral.ai/login"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tutorBtn}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Open AI Tutor
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>

          {/* Zoom controls (also in toolbar but accessible from sidebar) */}
          <div className={styles.sidebarDivider} />
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>Zoom</div>
            <div className={styles.zoomRow}>
              <button className={styles.zoomBtn} onClick={zoomOut} title="Zoom out">−</button>
              <button className={styles.zoomValue} onClick={zoomReset}>{zoom}%</button>
              <button className={styles.zoomBtn} onClick={zoomIn} title="Zoom in">+</button>
            </div>
          </div>

        </aside>

        {/* ── PDF Viewer ────────────────────────────────────── */}
        <div className={styles.viewerWrap}>
          {!pdfUrl ? (
            /* No env var configured */
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="13" x2="12" y2="17"/>
                  <line x1="10" y1="15" x2="14" y2="15"/>
                </svg>
              </div>
              <div className={styles.emptyTitle}>Blob storage not configured</div>
              <div className={styles.emptyBody}>
                Set <code className={styles.envCode}>NEXT_PUBLIC_AZURE_BLOB_BASE_URL</code> in your environment variables to point to your Azure Blob Storage container.
              </div>
              <div className={styles.emptyFile}>{course.source}</div>
            </div>
          ) : (
            <>
              {/* Loading / error overlay */}
              {pdfStatus !== "ready" && (
                <div className={`${styles.pdfOverlay} ${pdfStatus === "error" ? styles.pdfError : ""}`}>
                  {pdfStatus === "loading" && (
                    <>
                      <div className={styles.spinner} />
                      <div className={styles.overlayText}>Loading document…</div>
                    </>
                  )}
                  {pdfStatus === "error" && (
                    <>
                      <div className={styles.errorIcon}>!</div>
                      <div className={styles.overlayText}>Could not load the PDF.</div>
                      <div className={styles.overlayHint}>Check that the file exists in Azure Blob Storage and CORS is enabled for this domain.</div>
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.openExternal}>
                        Open in new tab →
                      </a>
                    </>
                  )}
                </div>
              )}

              {/* iframe — browser-native PDF rendering */}
              <div
                className={styles.iframeWrap}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
              >
                <iframe
                  ref={iframeRef}
                  src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                  className={styles.iframe}
                  title={course.title}
                  onLoad={() => setPdfStatus("ready")}
                  onError={() => setPdfStatus("error")}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={
      <div className={styles.suspenseFallback}>
        <div className={styles.spinner} />
      </div>
    }>
      <CourseReaderContent />
    </Suspense>
  );
}
