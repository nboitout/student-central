"use client";

import { useState, useEffect, Suspense } from "react";
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

function CoursePageContent() {
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
          fetch(`${API_URL}/api/courses/${courseId}/pdf-url?userId=nicolas`)
            .then(r => r.json())
            .then(({ sasUrl }) => setSasUrl(sasUrl))
            .catch(() => setSasUrl(null))
            .finally(() => setPdfLoading(false));
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Loading state */
  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}>← {ui.backBtn}</button>
          <div className={styles.headerCenter} />
          <div className={styles.headerRight} />
        </header>
        <div className={styles.loadingWrap}>
          <div className={styles.loadingDots}><span /><span /><span /></div>
          <div className={styles.loadingLabel}>{ui.loadingCourse}</div>
        </div>
      </div>
    );
  }

  /* Error state */
  if (error || !course) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}>← {ui.backBtn}</button>
          <div className={styles.headerCenter} />
          <div className={styles.headerRight} />
        </header>
        <div className={styles.errorWrap}>
          <div className={styles.errorTitle}>{ui.courseNotFound}</div>
          <div className={styles.errorBody}>{error}</div>
          <button className={styles.backBtn} onClick={() => router.push("/workspace")}>
            ← {ws.pageTitle}
          </button>
        </div>
      </div>
    );
  }

  const progress = Math.round((course.exercisesDone / course.exercisesTotal) * 100);
  const statusLabel: Record<string, string> = {
    "Not Started": ws.statusNotStarted,
    "In Progress":  ws.statusInProgress,
    "Completed":    ws.statusCompleted,
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {ui.backBtn}
        </button>
        <div className={styles.headerCenter}>
          <div className={styles.headerEyebrow}>{ui.eyebrow}</div>
          {/* Course title stays in English — course content language */}
          <div className={styles.headerTitle}>{course.title}</div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.mcqBtn}
            onClick={() => router.push(
              `/workspace/mcq?id=${course.id}&title=${encodeURIComponent(course.title)}&pdf=${encodeURIComponent(course.pdfUrl || "")}`
            )}
          >
            {ui.startMCQ}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Meta bar — labels translated, values stay in English */}
        <div className={styles.metaBar}>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>{ui.keyAuthor}</span>
            <span className={styles.metaVal}>{course.author}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>{ui.keyStatus}</span>
            <span className={`${styles.metaVal} ${styles[`status${course.status.replace(" ", "")}`]}`}>
              {statusLabel[course.status] ?? course.status}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>{ui.keyProgress}</span>
            <span className={styles.metaVal}>{course.exercisesDone} / {course.exercisesTotal} — {progress}%</span>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className={styles.pdfWrap}>
          {pdfLoading && (
            <div className={styles.pdfLoading}>
              <div className={styles.loadingDots}><span /><span /><span /></div>
              <div className={styles.loadingLabel}>{ui.loadingDoc}</div>
            </div>
          )}

          {!pdfLoading && sasUrl && (
            <iframe
              src={sasUrl}
              className={styles.pdfFrame}
              title={course.title}
            />
          )}

          {!pdfLoading && !sasUrl && course.pdfUrl && (
            <div className={styles.pdfError}>
              <div className={styles.pdfErrorIcon}>⚠</div>
              <div className={styles.pdfErrorTitle}>{ui.errorTitle}</div>
              <div className={styles.pdfErrorBody}>{ui.pdfErrorBody}</div>
            </div>
          )}

          {!pdfLoading && !course.pdfUrl && (
            <div className={styles.pdfEmpty}>
              <div className={styles.pdfEmptyIcon}>◻</div>
              <div className={styles.pdfEmptyTitle}>{ui.noPdfAttached}</div>
              <div className={styles.pdfEmptyBody}>{ui.noPdfBody}</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--surface-low)" }} />}>
      <CoursePageContent />
    </Suspense>
  );
}
