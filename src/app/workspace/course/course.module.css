/* ════════════════════════════════════════════════════════
   COURSE READER — aligned to DESIGN.md editorial system
   Rules: 0px radius · no 1px dividers · surface-shift depth
   Full-viewport: header + sidebar + pdf pane
════════════════════════════════════════════════════════ */

/* ── Page shell: full-height flex column ─────────────────── */
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-low);
  color: var(--on-surface);
  font-family: var(--font-body);
  overflow: hidden;                      /* children scroll, not the page */
}

/* ── Header ──────────────────────────────────────────────── */
.header {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 0 32px;
  background: rgba(249, 249, 252, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-ambient);
  z-index: 50;
  gap: 24px;
}

.headerLeft {
  flex-shrink: 0;
  min-width: 120px;
}

/* Tertiary link: underline offset style */
.backBtn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  color: var(--on-surface-variant);
  font-family: var(--font-display);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-decoration-color: var(--primary);
  text-underline-offset: 4px;
  text-decoration-thickness: 2px;
  transition: color 0.2s;
  white-space: nowrap;
}
.backBtn:hover { color: var(--primary); }

.headerCenter {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

/* Eyebrow: Data Ribbon style */
.headerEyebrow {
  font-family: var(--font-display);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--primary);
  display: block;
  margin-bottom: 1px;
}

.headerTitle {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--on-surface);
  letter-spacing: -0.01em;
  max-width: 480px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.headerRight {
  flex-shrink: 0;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* Icon button: secondary surface */
.iconBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--surface-highest);
  border: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-decoration: none;
  flex-shrink: 0;
}
.iconBtn:hover { background: var(--surface-high); color: var(--on-surface); }
.iconBtnActive {
  background: var(--tertiary-fixed);
  color: var(--primary);
}

/* ── Body: sidebar + viewer side by side ─────────────────── */
.body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* ── Sidebar ─────────────────────────────────────────────── */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--surface-lowest);    /* white sheet */
  box-shadow: var(--shadow-ambient);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s;
  z-index: 10;
}
.sidebarClosed {
  width: 0;
  opacity: 0;
  pointer-events: none;
}
.sidebarOpen {
  width: 280px;
  opacity: 1;
}

/* Sidebar section: generous padding */
.sidebarSection {
  padding: 24px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Background-shift divider (No-Line rule) */
.sidebarDivider {
  height: 8px;
  background: var(--surface-low);       /* #f3f3f6 — recess strip */
  flex-shrink: 0;
}

/* Status chip: Data Ribbon — tertiary-fixed, 0px radius */
.statusChip {
  display: inline-flex;
  align-self: flex-start;
  font-family: var(--font-display);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 4px 10px;
  background: var(--tertiary-fixed);
  color: var(--on-tertiary-fixed);
}
/* Semantic overrides */
.statusInProgress  { background: rgba(0, 60, 194, 0.08); color: var(--primary); }
.statusCompleted   { background: rgba(45, 106, 79, 0.10); color: #2d6a4f; }
.statusNotStarted  { background: var(--surface-container); color: var(--on-surface-variant); }

.sidebarTitle {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--on-surface);
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.sidebarAuthor {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--on-surface-variant);
  line-height: 1.5;
}

/* Section label: institutional metadata style */
.sidebarLabel {
  font-family: var(--font-display);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
  opacity: 0.5;
}

/* Progress */
.progressHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progressPct {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.03em;
}

.progressTrack {
  height: 3px;
  background: var(--surface-container);
}

.progressFill {
  height: 100%;
  background: var(--primary-gradient);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.progressStats {
  display: flex;
  gap: 16px;
}

.progressStat {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}
.progressStat strong {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--on-surface);
}

/* Source file pill */
.sourceFile {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  line-height: 1.5;
  background: var(--surface-low);
  padding: 10px 12px;
}

/* Action buttons */
.mcqBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-gradient);
  color: #ffffff;
  border: none;
  font-family: var(--font-display);
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 11px 16px;
  cursor: pointer;
  transition: opacity 0.2s;
  letter-spacing: 0.01em;
  width: 100%;
  justify-content: center;
}
.mcqBtn:hover { opacity: 0.88; }

.tutorBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-highest);
  color: var(--on-surface-variant);
  border: none;
  font-family: var(--font-display);
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 11px 16px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  text-decoration: none;
  width: 100%;
}
.tutorBtn:hover {
  background: var(--surface-high);
  color: var(--on-surface);
}

/* Zoom controls */
.zoomValue:hover { color: var(--primary); }

/* ── PDF Viewer pane ─────────────────────────────────────── */
.viewerWrap {
  flex: 1;
  position: relative;
  overflow: auto;
  background: var(--surface-container);  /* the "desk" under the document */
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

/* Zoom wrapper: transform origin at top-center */
.iframeWrap {
  width: 100%;
  height: 100%;
  transform-origin: top center;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* iframe: fills the entire viewer area */
.iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  background: var(--surface-low);
}

/* ── Loading / error overlay ─────────────────────────────── */
.pdfOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--surface-low);
  z-index: 5;
  gap: 16px;
}

.pdfError {
  background: var(--surface-lowest);
}

/* Spinner: gradient ring */
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--surface-container);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.errorIcon {
  width: 48px;
  height: 48px;
  background: rgba(179, 38, 30, 0.08);
  border-left: 3px solid #b3261e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: #b3261e;
}

.overlayText {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--on-surface);
  letter-spacing: -0.01em;
}

.overlayHint {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--on-surface-variant);
  max-width: 360px;
  text-align: center;
  line-height: 1.6;
}

.openExternal {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 2px;
  cursor: pointer;
}

/* ── Empty state (no blob URL configured) ────────────────── */
.emptyState {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 24px;
  text-align: center;
  background: var(--surface-low);
}

.emptyIcon {
  color: var(--on-surface-variant);
  opacity: 0.25;
}

.emptyTitle {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--on-surface);
  letter-spacing: -0.02em;
}

.emptyBody {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--on-surface-variant);
  line-height: 1.65;
  max-width: 400px;
}

/* env var code style */
.envCode {
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 0.8125rem;
  background: var(--surface-container);
  color: var(--primary);
  padding: 2px 6px;
}

.emptyFile {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  opacity: 0.5;
  background: var(--surface-container);
  padding: 8px 14px;
}

/* ── Suspense fallback ───────────────────────────────────── */
.suspenseFallback {
  height: 100vh;
  background: var(--surface-low);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .sidebarOpen {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 20;
    box-shadow: var(--shadow-float);
  }

  .headerTitle {
    max-width: 200px;
  }

  .headerCenter {
    align-items: flex-start;
  }
}

/* ── Mini dashboard widget ───────────────────────────────── */
.miniDash {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.miniMetrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--outline-variant);
}

.miniMetric {
  background: var(--surface-low);
  padding: 12px 14px;
}

.miniVal {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--on-surface);
  line-height: 1;
  margin-bottom: 3px;
}

.miniValBlue { color: var(--primary); }

.miniLbl {
  font-family: var(--font-display);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
  opacity: 0.45;
}

.miniBarWrap {
  padding: 10px 14px 12px;
  background: var(--surface-low);
  border-top: 1px solid var(--outline-variant);
}

.miniBarRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.miniBarLabel {
  font-family: var(--font-display);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
  opacity: 0.45;
}

.miniBarPct {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
}

.miniTrack {
  height: 4px;
  background: var(--surface-container);
  overflow: hidden;
}

.miniFill {
  height: 100%;
  background: var(--primary);
  transition: width 0.4s ease;
}

.dashLink {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
  background: var(--surface-low);
  border: none;
  border-top: 1px solid var(--outline-variant);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.15s;
}
.dashLink:hover { background: rgba(0, 72, 216, 0.06); }
