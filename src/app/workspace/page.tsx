"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./workspace.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadPdf,
  attachPdf,
  triggerMCQGeneration,
  type Course,
} from "@/lib/api";

/* ── Constants ──────────────────────────────────────────── */
/* Card accents handled by CSS nth-child ::before — no inline colours needed */

type SortKey = "recent" | "title";
type Modal   = null | "create" | "details";

/* ════════════════════════════════════════════════════════
   LEARNING PREFERENCES MODAL
════════════════════════════════════════════════════════ */
type LearningPrefs = {
  masteryLevel:   "familiarity" | "working" | "deep";
  priorKnowledge: "none" | "some" | "solid" | "adjacent";
  cadence:        "oneshot" | "days" | "weeks";
  domainLevel:    "1" | "2" | "3" | "4" | "5";  /* self-assessed 1–5 */
  focusNote:      string;
};

function LearningPrefsModal({
  courseTitle,
  onSave,
  onSkip,
}: {
  courseTitle: string;
  onSave: (prefs: LearningPrefs) => void;
  onSkip: () => void;
}) {
  const [mastery, setMastery] = useState<LearningPrefs["masteryLevel"]>("working");
  const [prior,   setPrior]   = useState<LearningPrefs["priorKnowledge"]>("none");
  const [cadence, setCadence] = useState<LearningPrefs["cadence"]>("days");
  const [note,    setNote]    = useState("");
  const [domain,  setDomain]  = useState<LearningPrefs["domainLevel"]>("2");

  return (
    <div className={styles.overlay} onClick={onSkip}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        {/* Progress bar — cosmetic, shows we are step 2/2 */}
        <div className={styles.prefsProgressBar}><div className={styles.prefsProgressFill} /></div>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalEyebrow}>Setting up your course</div>
            <h2 className={styles.modalTitle}>How do you want to learn this?</h2>
            <p className={styles.prefsSub}>
              Takes 30 seconds — helps the AI tutor adapt to you. Your MCQs are generating in the background.
            </p>
          </div>
          <button className={styles.modalClose} onClick={onSkip}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {/* Mastery level */}
          <div className={styles.prefsGroup}>
            <div className={styles.prefsLabel}>What level of mastery are you aiming for?</div>
            <div className={styles.chipRow}>
              {([
                { v: "familiarity", l: "Familiarity" },
                { v: "working",     l: "Working knowledge" },
                { v: "deep",        l: "Deep mastery" },
              ] as { v: LearningPrefs["masteryLevel"]; l: string }[]).map(({ v, l }) => (
                <button key={v} className={`${styles.prefChip} ${mastery === v ? styles.prefChipSel : ""}`} onClick={() => setMastery(v)}>{l}</button>
              ))}
            </div>
          </div>
          {/* Prior knowledge */}
          <div className={styles.prefsGroup}>
            <div className={styles.prefsLabel}>How familiar are you with this topic already?</div>
            <div className={styles.chipRow}>
              {([
                { v: "none",     l: "Complete beginner" },
                { v: "some",     l: "Some exposure" },
                { v: "solid",    l: "Solid foundations" },
                { v: "adjacent", l: "Expert in adjacent area" },
              ] as { v: LearningPrefs["priorKnowledge"]; l: string }[]).map(({ v, l }) => (
                <button key={v} className={`${styles.prefChip} ${prior === v ? styles.prefChipSel : ""}`} onClick={() => setPrior(v)}>{l}</button>
              ))}
            </div>
          </div>
          {/* Cadence */}
          <div className={styles.prefsGroup}>
            <div className={styles.prefsLabel}>How do you plan to study this?</div>
            <div className={styles.chipRow}>
              {([
                { v: "oneshot", l: "One focused session" },
                { v: "days",    l: "Several sessions over days" },
                { v: "weeks",   l: "Weekly over months" },
              ] as { v: LearningPrefs["cadence"]; l: string }[]).map(({ v, l }) => (
                <button key={v} className={`${styles.prefChip} ${cadence === v ? styles.prefChipSel : ""}`} onClick={() => setCadence(v)}>{l}</button>
              ))}
            </div>
          </div>
          {/* Self-assessed domain level */}
          <div className={styles.prefsGroup}>
            <div className={styles.prefsLabel}>How would you rate your current level in this specific domain? <span style={{ fontWeight: 400, opacity: 0.5 }}>(1 = beginner, 5 = expert)</span></div>
            <div className={styles.chipRow}>
              {(["1","2","3","4","5"] as LearningPrefs["domainLevel"][]).map(v => (
                <button key={v} className={`${styles.prefChip} ${domain === v ? styles.prefChipSel : ""}`} onClick={() => setDomain(v)}>
                  {v === "1" ? "1 — Beginner" : v === "2" ? "2 — Novice" : v === "3" ? "3 — Intermediate" : v === "4" ? "4 — Advanced" : "5 — Expert"}
                </button>
              ))}
            </div>
          </div>
          {/* Focus note */}
          <div className={styles.prefsGroup}>
            <div className={styles.prefsLabel}>Anything specific to focus on? <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional)</span></div>
            <textarea
              className={styles.prefsTextarea}
              placeholder={`e.g. I'm preparing for a technical interview on ${courseTitle}…`}
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onSkip}>Skip for now</button>
          <button className={styles.createBtn} onClick={() => onSave({ masteryLevel: mastery, priorKnowledge: prior, cadence, domainLevel: domain, focusNote: note.trim() })}>
            Save preferences →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CREATE COURSE MODAL
════════════════════════════════════════════════════════ */
function CreateModal({
  onClose,
  onCreate,
  ui,
  userId,
}: {
  onClose: () => void;
  onCreate: (c: Course, showPrefs?: boolean) => void;
  ui: ReturnType<typeof getT>["workspace"];
  userId: string;
}) {
  const [title, setTitle]               = useState("");
  const [author, setAuthor]             = useState("");
  const [fileName, setFileName]         = useState("");
  const [file, setFile]                 = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"local" | "drive">("local");
  const [driveUrl, setDriveUrl]         = useState("");
  const [dragOver, setDragOver]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => { setFile(f); setFileName(f.name); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true); setError(null);
    try {
      const course = await createCourse({
        title: title.trim(),
        author: author.trim() || "Unknown",
        source: fileName || driveUrl || ui.noFileAttached,
      });
      if (file) {
        const { url } = await uploadPdf(file);
        const updated = await attachPdf(course.id, url, userId);
        /* Fire-and-forget: kick off MCQ generation in the background */
        triggerMCQGeneration({ courseId: course.id, pdfUrl: url }).catch(() => {});
        onCreate(updated, /* showPrefs */ true);
      } else if (driveUrl.trim()) {
        /* Drive URL also triggers questionnaire — MCQ will be generated later */
        onCreate(course, /* showPrefs */ true);
      } else {
        onCreate(course, false);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalEyebrow}>{ui.modalEyebrow}</div>
            <h2 className={styles.modalTitle}>{ui.modalTitle}</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{ui.fieldTitle}</label>
            <input className={styles.fieldInput} type="text" placeholder={ui.fieldTitlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{ui.fieldAuthor}</label>
            <input className={styles.fieldInput} type="text" placeholder={ui.fieldAuthorPlaceholder} value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{ui.fieldSource}</label>
            <div className={styles.methodToggle}>
              <button className={`${styles.methodBtn} ${uploadMethod === "local" ? styles.methodActive : ""}`} onClick={() => setUploadMethod("local")}>{ui.uploadPDF}</button>
              <button className={`${styles.methodBtn} ${uploadMethod === "drive" ? styles.methodActive : ""}`} onClick={() => setUploadMethod("drive")}>{ui.driveLink}</button>
            </div>
          </div>
          {uploadMethod === "local" && (
            <div className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""} ${fileName ? styles.hasFile : ""}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {fileName
                ? (<><div className={styles.dropIcon}>✓</div><div className={styles.dropFileName}>{fileName}</div><div className={styles.dropHint}>{ui.dropChange}</div></>)
                : (<><div className={styles.dropIcon}>↑</div><div className={styles.dropPrimary}>{ui.dropPrimary}</div><div className={styles.dropHint}>{ui.dropHint}</div></>)}
            </div>
          )}
          {uploadMethod === "drive" && (
            <div className={styles.fieldGroup}>
              <input className={styles.fieldInput} type="url" placeholder="https://drive.google.com/file/d/..." value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} />
              <p className={styles.fieldHint}>{ui.driveHint}</p>
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>{ui.cancel}</button>
          <button className={`${styles.createBtn} ${(!title.trim() || loading) ? styles.createDisabled : ""}`} onClick={handleSubmit} disabled={!title.trim() || loading}>
            {loading ? "…" : ui.createCourse}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   COURSE DETAILS MODAL
════════════════════════════════════════════════════════ */
function CourseDetailsModal({
  course,
  onClose,
  ui,
}: {
  course: Course;
  onClose: () => void;
  ui: ReturnType<typeof getT>["workspace"];
}) {
  const router = useRouter();
  const statusKey = course.status.replace(" ", "") as "NotStarted" | "InProgress" | "Completed";
  const statusLabel: Record<string, string> = {
    NotStarted: ui.statusNotStarted,
    InProgress: ui.statusInProgress,
    Completed:  ui.statusCompleted,
  };
  const progress = Math.round((course.exercisesDone / course.exercisesTotal) * 100);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalEyebrow}>{ui.detailsEyebrow}</div>
            <h2 className={styles.modalTitle}>{course.title}</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailsMeta}>
            <div className={styles.detailsRow}><span className={styles.detailsKey}>{ui.keyAuthor}</span><span className={styles.detailsVal}>{course.author}</span></div>
            <div className={styles.detailsRow}><span className={styles.detailsKey}>{ui.keySource}</span><span className={styles.detailsVal}>{course.source}</span></div>
            <div className={styles.detailsRow}><span className={styles.detailsKey}>{ui.keyStatus}</span><span className={styles.detailsVal}>{statusLabel[statusKey]}</span></div>
            <div className={styles.detailsRow}><span className={styles.detailsKey}>{ui.keyProgress}</span><span className={styles.detailsVal}>{course.exercisesDone} / {course.exercisesTotal} — {progress}%</span></div>
          </div>
          <div className={styles.detailsProgressTrack}>
            <div className={styles.detailsProgressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.actionCards}>
            <button
              className={`${styles.actionCard} ${styles.actionCardPrimary}`}
              onClick={() => { onClose(); router.push(`/workspace/course?id=${course.id}`); }}
            >
              <div className={styles.actionCardIcon}>↗</div>
              <div className={styles.actionCardTitle}>{ui.accessCourse}</div>
              <div className={styles.actionCardDesc}>{ui.accessCourseDesc}</div>
            </button>
            <button
              className={styles.actionCard}
              onClick={() => { onClose(); router.push(`/workspace/mcq?id=${course.id}&title=${encodeURIComponent(course.title)}&pdf=${encodeURIComponent(course.pdfUrl || "")}`); }}
            >
              <div className={styles.actionCardIcon}>◎</div>
              <div className={styles.actionCardTitle}>{ui.startMCQ}</div>
              <div className={styles.actionCardDesc}>{ui.startMCQDesc}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   COURSE CARD
════════════════════════════════════════════════════════ */
function CourseCard({
  course,
  index,
  onDelete,
  onDetails,
  isProcessing,
  ui,
}: {
  course: Course;
  index: number;
  onDelete: (id: string) => void;
  onDetails: (c: Course) => void;
  isProcessing: boolean;
  ui: ReturnType<typeof getT>["workspace"];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const total    = course.exercisesTotal || 0;
  const done     = course.exercisesDone  || 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const initials   = course.title.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const sourceCount = course.source.split(",").length;
  const dateStr    = new Date(course.createdAt ?? Date.now()).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div
      className={`${styles.card} ${isProcessing ? styles.cardProcessing : ""}`}
      onClick={() => !isProcessing && onDetails(course)}
      style={{ cursor: isProcessing ? "default" : "pointer" }}
    >
      <div className={styles.cardBand}>
        <div className={styles.cardInitials}>{initials}</div>
        <div className={styles.cardMenu} onClick={(e) => e.stopPropagation()}>
          <button className={styles.menuTrigger} onClick={() => setMenuOpen(!menuOpen)}>⋯</button>
          {menuOpen && (
            <div className={styles.menuDropdown}>
              <button className={styles.menuItem} onClick={() => { onDetails(course); setMenuOpen(false); }}>{ui.viewDetails}</button>
              <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { onDelete(course.id); setMenuOpen(false); }}>{ui.deleteLabel}</button>
            </div>
          )}
        </div>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{course.title}</h3>
        <div className={styles.cardMeta}>
          <div className={`${styles.cardMetaLine} ${styles.cardAuthor}`}>{course.author}</div>
          <div className={styles.cardMetaLine}>{dateStr} · {sourceCount} {sourceCount !== 1 ? ui.sources : ui.source1}</div>
        </div>
      </div>
      <div className={styles.cardStatus}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={`${styles.progressPct} ${progress === 0 ? styles.progressPctZero : ""}`}>{progress}%</div>
      </div>
      <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
        {isProcessing ? (
          <div className={styles.processingFooter}>
            <div className={styles.processingBadge}>
              <span className={styles.processingDot} />
              Generating MCQs
            </div>
            <span className={styles.processingEta}>~2 min</span>
          </div>
        ) : (
          <>
            <div className={styles.cardFooterLeft}>
              <div className={`${styles.statusBadge} ${styles[`status${course.status.replace(" ", "")}`]}`}>
                {{ "Not Started": ui.statusNotStarted, "In Progress": ui.statusInProgress, "Completed": ui.statusCompleted }[course.status]}
              </div>
              <div className={styles.exerciseBadge}>{done} {ui.exercisesOf} {total}</div>
            </div>
            <button className={styles.courseDetailsBtn} onClick={() => onDetails(course)}>{ui.detailsBtn}</button>
          </>
        )}
      </div>
      {isProcessing && (
        <div className={styles.processingHint}>
          Questions are being generated from your PDF. Other courses are still accessible.
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function WorkspacePage() {
  const { lang }  = useLanguage();
  const ui        = getT(lang).workspace;
  const userId = "nicolas";

  const [courses, setCourses]         = useState<Course[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<Modal>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [prefsModal, setPrefsModal]   = useState<Course | null>(null); /* course awaiting prefs */
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set()); /* frontend-tracked generating IDs */
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [search, setSearch]           = useState("");
  const [searchOpen, setSearchOpen]   = useState(false);
  const [sortKey, setSortKey]         = useState<SortKey>("recent");
  const [sortOpen, setSortOpen]       = useState(false);
  const [viewMode, setViewMode]       = useState<"grid" | "list">("grid");

  /* Load from API on mount */
  useEffect(() => {
    listCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* Poll every 8 s while any course is generating */
  const hasProcessing = processingIds.size > 0;
  useEffect(() => {
    if (!hasProcessing) {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      return;
    }
    if (pollingRef.current) return; /* already polling */
    pollingRef.current = setInterval(() => {
      listCourses()
        .then(fresh => {
          setCourses(fresh);
          /* Clear processingIds for courses that now have questions ready */
          setProcessingIds(prev => {
            if (prev.size === 0) return prev;
            const next = new Set(prev);
            fresh.forEach(course => {
              if ((course.exercisesTotal ?? 0) > 0) next.delete(course.id);
            });
            return next;
          });
        })
        .catch(() => {});
    }, 8000);
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [hasProcessing]);

  const SORT_LABELS: Record<SortKey, string> = { recent: ui.sortRecent, title: ui.sortTitle };

  const filtered = courses
    .filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.author.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortKey === "title"
        ? a.title.localeCompare(b.title)
        : new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );

  const closeModal = () => { setModal(null); setActiveCourse(null); };

  /* Open details — auto-advance status Not Started → In Progress */
  const openDetails = async (c: Course) => {
    if (c.status === "Not Started") {
      try {
        const updated = await updateCourse(c.id, { status: "In Progress" });
        setCourses(prev => prev.map(x => x.id === c.id ? updated : x));
        setActiveCourse(updated);
      } catch {
        setActiveCourse(c);
      }
    } else {
      setActiveCourse(c);
    }
    setModal("details");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topBarBrand}>
            <div className={styles.brandDot} />
            <span className={styles.brandName}>Student Central</span>
            <span className={styles.brandTag}>AI Tutor</span>
          </div>
          <div className={styles.topBarActions}>
            <span className={styles.userGreet}>{ui.hello}</span>
            <a href="/" className={styles.backLink}>{ui.backToSite}</a>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{ui.pageTitle}</h1>
            <button className={styles.createNewBtn} onClick={() => setModal("create")}>
              <span className={styles.createPlus}>+</span>{ui.createNew}
            </button>
          </div>

          <div className={styles.statsRibbon}>
            <div className={styles.stat}><div className={styles.statValue}>{courses.length}</div><div className={styles.statLabel}>{ui.statCourses}</div></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><div className={styles.statValue}>{courses.filter(c => c.status === "In Progress").length}</div><div className={styles.statLabel}>{ui.statInProgress}</div></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><div className={styles.statValue}>{courses.reduce((a, c) => a + c.exercisesDone, 0)}</div><div className={styles.statLabel}>{ui.statExercises}</div></div>
          </div>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={`${styles.searchWrap} ${searchOpen ? styles.searchOpen : ""}`}>
                <button className={styles.toolBtn} onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearch(""); }} title={ui.sortTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
                {searchOpen && (
                  <input className={styles.searchInput} autoFocus placeholder={ui.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
                )}
              </div>
            </div>
            <div className={styles.toolbarRight}>
              <div className={styles.viewToggle}>
                <button className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`} onClick={() => setViewMode("grid")} title={ui.viewGrid}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
                <button className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`} onClick={() => setViewMode("list")} title={ui.viewList}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
              </div>
              <div className={styles.sortWrap}>
                <button className={styles.sortBtn} onClick={() => setSortOpen(!sortOpen)}>
                  {SORT_LABELS[sortKey]}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {sortOpen && (
                  <div className={styles.sortDropdown}>
                    {(["recent", "title"] as SortKey[]).map(k => (
                      <button key={k} className={`${styles.sortItem} ${sortKey === k ? styles.sortItemActive : ""}`} onClick={() => { setSortKey(k); setSortOpen(false); }}>{SORT_LABELS[k]}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingDot} /><div className={styles.loadingDot} /><div className={styles.loadingDot} />
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◻</div>
              <div className={styles.emptyTitle}>{search ? ui.emptyTitleSearch : ui.emptyTitle}</div>
              <div className={styles.emptyBody}>{search ? `${ui.emptyBodySearch} "${search}".` : ui.emptyBody}</div>
              {!search && <button className={styles.createNewBtn} onClick={() => setModal("create")}><span className={styles.createPlus}>+</span>{ui.createNew}</button>}
            </div>
          ) : viewMode === "grid" ? (
            <div className={styles.grid}>
              {filtered.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} onDelete={handleDelete} onDetails={openDetails} isProcessing={processingIds.has(c.id)} ui={ui} />
              ))}
            </div>
          ) : (
            <div className={styles.listView}>
              {filtered.map((c, i) => {
                const isProc = processingIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    className={`${styles.listRow} ${isProc ? styles.listRowProcessing : ""}`}
                    onClick={() => !isProc && openDetails(c)}
                    style={{ cursor: isProc ? "default" : "pointer" }}
                  >
                    <div className={styles.listAccent} style={{ background: ["#dceeff","#e8f0fe","#d2e3fc","#f0e9ff","#e8f5e9"][i % 5] }}>
                      <span className={styles.listInitials}>{c.title.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}</span>
                    </div>
                    <div className={styles.listBody}>
                      <div className={styles.listTitle}>{c.title}</div>
                      <div className={styles.listMeta}>{c.author} · {new Date(c.createdAt ?? Date.now()).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div>
                    </div>
                    <div className={styles.listRight}>
                      {isProc ? (
                        <div className={styles.processingBadge}>
                          <span className={styles.processingDot} />
                          Generating MCQs
                        </div>
                      ) : (
                        <>
                          <div className={`${styles.statusBadge} ${styles[`status${c.status.replace(" ","")}`]}`}>{{ "Not Started": ui.statusNotStarted, "In Progress": ui.statusInProgress, "Completed": ui.statusCompleted }[c.status]}</div>
                          <div className={styles.exerciseBadge}>{c.exercisesDone} {ui.exercisesOf} {c.exercisesTotal}</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {modal === "create"  && (
        <CreateModal
          onClose={closeModal}
          onCreate={(newCourse, showPrefs) => {
            setCourses(prev => [newCourse, ...prev]);
            /* Mark as processing in local state immediately */
            setProcessingIds(prev => new Set(Array.from(prev).concat(newCourse.id)));
            closeModal();
            if (showPrefs) setPrefsModal(newCourse);
          }}
          ui={ui}
          userId={userId}
        />
      )}
      {modal === "details" && activeCourse && <CourseDetailsModal course={activeCourse} onClose={closeModal} ui={ui} />}
      {prefsModal && (
        <LearningPrefsModal
          courseTitle={prefsModal.title}
          onSave={(prefs) => {
            /* Store locally — backend will pick up on next course update */
            try {
              localStorage.setItem(
                `learningPrefs_${prefsModal.id}`,
                JSON.stringify(prefs)
              );
            } catch { /* localStorage unavailable */ }
            /* Fire-and-forget patch — non-blocking, modal closes immediately */
            updateCourse(prefsModal.id, { learningPrefs: prefs }).catch(() => {});
            setPrefsModal(null);
          }}
          onSkip={() => setPrefsModal(null)}
        />
      )}
    </div>
  );
}
