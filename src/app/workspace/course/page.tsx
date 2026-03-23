"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./course.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";

interface Course {
  id: string;
  title: string;
  author: string;
  source: string;
  pdfUrl?: string | null;
  status: string;
  exercisesTotal: number;
  exercisesDone: number;
}

function CourseReaderContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const { lang } = useLanguage();
  const ui       = getT(lang).course;
  const ws       = getT(lang).workspace;

  const courseId = params.get("id") ?? "";

  const [course,     setCourse]     = useState<Course | null>(null);
  const [sasUrl,     setSasUrl]     = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pdfStatus,   setPdfStatus]   = useState<"loading" | "ready" | "error">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [zoom, setZoom] = useState(100);
  const zoomIn    = useCallback(() => setZoom(z => Math.min(z + 10, 200)), []);
  const zoomOut   = useCallback(() => setZoom(z => Math.max(z - 10, 50)), []);
  const zoomReset = useCallback(() => setZoom(100), []);

  /* Fetch course + SAS URL from API */
  useEffect(() => {
    if (!courseId) { setError(ui.courseNotFound); setLoading(false); return; }

    fetch(`${API_URL}/api/courses/${courseId}?userId=nicolas`)
      .then(res => {
        if (!res.ok) throw new Error(`${ui.courseNotFound} (${res.status})`);
        return res.json();
      })
      .then((data: Course) => {
        setCourse(data);
        setLoading(false);
        if (data.pdfUrl) {
          setPdfLoading(true);
          setPdfStatus("loading");
          fetch(`${API_URL}/api/courses/${courseId}/pdf-url?userId=nicolas`)
            .then(r => r.json())
            .then(({ sasUrl }) => { setSasUrl(sasUrl); })
            .catch(() => { setSasUrl(null); setPdfStatus("error"); })
            .finally(() => setPdfLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = course ? Math.round((course.exercisesDone / course.exercisesTotal) * 100) : 0;

  const statusLabel: Record<string, string> = {
    "Not Started": ws.statusNotStarted,
    "In Progress":  ws.statusInProgress,
    "Completed":    ws.statusCompleted,
  };

  /* Loading state */
  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => router.back()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              {ui.backBtn}
            </button>
          </div>
          <div className={styles.headerCenter} />
          <div className={styles.headerRight} />
        </header>
        <div className={styles.suspenseFallback}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  /* Error / not found state */
  if (error || !course) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => router.back()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              {ui.backBtn}
            </button>
          </div>
          <div className={styles.headerCenter} />
          <div className={styles.headerRight} />
        </header>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/>
            </svg>
          </div>
          <div className={styles.emptyTitle}>{ui.courseNotFound}</div>
          <div className={styles.emptyBody}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            {ui.backBtn}
          </button>
        </div>
        <div className={styles.headerCenter}>
          <span className={styles.headerEyebrow}>{ui.eyebrow}</span>
          <span className={styles.headerTitle}>{course.title}</span>
        </div>
        <div className={styles.headerRight}>
          <button
            className={`${styles.iconBtn} ${sidebarOpen ? styles.iconBtnActive : ""}`}
            onClick={() => setSidebarOpen(o => !o)}
            title={ui.sidebarToggle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18"/><line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + viewer ── */}
      <div className={styles.body}>

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>

          <div className={styles.sidebarSection}>
            <div className={`${styles.statusChip} ${styles[`status${course.status.replace(" ", "")}`]}`}>
              {statusLabel[course.status] ?? course.status}
            </div>
            <h1 className={styles.sidebarTitle}>{course.title}</h1>
            <p className={styles.sidebarAuthor}>{course.author}</p>
          </div>

          <div className={styles.sidebarDivider} />
          <div className={styles.sidebarSection}>
            <div className={styles.progressHeader}>
              <span className={styles.sidebarLabel}>{ui.progressLabel}</span>
              <span className={styles.progressPct}>{pct}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.progressStats}>
              <span className={styles.progressStat}><strong>{course.exercisesDone}</strong> {ui.doneLabel}</span>
              <span className={styles.progressStat}><strong>{course.exercisesTotal - course.exercisesDone}</strong> {ui.remainingLabel}</span>
              <span className={styles.progressStat}><strong>{course.exercisesTotal}</strong> {ui.totalLabel}</span>
            </div>
          </div>

          <div className={styles.sidebarDivider} />
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>{ui.sourceLabel}</div>
            <div className={styles.sourceFile}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>{course.source}</span>
            </div>
          </div>

          <div className={styles.sidebarDivider} />
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>{ui.assessmentLabel}</div>
            <button
              className={styles.mcqBtn}
              onClick={() => router.push(`/workspace/mcq?id=${course.id}&title=${encodeURIComponent(course.title)}&pdf=${encodeURIComponent(course.pdfUrl || "")}`)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {ui.startMCQ}
            </button>
            <a href="https://app.stg.tutor.studentcentral.ai/login" target="_blank" rel="noopener noreferrer" className={styles.tutorBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {ui.openTutor}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>

          <div className={styles.sidebarDivider} />
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>{ui.zoomLabel}</div>
            <div className={styles.zoomRow}>
              <button className={styles.zoomBtn} onClick={zoomOut}>−</button>
              <button className={styles.zoomValue} onClick={zoomReset}>{zoom}%</button>
              <button className={styles.zoomBtn} onClick={zoomIn}>+</button>
            </div>
          </div>
        </aside>

        {/* PDF Viewer */}
        <div className={styles.viewerWrap}>

          {/* No PDF uploaded yet */}
          {!course.pdfUrl && !pdfLoading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/>
                </svg>
              </div>
              <div className={styles.emptyTitle}>{ui.noPdfAttached}</div>
              <div className={styles.emptyBody}>{ui.noPdfBody}</div>
              <div className={styles.emptyFile}>{course.source}</div>
            </div>
          )}

          {/* Loading / error overlay */}
          {course.pdfUrl && (pdfLoading || pdfStatus !== "ready") && (
            <div className={`${styles.pdfOverlay} ${pdfStatus === "error" ? styles.pdfError : ""}`}>
              {(pdfLoading || pdfStatus === "loading") && (
                <><div className={styles.spinner} /><div className={styles.overlayText}>{ui.loadingDoc}</div></>
              )}
              {!pdfLoading && pdfStatus === "error" && (
                <>
                  <div className={styles.errorIcon}>!</div>
                  <div className={styles.overlayText}>{ui.errorTitle}</div>
                  <div className={styles.overlayHint}>{ui.pdfErrorBody}</div>
                  {sasUrl && (
                    <a href={sasUrl} target="_blank" rel="noopener noreferrer" className={styles.openExternal}>{ui.openExternal}</a>
                  )}
                </>
              )}
            </div>
          )}

          {/* iframe */}
          {sasUrl && (
            <div
              className={styles.iframeWrap}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              <iframe
                ref={iframeRef}
                src={`${sasUrl}#toolbar=1&navpanes=0&view=FitH`}
                className={styles.iframe}
                title={course.title}
                onLoad={() => setPdfStatus("ready")}
                onError={() => setPdfStatus("error")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={<div className={styles.suspenseFallback}><div className={styles.spinner} /></div>}>
      <CourseReaderContent />
    </Suspense>
  );
}
