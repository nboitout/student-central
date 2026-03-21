"use client";

import { useState, useRef } from "react";
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

/* ── Initial demo data ──────────────────────────────────── */
const DEMO: Course[] = [
  {
    id: "1",
    title: "International Software Management",
    author: "Nicolas Boitout",
    source: "2025 – IMBS – 1 – Software Development Life Cycle.pdf",
    status: "Not Started",
    exercisesTotal: 20,
    exercisesDone: 0,
  },
  {
    id: "2",
    title: "AGILE Project Management: Principles, Frameworks, and Practices",
    author: "Unknown",
    source: "2025 – IMBS – 2 – Agile Project Management.pdf",
    status: "In Progress",
    exercisesTotal: 20,
    exercisesDone: 12,
  },
  {
    id: "3",
    title: "Digital Transformation and Change Management with AI and Analytics",
    author: "Marco Iansiti, Satya Nadella, Nicolas Boitout",
    source: "2025 – IMBS – 3 – Digital Transformation & Change",
    status: "Not Started",
    exercisesTotal: 20,
    exercisesDone: 0,
  },
  {
    id: "4",
    title: "The Geek Way: Embracing a Radical Mindset for Extraordinary Business",
    author: "Andrew McAfee, Reid Hoffman",
    source: "2025 – IMBS – 4 – Culture Principles",
    status: "Not Started",
    exercisesTotal: 20,
    exercisesDone: 0,
  },
  {
    id: "5",
    title: "Digital Transformation and the Impact of Software on the Modern Economy",
    author: "Nicolas Boitout",
    source: "2025 – IMBS – 5 – How to understand our digital economy",
    status: "Not Started",
    exercisesTotal: 19,
    exercisesDone: 0,
  },
  {
    id: "6",
    title: "Introduction to Cloud Computing and Its Evolution",
    author: "Microsoft Educational Team",
    source: "2025 – IMBS – 5 – Introduction to Cloud Computing.pdf",
    status: "In Progress",
    exercisesTotal: 20,
    exercisesDone: 16,
  },
];

/* ── Modal component ────────────────────────────────────── */
function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (course: Course) => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"local" | "drive">("local");
  const [driveUrl, setDriveUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const source = fileName || driveUrl || "No file attached";
    const newCourse: Course = {
      id: Date.now().toString(),
      title: title.trim(),
      author: author.trim() || "Unknown",
      source,
      status: "Not Started",
      exercisesTotal: 20,
      exercisesDone: 0,
    };
    onCreate(newCourse);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalEyebrow}>New Course</div>
            <h2 className={styles.modalTitle}>Create a course card</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Fields */}
        <div className={styles.modalBody}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Course title</label>
            <input
              className={styles.fieldInput}
              type="text"
              placeholder="e.g. Introduction to Machine Learning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Author(s)</label>
            <input
              className={styles.fieldInput}
              type="text"
              placeholder="e.g. Nicolas Boitout"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          {/* Upload method toggle */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Source document</label>
            <div className={styles.methodToggle}>
              <button
                className={`${styles.methodBtn} ${uploadMethod === "local" ? styles.methodActive : ""}`}
                onClick={() => setUploadMethod("local")}
              >
                Upload PDF
              </button>
              <button
                className={`${styles.methodBtn} ${uploadMethod === "drive" ? styles.methodActive : ""}`}
                onClick={() => setUploadMethod("drive")}
              >
                Google Drive link
              </button>
            </div>
          </div>

          {/* Local upload */}
          {uploadMethod === "local" && (
            <div
              className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""} ${fileName ? styles.hasFile : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              {fileName ? (
                <>
                  <div className={styles.dropIcon}>✓</div>
                  <div className={styles.dropFileName}>{fileName}</div>
                  <div className={styles.dropHint}>Click to change file</div>
                </>
              ) : (
                <>
                  <div className={styles.dropIcon}>↑</div>
                  <div className={styles.dropPrimary}>Drop your PDF here</div>
                  <div className={styles.dropHint}>or click to browse</div>
                </>
              )}
            </div>
          )}

          {/* Google Drive */}
          {uploadMethod === "drive" && (
            <div className={styles.fieldGroup}>
              <input
                className={styles.fieldInput}
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
              />
              <p className={styles.fieldHint}>
                Paste a public Google Drive link to your PDF. Make sure sharing is set to &ldquo;Anyone with the link can view.&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={`${styles.createBtn} ${!title.trim() ? styles.createDisabled : ""}`}
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            Create course
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Course Card ────────────────────────────────────────── */
function CourseCard({ course, onDelete }: { course: Course; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = Math.round((course.exercisesDone / course.exercisesTotal) * 100);

  return (
    <div className={styles.card}>
      {/* Card top */}
      <div className={styles.cardTop}>
        <div className={styles.cardMeta}>
          <h3 className={styles.cardTitle}>{course.title}</h3>
          <div className={styles.cardAuthor}>{course.author}</div>
          <div className={styles.cardSource}>{course.source}</div>
        </div>
        <div className={styles.cardMenu}>
          <button
            className={styles.menuTrigger}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className={styles.menuDropdown}>
              <button className={styles.menuItem} onClick={() => { setMenuOpen(false); }}>
                Edit details
              </button>
              <button
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                onClick={() => { onDelete(course.id); setMenuOpen(false); }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status & progress */}
      <div className={styles.cardStatus}>
        <div className={`${styles.statusBadge} ${styles[`status${course.status.replace(" ", "")}`]}`}>
          {course.status}
        </div>
        <div className={styles.exerciseBadge}>
          Exercises: {course.exercisesDone}/{course.exercisesTotal}
        </div>
      </div>

      {/* Progress bar */}
      {course.exercisesDone > 0 && (
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Footer CTA */}
      <div className={styles.cardFooter}>
        <a
          href="https://app.stg.tutor.studentcentral.ai/login"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.courseDetailsBtn}
        >
          Course Details
        </a>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function WorkspacePage() {
  const [courses, setCourses] = useState<Course[]>(DEMO);
  const [showModal, setShowModal] = useState(false);

  const handleCreate = (course: Course) => {
    setCourses((prev) => [course, ...prev]);
  };

  const handleDelete = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

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

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.mainInner}>
          {/* Page header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>My Workspace</h1>
            <button
              className={styles.createNewBtn}
              onClick={() => setShowModal(true)}
            >
              <span className={styles.createPlus}>+</span>
              Create New
            </button>
          </div>

          {/* Stats ribbon */}
          <div className={styles.statsRibbon}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{courses.length}</div>
              <div className={styles.statLabel}>Courses</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <div className={styles.statValue}>
                {courses.filter((c) => c.status === "In Progress").length}
              </div>
              <div className={styles.statLabel}>In Progress</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <div className={styles.statValue}>
                {courses.reduce((a, c) => a + c.exercisesDone, 0)}
              </div>
              <div className={styles.statLabel}>Exercises completed</div>
            </div>
          </div>

          {/* Grid */}
          {courses.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◻</div>
              <div className={styles.emptyTitle}>No courses yet</div>
              <div className={styles.emptyBody}>
                Create your first course card to get started.
              </div>
              <button
                className={styles.createNewBtn}
                onClick={() => setShowModal(true)}
              >
                <span className={styles.createPlus}>+</span>
                Create New
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
