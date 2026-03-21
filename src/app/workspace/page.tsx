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

interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/* ── MCQ bank (one per course) ──────────────────────────── */
const MCQ_BANK: Record<string, MCQQuestion> = {
  "1": {
    question: "Which software development lifecycle model is best suited for projects with well-defined, stable requirements?",
    options: [
      "Agile / Scrum",
      "Waterfall",
      "DevOps continuous delivery",
      "Spiral model",
    ],
    correctIndex: 1,
    explanation: "The Waterfall model follows a sequential, phase-by-phase approach and works best when requirements are clear and unlikely to change — making it ideal for well-defined projects.",
  },
  "2": {
    question: "In Agile, what is the primary purpose of a Sprint Retrospective?",
    options: [
      "To demonstrate completed work to stakeholders",
      "To plan the backlog for the next sprint",
      "To inspect the team process and identify improvements",
      "To review individual developer performance",
    ],
    correctIndex: 2,
    explanation: "The Sprint Retrospective is a dedicated ceremony for the team to reflect on how they worked — identifying what went well, what didn't, and agreeing on actionable improvements for the next sprint.",
  },
  "3": {
    question: "Which concept best describes the use of AI to continuously monitor and adapt business processes based on real-time data?",
    options: [
      "Business Process Reengineering",
      "ERP consolidation",
      "Intelligent process automation",
      "Digital twin simulation",
    ],
    correctIndex: 2,
    explanation: "Intelligent process automation (IPA) combines AI and automation to monitor, analyse, and adapt business processes dynamically — going well beyond rule-based automation.",
  },
  "default": {
    question: "Which of the following best describes a key characteristic of digital transformation in organisations?",
    options: [
      "Replacing all legacy IT systems with cloud infrastructure",
      "Integrating digital technology into all areas of the business",
      "Automating the entire workforce with AI",
      "Moving all operations fully online",
    ],
    correctIndex: 1,
    explanation: "Digital transformation is fundamentally about integrating digital technology across all business areas — changing how the organisation operates and delivers value, not simply adopting new tools.",
  },
};

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
function CourseDetailsModal({ course, onClose, onStartMCQ }: { course: Course; onClose: () => void; onStartMCQ: () => void }) {
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
          {/* Meta */}
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

          {/* Progress bar */}
          <div className={styles.detailsProgressTrack}>
            <div className={styles.detailsProgressFill} style={{ width: `${Math.round((course.exercisesDone / course.exercisesTotal) * 100)}%` }} />
          </div>

          {/* Action cards */}
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

            <button className={`${styles.actionCard} ${styles.actionCardPrimary}`} onClick={onStartMCQ}>
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
   MCQ MODAL
════════════════════════════════════════════════════════ */
type MCQState = "question" | "result";

function MCQModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const mcq = MCQ_BANK[course.id] ?? MCQ_BANK["default"];
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [screen, setScreen] = useState<MCQState>("question");

  const isCorrect = selected === mcq.correctIndex;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    setTimeout(() => setScreen("result"), 480);
  };

  const handleRetry = () => {
    setSelected(null);
    setSubmitted(false);
    setScreen("question");
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.mcqModal}`} onClick={(e) => e.stopPropagation()}>

        {/* ── Question screen ── */}
        {screen === "question" && (
          <>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>{course.title}</div>
                <h2 className={styles.modalTitle}>Multiple Choice Question</h2>
              </div>
              <button className={styles.modalClose} onClick={onClose}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {/* Question */}
              <div className={styles.mcqQuestion}>{mcq.question}</div>

              {/* Options */}
              <div className={styles.mcqOptions}>
                {mcq.options.map((opt, i) => {
                  const letter = ["A", "B", "C", "D"][i];
                  const isSelected = selected === i;
                  const isCorrectOpt = submitted && i === mcq.correctIndex;
                  const isWrongOpt = submitted && isSelected && i !== mcq.correctIndex;

                  return (
                    <button
                      key={i}
                      className={`${styles.mcqOption} ${isSelected && !submitted ? styles.mcqSelected : ""} ${isCorrectOpt ? styles.mcqCorrect : ""} ${isWrongOpt ? styles.mcqWrong : ""}`}
                      onClick={() => { if (!submitted) setSelected(i); }}
                      disabled={submitted}
                    >
                      <span className={styles.mcqLetter}>{letter}</span>
                      <span className={styles.mcqOptText}>{opt}</span>
                      {isCorrectOpt && <span className={styles.mcqMark}>✓</span>}
                      {isWrongOpt  && <span className={styles.mcqMark}>✗</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button
                className={`${styles.createBtn} ${selected === null ? styles.createDisabled : ""}`}
                onClick={handleSubmit}
                disabled={selected === null || submitted}
              >
                Submit answer
              </button>
            </div>
          </>
        )}

        {/* ── Result screen ── */}
        {screen === "result" && (
          <>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>{course.title}</div>
                <h2 className={styles.modalTitle}>
                  {isCorrect ? "Correct answer" : "Incorrect answer"}
                </h2>
              </div>
              <button className={styles.modalClose} onClick={onClose}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {/* Result banner */}
              <div className={`${styles.resultBanner} ${isCorrect ? styles.resultBannerCorrect : styles.resultBannerWrong}`}>
                <div className={styles.resultIcon}>{isCorrect ? "✓" : "✗"}</div>
                <div>
                  <div className={styles.resultTitle}>{isCorrect ? "Well done" : "Not quite"}</div>
                  <div className={styles.resultSub}>
                    {isCorrect
                      ? "You selected the right answer."
                      : `The correct answer was: "${mcq.options[mcq.correctIndex]}"`}
                  </div>
                </div>
              </div>

              {/* Your answer recap */}
              <div className={styles.resultRecap}>
                <div className={styles.recapLabel}>Your answer</div>
                <div className={`${styles.recapAnswer} ${isCorrect ? styles.recapCorrect : styles.recapWrong}`}>
                  <span className={styles.mcqLetter}>{["A","B","C","D"][selected!]}</span>
                  {mcq.options[selected!]}
                </div>
              </div>

              {/* Explanation */}
              <div className={styles.resultExplanation}>
                <div className={styles.explanationLabel}>Why this matters</div>
                <p className={styles.explanationText}>{mcq.explanation}</p>
              </div>

              {/* CTA */}
              <div className={styles.resultCTA}>
                <div className={styles.resultCTALabel}>Want to go deeper?</div>
                <a
                  href="https://app.stg.tutor.studentcentral.ai/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.resultCTABtn}
                >
                  Explore this topic in Student Central →
                </a>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={onClose}>Close</button>
              <button className={styles.createBtn} onClick={handleRetry}>Try again</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   COURSE CARD
════════════════════════════════════════════════════════ */
function CourseCard({ course, onDelete, onDetails }: { course: Course; onDelete: (id: string) => void; onDetails: (c: Course) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = Math.round((course.exercisesDone / course.exercisesTotal) * 100);

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardMeta}>
          <h3 className={styles.cardTitle}>{course.title}</h3>
          <div className={styles.cardAuthor}>{course.author}</div>
          <div className={styles.cardSource}>{course.source}</div>
        </div>
        <div className={styles.cardMenu}>
          <button className={styles.menuTrigger} onClick={() => setMenuOpen(!menuOpen)}>⋯</button>
          {menuOpen && (
            <div className={styles.menuDropdown}>
              <button className={styles.menuItem} onClick={() => { onDetails(course); setMenuOpen(false); }}>View details</button>
              <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { onDelete(course.id); setMenuOpen(false); }}>Delete</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.cardStatus}>
        <div className={`${styles.statusBadge} ${styles[`status${course.status.replace(" ", "")}`]}`}>{course.status}</div>
        <div className={styles.exerciseBadge}>Exercises: {course.exercisesDone}/{course.exercisesTotal}</div>
      </div>

      {course.exercisesDone > 0 && (
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className={styles.cardFooter}>
        <button className={styles.courseDetailsBtn} onClick={() => onDetails(course)}>
          Course Details
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════ */
type ModalView = "none" | "create" | "details" | "mcq";

export default function WorkspacePage() {
  const [courses, setCourses] = useState<Course[]>(DEMO);
  const [modal, setModal] = useState<ModalView>("none");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  const openDetails = (course: Course) => { setActiveCourse(course); setModal("details"); };
  const openMCQ     = () => setModal("mcq");
  const closeModal  = () => { setModal("none"); setActiveCourse(null); };

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

          {courses.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◻</div>
              <div className={styles.emptyTitle}>No courses yet</div>
              <div className={styles.emptyBody}>Create your first course card to get started.</div>
              <button className={styles.createNewBtn} onClick={() => setModal("create")}><span className={styles.createPlus}>+</span>Create New</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {courses.map(c => (
                <CourseCard key={c.id} course={c} onDelete={(id) => setCourses(prev => prev.filter(x => x.id !== id))} onDetails={openDetails} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {modal === "create"  && <CreateModal onClose={closeModal} onCreate={(c) => setCourses(prev => [c, ...prev])} />}
      {modal === "details" && activeCourse && <CourseDetailsModal course={activeCourse} onClose={closeModal} onStartMCQ={openMCQ} />}
      {modal === "mcq"     && activeCourse && <MCQModal course={activeCourse} onClose={closeModal} />}
    </div>
  );
}
