"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./workspace.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";

/* ── Types ─────────────────────────────────────────────── */
interface Course {
  id: string;
  title: string;
  author: string;
  source: string;
  status: "Not Started" | "In Progress" | "Completed";
  exercisesTotal: number;
  exercisesDone: number;
}

/* ── Demo data (course content stays in English) ─────── */
const DEMO: Course[] = [
  { id: "1", title: "International Software Management", author: "Nicolas Boitout", source: "2025 – IMBS – 1 – Software Development Life Cycle.pdf", status: "Not Started", exercisesTotal: 20, exercisesDone: 0 },
  { id: "2", title: "AGILE Project Management: Principles, Frameworks, and Practices", author: "Unknown", source: "2025 – IMBS – 2 – Agile Project Management.pdf", status: "In Progress", exercisesTotal: 20, exercisesDone: 12 },
  { id: "3", title: "Digital Transformation and Change Management with AI and Analytics", author: "Marco Iansiti, Satya Nadella, Nicolas Boitout", source: "2025 – IMBS – 3 – Digital Transformation & Change", status: "Not Started", exercisesTotal: 20, exercisesDone: 0 },
  { id: "4", title: "The Geek Way: Embracing a Radical Mindset for Extraordinary Business", author: "Andrew McAfee, Reid Hoffman", source: "2025 – IMBS – 4 – Culture Principles", status: "Not Started", exercisesTotal: 20, exercisesDone: 0 },
  { id: "5", title: "Digital Transformation and the Impact of Software on the Modern Economy", author: "Nicolas Boitout", source: "2025 – IMBS – 5 – How to understand our digital economy", status: "Not Started", exercisesTotal: 19, exercisesDone: 0 },
  { id: "6", title: "Introduction to Cloud Computing and Its Evolution", author: "Microsoft Educational Team", source: "2025 – IMBS – 5 – Introduction to Cloud Computing.pdf", status: "In Progress", exercisesTotal: 20, exercisesDone: 16 },
];

type SortKey = "recent" | "title";
type Modal = null | "create" | "details";

/* ════════════════════════════════════════════════════════
   CREATE COURSE MODAL
════════════════════════════════════════════════════════ */
function CreateModal({ onClose, onCreate, ui }: { onClose: () => void; onCreate: (c: Course) => void; ui: ReturnType<typeof getT>["workspace"] }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"local" | "drive">("local");
  const [driveUrl, setDriveUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => setFileName(file.name);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate({ id: Date.now().toString(), title: title.trim(), author: author.trim() || "Unknown", source: fileName || driveUrl || ui.noFileAttached, status: "Not Started", exercisesTotal: 20, exercisesDone: 0 });
    onClose();
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
          <button className={styles.cancelBtn} onClick={onClose}>{ui.cancel}</button>
          <button className={`${styles.createBtn} ${!title.trim() ? styles.createDisabled : ""}`} onClick={handleSubmit} disabled={!title.trim()}>{ui.createCourse}</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   COURSE DETAILS MODAL
════════════════════════════════════════════════════════ */
function CourseDetailsModal({ course, onClose, ui }: { course: Course; onClose: () => void; ui: ReturnType<typeof getT>["workspace"] }) {
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
            <button className={`${styles.actionCard} ${styles.actionCardPrimary}`} onClick={() => { onClose(); router.push(`/workspace/course?id=${course.id}`); }}>
              <div className={styles.actionCardIcon}>↗</div>
              <div className={styles.actionCardTitle}>{ui.accessCourse}</div>
              <div className={styles.actionCardDesc}>{ui.accessCourseDesc}</div>
            </button>
            <button className={styles.actionCard} onClick={() => { onClose(); router.push(`/workspace/mcq?id=${course.id}`); }}>
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
function CourseCard({ course, onDelete, onDetails, index, ui }: { course: Course; onDelete: (id: string) => void; onDetails: (c: Course) => void; index: number; ui: ReturnType<typeof getT>["workspace"] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = Math.round((course.exercisesDone / course.exercisesTotal) * 100);
  const initials = course.title.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const sourceCount = course.source.split(",").length;
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className={styles.card} onClick={() => onDetails(course)}>
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
        <div className={styles.cardFooterLeft}>
          <div className={`${styles.statusBadge} ${styles[`status${course.status.replace(" ", "")}`]}`}>
            {{ "Not Started": ui.statusNotStarted, "In Progress": ui.statusInProgress, "Completed": ui.statusCompleted }[course.status]}
          </div>
          <div className={styles.exerciseBadge}>{course.exercisesDone} {ui.exercisesOf} {course.exercisesTotal}</div>
        </div>
        <button className={styles.courseDetailsBtn} onClick={() => onDetails(course)}>{ui.detailsBtn}</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function WorkspacePage() {
  const { lang } = useLanguage();
  const ui = getT(lang).workspace;

  const [courses, setCourses] = useState<Course[]>(DEMO);
  const [modal, setModal] = useState<Modal>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const SORT_LABELS: Record<SortKey, string> = { recent: ui.sortRecent, title: ui.sortTitle };

  const filtered = courses
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.author.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortKey === "title" ? a.title.localeCompare(b.title) : 0);

  const closeModal = () => { setModal(null); setActiveCourse(null); };
  const openDetails = (c: Course) => { setActiveCourse(c); setModal("details"); };
  const deleteCourse = (id: string) => setCourses(prev => prev.filter(c => c.id !== id));

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

          {/* Grid or List */}
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◻</div>
              <div className={styles.emptyTitle}>{search ? ui.emptyTitleSearch : ui.emptyTitle}</div>
              <div className={styles.emptyBody}>{search ? `${ui.emptyBodySearch} "${search}".` : ui.emptyBody}</div>
              {!search && <button className={styles.createNewBtn} onClick={() => setModal("create")}><span className={styles.createPlus}>+</span>{ui.createNew}</button>}
            </div>
          ) : viewMode === "grid" ? (
            <div className={styles.grid}>
              {filtered.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} onDelete={deleteCourse} onDetails={openDetails} ui={ui} />
              ))}
            </div>
          ) : (
            <div className={styles.listView}>
              {filtered.map((c, i) => (
                <div key={c.id} className={styles.listRow} onClick={() => openDetails(c)}>
                  <div className={styles.listAccent} style={{ background: ["#dceeff","#e8f0fe","#d2e3fc","#f0e9ff","#e8f5e9"][i % 5] }}>
                    <span className={styles.listInitials}>{c.title.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}</span>
                  </div>
                  <div className={styles.listBody}>
                    <div className={styles.listTitle}>{c.title}</div>
                    <div className={styles.listMeta}>{c.author} · {new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div>
                  </div>
                  <div className={styles.listRight}>
                    <div className={`${styles.statusBadge} ${styles[`status${c.status.replace(" ","")}`]}`}>{{ "Not Started": ui.statusNotStarted, "In Progress": ui.statusInProgress, "Completed": ui.statusCompleted }[c.status]}</div>
                    <div className={styles.exerciseBadge}>{c.exercisesDone} {ui.exercisesOf} {c.exercisesTotal}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modal === "create"  && <CreateModal onClose={closeModal} onCreate={(c) => setCourses(prev => [c, ...prev])} ui={ui} />}
      {modal === "details" && activeCourse && <CourseDetailsModal course={activeCourse} onClose={closeModal} ui={ui} />}
    </div>
  );
}
