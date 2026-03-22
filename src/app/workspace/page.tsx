"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./workspace.module.css";

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

/* ── Demo data ──────────────────────────────────────────── */
const DEMO: Course[] = [
  { id: "1", title: "International Software Management", author: "Nicolas Boitout", source: "2025 – IMBS – 1 – Software Development Life Cycle.pdf", status: "Not Started", exercisesTotal: 20, exercisesDone: 0 },
  { id: "2", title: "AGILE Project Management: Principles, Frameworks, and Practices", author: "Unknown", source: "2025 – IMBS – 2 – Agile Project Management.pdf", status: "In Progress", exercisesTotal: 20, exercisesDone: 12 },
  { id: "3", title: "Digital Transformation and Change Management with AI and Analytics", author: "Marco Iansiti, Satya Nadella, Nicolas Boitout", source: "2025 – IMBS – 3 – Digital Transformation & Change", status: "Not Started", exercisesTotal: 20, exercisesDone: 0 },
  { id: "4", title: "The Geek Way: Embracing a Radical Mindset for Extraordinary Business", author: "Andrew McAfee, Reid Hoffman", source: "2025 – IMBS – 4 – Culture Principles", status: "Not Started", exercisesTotal: 20, exercisesDone: 0 },
  { id: "5", title: "Digital Transformation and the Impact of Software on the Modern Economy", author: "Nicolas Boitout", source: "2025 – IMBS – 5 – How to understand our digital economy", status: "Not Started", exercisesTotal: 19, exercisesDone: 0 },
  { id: "6", title: "Introduction to Cloud Computing and Its Evolution", author: "Microsoft Educational Team", source: "2025 – IMBS – 5 – Introduction to Cloud Computing.pdf", status: "In Progress", exercisesTotal: 20, exercisesDone: 16 },
];

/* ════════════════════════════════════════════════════════
   CREATE COURSE MODAL
════════════════════════════════════════════════════════ */
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Course) => void }) {
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
    onCreate({ id: Date.now().toString(), title: title.trim(), author: author.trim() || "Unknown", source: fileName || driveUrl || "No file attached", status: "Not Started", exercisesTotal: 20, exercisesDone: 0 });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalEyebrow}>New Course</div>
            <h2 className={styles.modalTitle}>Create a course card</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Course title</label>
            <input className={styles.fieldInput} type="text" placeholder="e.g. Introduction to Machine Learning" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Author(s)</label>
            <input className={styles.fieldInput} type="text" placeholder="e.g. Nicolas Boitout" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Source document</label>
            <div className={styles.methodToggle}>
              <button className={`${styles.methodBtn} ${uploadMethod === "local" ? styles.methodActive : ""}`} onClick={() => setUploadMethod("local")}>Upload PDF</button>
              <button className={`${styles.methodBtn} ${uploadMethod === "drive" ? styles.methodActive : ""}`} onClick={() => setUploadMethod("drive")}>Google Drive link</button>
            </div>
          </div>
          {uploadMethod === "local" && (
            <div className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""} ${fileName ? styles.hasFile : ""}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {fileName ? (<><div className={styles.dropIcon}>✓</div><div className={styles.dropFileName}>{fileName}</div><div className={styles.dropHint}>Click to change file</div></>) : (<><div className={styles.dropIcon}>↑</div><div className={styles.dropPrimary}>Drop your PDF here</div><div className={styles.dropHint}>or click to browse</div></>)}
            </div>
          )}
          {uploadMethod === "drive" && (
            <div className={styles.fieldGroup}>
              <input className={styles.fieldInput} type="url" placeholder="https://drive.google.com/file/d/..." value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} />
              <p className={styles.fieldHint}>Paste a public Google Drive link. Make sure sharing is set to &ldquo;Anyone with the link can view.&rdquo;</p>
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={`${styles.createBtn} ${!title.trim() ? styles.createDisabled : ""}`} onClick={handleSubmit} disabled={!title.trim()}>Create course</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   COURSE DETAILS MODAL
════════════════════════════════════════════════════════ */
function CourseDetailsModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const router = useRouter();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalEyebrow}>Course Details</div>
            <h2 className={styles.modalTitle}>{course.title}</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.detailsMeta}>
            <div className={styles.detailsRow}>
              <span className={styles.detailsKey}>Author</span>
              <span className={styles.detailsVal}>{course.author}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsKey}>Source</span>
              <span className={styles.detailsVal}>{course.source}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsKey}>Status</span>
              <span className={`${styles.detailsVal} ${styles[`status${course.status.replace(" ", "")}`]}`}>{course.status}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsKey}>Progress</span>
              <span className={styles.detailsVal}>{course.exercisesDone} / {course.exercisesTotal} exercises</span>
            </div>
          </div>

          <div className={styles.detailsProgressTrack}>
            <div className={styles.detailsProgressFill} style={{ width: `${Math.round((course.exercisesDone / course.exercisesTotal) * 100)}%` }} />
          </div>

          <div className={styles.actionCards}>
            <a
              href="https://app.stg.tutor.studentcentral.ai/login"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionCard}
            >
              <div className={styles.actionCardIcon}>→</div>
              <div className={styles.actionCardTitle}>Access Course</div>
              <div className={styles.actionCardDesc}>Open the full course materials and AI tutor in Student Central.</div>
            </a>

            <button
              className={`${styles.actionCard} ${styles.actionCardPrimary}`}
              onClick={() => { onClose(); router.push(`/workspace/mcq?id=${course.id}`); }}
            >
              <div className={styles.actionCardIcon}>◎</div>
              <div className={styles.actionCardTitle}>Start MCQ</div>
              <div className={styles.actionCardDesc}>Test your understanding with a multiple-choice question on this topic.</div>
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
/* Card accents now handled by CSS nth-child ::before pseudo-element */

function CourseCard({ course, onDelete, onDetails, index }: { course: Course; onDelete: (id: string) => void; onDetails: (c: Course) => void; index: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = Math.round((course.exercisesDone / course.exercisesTotal) * 100);
  const initials = course.title.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const sourceCount = course.source.split(",").length;
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className={styles.card} onClick={() => onDetails(course)}>
      {/* Top row: ghost initials + menu */}
      <div className={styles.cardBand}>
        <div className={styles.cardInitials}>{initials}</div>
        <div className={styles.cardMenu} onClick={(e) => e.stopPropagation()}>
          <button className={styles.menuTrigger} onClick={() => setMenuOpen(!menuOpen)}>⋯</button>
          {menuOpen && (
            <div className={styles.menuDropdown}>
              <button className={styles.menuItem} onClick={() => { onDetails(course); setMenuOpen(false); }}>View details</button>
              <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { onDelete(course.id); setMenuOpen(false); }}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Title + meta */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{course.title}</h3>
        <div className={styles.cardMeta}>
          <div className={`${styles.cardMetaLine} ${styles.cardAuthor}`}>{course.author}</div>
          <div className={styles.cardMetaLine}>{dateStr} · {sourceCount} source{sourceCount !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Progress row: track + percentage always visible */}
      <div className={styles.cardStatus}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={`${styles.progressPct} ${progress === 0 ? styles.progressPctZero : ""}`}>
          {progress}%
        </div>
      </div>

      {/* Footer: status + exercises + details link */}
      <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
        <div className={styles.cardFooterLeft}>
          <div className={`${styles.statusBadge} ${styles[`status${course.status.replace(" ", "")}`]}`}>
            {course.status}
          </div>
          <div className={styles.exerciseBadge}>{course.exercisesDone} / {course.exercisesTotal}</div>
        </div>
        <button className={styles.courseDetailsBtn} onClick={() => onDetails(course)}>
          Details →
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════ */
type ModalView = "none" | "create" | "details";
type SortKey   = "recent" | "title";
type ViewMode  = "grid" | "list";

export default function WorkspacePage() {
  const [courses, setCourses]           = useState<Course[]>(DEMO);
  const [modal, setModal]               = useState<ModalView>("none");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [search, setSearch]             = useState("");
  const [viewMode, setViewMode]         = useState<ViewMode>("grid");
  const [sortKey, setSortKey]           = useState<SortKey>("recent");
  const [sortOpen, setSortOpen]         = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);

  /* Opening details auto-advances status Not Started → In Progress */
  const openDetails = (course: Course) => {
    if (course.status === "Not Started") {
      setCourses(prev => prev.map(c =>
        c.id === course.id ? { ...c, status: "In Progress" } : c
      ));
      setActiveCourse({ ...course, status: "In Progress" });
    } else {
      setActiveCourse(course);
    }
    setModal("details");
  };

  const closeModal = () => { setModal("none"); setActiveCourse(null); };
  const deleteCourse = (id: string) => setCourses(prev => prev.filter(c => c.id !== id));

  /* Filter + sort */
  const filtered = courses
    .filter(c =>
      search === "" ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.author.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortKey === "title"
        ? a.title.localeCompare(b.title)
        : parseInt(b.id) - parseInt(a.id)
    );

  const SORT_LABELS: Record<SortKey, string> = { recent: "Most recent", title: "Title" };

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topBarBrand}>
            <div className={styles.brandDot} />
            <span className={styles.brandName}>Student Central</span>
            <span className={styles.brandTag}>AI Tutor</span>
          </div>
          <div className={styles.topBarActions}>
            <span className={styles.userGreet}>Hello, Nicolas</span>
            <a href="/" className={styles.backLink}>← Back to site</a>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainInner}>

          {/* Page header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>My Workspace</h1>
            <button className={styles.createNewBtn} onClick={() => setModal("create")}>
              <span className={styles.createPlus}>+</span>Create New
            </button>
          </div>

          {/* Stats ribbon */}
          <div className={styles.statsRibbon}>
            <div className={styles.stat}><div className={styles.statValue}>{courses.length}</div><div className={styles.statLabel}>Courses</div></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><div className={styles.statValue}>{courses.filter(c => c.status === "In Progress").length}</div><div className={styles.statLabel}>In Progress</div></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><div className={styles.statValue}>{courses.reduce((a, c) => a + c.exercisesDone, 0)}</div><div className={styles.statLabel}>Exercises completed</div></div>
          </div>

          {/* ── Toolbar ── */}
          <div className={styles.toolbar}>
            {/* Search */}
            <div className={styles.toolbarLeft}>
              <div className={`${styles.searchWrap} ${searchOpen ? styles.searchOpen : ""}`}>
                <button
                  className={styles.toolBtn}
                  onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearch(""); }}
                  title="Search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </button>
                {searchOpen && (
                  <input
                    className={styles.searchInput}
                    autoFocus
                    placeholder="Search courses…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* View toggle + sort */}
            <div className={styles.toolbarRight}>
              {/* View toggle pill */}
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                  </svg>
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`}
                  onClick={() => setViewMode("list")}
                  title="List view"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Sort dropdown */}
              <div className={styles.sortWrap}>
                <button className={styles.sortBtn} onClick={() => setSortOpen(!sortOpen)}>
                  {SORT_LABELS[sortKey]}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {sortOpen && (
                  <div className={styles.sortDropdown}>
                    {(["recent","title"] as SortKey[]).map(k => (
                      <button
                        key={k}
                        className={`${styles.sortItem} ${sortKey === k ? styles.sortItemActive : ""}`}
                        onClick={() => { setSortKey(k); setSortOpen(false); }}
                      >
                        {SORT_LABELS[k]}
                      </button>
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
              <div className={styles.emptyTitle}>{search ? "No results found" : "No courses yet"}</div>
              <div className={styles.emptyBody}>{search ? `No courses match "${search}".` : "Create your first course card to get started."}</div>
              {!search && <button className={styles.createNewBtn} onClick={() => setModal("create")}><span className={styles.createPlus}>+</span>Create New</button>}
            </div>
          ) : viewMode === "grid" ? (
            <div className={styles.grid}>
              {filtered.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} onDelete={deleteCourse} onDetails={openDetails} />
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
                    <div className={styles.listMeta}>{c.author} · {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
                  </div>
                  <div className={styles.listRight}>
                    <div className={`${styles.statusBadge} ${styles[`status${c.status.replace(" ","")}`]}`}>{c.status}</div>
                    <div className={styles.exerciseBadge}>Exercises: {c.exercisesDone}/{c.exercisesTotal}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {modal === "create"  && <CreateModal onClose={closeModal} onCreate={(c) => setCourses(prev => [c, ...prev])} />}
      {modal === "details" && activeCourse && <CourseDetailsModal course={activeCourse} onClose={closeModal} />}
    </div>
  );
}
