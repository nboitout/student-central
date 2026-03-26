"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
  const params = useSearchParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const ui = getT(lang).course;
  const ws = getT(lang).workspace;

  const courseId = params.get("id") ?? "";

  const [course, setCourse] = useState<Course | null>(null);
  const [sasUrl, setSasUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pdfStatus, setPdfStatus] = useState<"loading" | "ready" | "error">("loading");

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!courseId) {
      setError(ui.courseNotFound);
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/courses/${courseId}?userId=nicolas`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`${ui.courseNotFound} (${res.status})`);
        }
        return res.json();
      })
      .then((data: Course) => {
        setCourse(data);
        setLoading(false);

        if (data.pdfUrl) {
          setPdfLoading(true);
          setPdfStatus("loading");

          fetch(`${API_URL}/api/courses/${courseId}/pdf-url?userId=nicolas`)
            .then((r) => r.json())
            .then(({ sasUrl }) => {
              setSasUrl(sasUrl);
            })
            .catch(() => {
              setSasUrl(null);
              setPdfStatus("error");
            })
            .finally(() => setPdfLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [courseId, ui.courseNotFound]);

  const pct = course
    ? Math.round((course.exercisesDone / course.exercisesTotal) * 100)
    : 0;

  const statusLabel: Record<string, string> = {
    "Not Started": ws.statusNotStarted,
    "In Progress": ws.statusInProgress,
    Completed: ws.statusCompleted,
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingWrap}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            {ui.backBtn}
          </button>
        </div>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className={styles.page}>
        <div className={styles.errorWrap}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            {ui.backBtn}
          </button>
          <h2>{ui.courseNotFound}</h2>
          {error && <p>{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          {ui.backBtn}
        </button>

        <div className={styles.headerTitle}>
          <span className={styles.eyebrow}>{ui.eyebrow}</span>
          <h1>{course.title}</h1>
        </div>

        <button
          className={styles.sidebarToggle}
          onClick={() => setSidebarOpen((o) => !o)}
          title={ui.sidebarToggle}
        >
          ☰
        </button>
      </header>

      <div className={styles.body}>
        <aside
          className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
        >
          <span className={styles.statusBadge}>
            {statusLabel[course.status] ?? course.status}
          </span>

          <h2 className={styles.courseTitle}># {course.title}</h2>
          <p className={styles.author}>{course.author}</p>

          <div className={styles.dashboardCard}>
            <div className={styles.dashboardMetric}>
              <strong>{course.exercisesDone}</strong>
              <span>{ui.doneLabel}</span>
            </div>

            <div className={styles.dashboardMetric}>
              <strong>{pct}%</strong>
              <span>{ui.progressLabel}</span>
            </div>

            <div className={styles.progressRow}>
              <span>
                {ui.progressLabel} {pct}%
              </span>
            </div>

            <button
              className={styles.dashboardBtn}
              onClick={() =>
                router.push(
                  `/workspace/course/dashboard?id=${course.id}&title=${encodeURIComponent(
                    course.title,
                  )}&pdf=${encodeURIComponent(course.pdfUrl || "")}`,
                )
              }
            >
              {ui.viewDashboard ?? "View full dashboard"}
            </button>
          </div>

          <div className={styles.metaBlock}>
            <span className={styles.metaLabel}>{ui.sourceLabel}</span>
            <p className={styles.metaValue}>
              {/^[0-9a-f-]{36}/.test(course.source)
                ? course.title + (course.source.endsWith(".pdf") ? ".pdf" : "")
                : course.source}
            </p>
          </div>

          <div className={styles.learningBlock}>
            <span className={styles.metaLabel}>{ui.assessmentLabel}</span>
          </div>
        </aside>

        <section className={styles.viewer}>
          {!course.pdfUrl && !pdfLoading && (
            <div className={styles.emptyState}>
              <h3>{ui.noPdfAttached}</h3>
              <p>{ui.noPdfBody}</p>
              <p>
                {/^[0-9a-f-]{36}/.test(course.source)
                  ? course.title + ".pdf"
                  : course.source}
              </p>
            </div>
          )}

          {course.pdfUrl && (pdfLoading || pdfStatus !== "ready") && (
            <div className={styles.overlay}>
              {(pdfLoading || pdfStatus === "loading") && (
                <>
                  <div className={styles.loader} />
                  <p>{ui.loadingDoc}</p>
                </>
              )}

              {!pdfLoading && pdfStatus === "error" && (
                <>
                  <div className={styles.errorIcon}>!</div>
                  <h3>{ui.errorTitle}</h3>
                  <p>{ui.pdfErrorBody}</p>
                  {sasUrl && (
                    <a
                      className={styles.externalLink}
                      href={sasUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ui.openExternal}
                    </a>
                  )}
                </>
              )}
            </div>
          )}

          {sasUrl && (
            <iframe
              ref={iframeRef}
              className={styles.iframe}
              src={sasUrl}
              title={course.title}
              onLoad={() => setPdfStatus("ready")}
              onError={() => setPdfStatus("error")}
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default function CoursePage() {
  return (
    <Suspense>
      <CourseReaderContent />
    </Suspense>
  );
}
