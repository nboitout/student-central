import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import type { DemoDeck, ProspectSession, FitSignal, FitConfidence } from "./types";

/* ── DB file lives in project root during local dev ─────── */
const DB_PATH = path.join(process.cwd(), "local.db");
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS demo_decks (
      id             TEXT PRIMARY KEY,
      rep_id         TEXT NOT NULL,
      product_name   TEXT NOT NULL,
      target_persona TEXT DEFAULT '',
      differentiators TEXT DEFAULT '[]',
      key_questions  TEXT DEFAULT '[]',
      pdf_url        TEXT,
      slide_texts    TEXT DEFAULT '[]',
      total_slides   INTEGER DEFAULT 0,
      share_id       TEXT UNIQUE NOT NULL,
      status         TEXT DEFAULT 'draft',
      session_count  INTEGER DEFAULT 0,
      created_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prospect_sessions (
      id                   TEXT PRIMARY KEY,
      demo_deck_id         TEXT REFERENCES demo_decks(id) ON DELETE CASCADE,
      prospect_name        TEXT NOT NULL,
      prospect_email       TEXT,
      status               TEXT DEFAULT 'active',
      current_slide        INTEGER DEFAULT 1,
      total_slides         INTEGER DEFAULT 0,
      slide_history        TEXT DEFAULT '[]',
      chat_history         TEXT DEFAULT '[]',
      discovered_pain_points TEXT DEFAULT '[]',
      fit_signal           TEXT,
      fit_confidence       TEXT,
      fit_rationale        TEXT,
      next_step            TEXT,
      rep_notes            TEXT,
      created_at           TEXT DEFAULT (datetime('now')),
      completed_at         TEXT
    );
  `);
}

/* ── DemoDeck helpers ─────────────────────────────────────── */

function rowToDeck(row: Record<string, unknown>): DemoDeck {
  return {
    id:              row.id as string,
    repId:           row.rep_id as string,
    productName:     row.product_name as string,
    targetPersona:   (row.target_persona as string) ?? "",
    differentiators: JSON.parse((row.differentiators as string) ?? "[]"),
    keyQuestions:    JSON.parse((row.key_questions  as string) ?? "[]"),
    pdfUrl:          (row.pdf_url as string) ?? null,
    slideTexts:      JSON.parse((row.slide_texts  as string) ?? "[]"),
    totalSlides:     (row.total_slides as number) ?? 0,
    shareId:         row.share_id as string,
    status:          (row.status as "draft" | "ready") ?? "draft",
    sessionCount:    (row.session_count as number) ?? 0,
    createdAt:       row.created_at as string,
  };
}

export async function createDeck(data: {
  repId: string;
  productName: string;
  targetPersona: string;
  differentiators: string[];
  keyQuestions: string[];
}): Promise<DemoDeck> {
  const id      = uuidv4();
  const shareId = uuidv4();
  const db      = getDb();
  db.prepare(`
    INSERT INTO demo_decks (id, rep_id, product_name, target_persona, differentiators, key_questions, share_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.repId, data.productName, data.targetPersona,
         JSON.stringify(data.differentiators), JSON.stringify(data.keyQuestions), shareId);
  return rowToDeck(db.prepare("SELECT * FROM demo_decks WHERE id = ?").get(id) as Record<string, unknown>);
}

export async function getDeckById(id: string): Promise<DemoDeck | null> {
  const row = getDb().prepare("SELECT * FROM demo_decks WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToDeck(row) : null;
}

export async function getDeckByShareId(shareId: string): Promise<DemoDeck | null> {
  const row = getDb().prepare("SELECT * FROM demo_decks WHERE share_id = ?").get(shareId) as Record<string, unknown> | undefined;
  return row ? rowToDeck(row) : null;
}

export async function listDecksByRep(repId: string): Promise<DemoDeck[]> {
  const db   = getDb();
  const rows = db.prepare(`
    SELECT d.*, COUNT(s.id) AS session_count_live
    FROM demo_decks d
    LEFT JOIN prospect_sessions s ON s.demo_deck_id = d.id
    WHERE d.rep_id = ?
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `).all(repId) as Record<string, unknown>[];
  return rows.map(r => ({ ...rowToDeck(r), sessionCount: (r.session_count_live as number) ?? 0 }));
}

export async function updateDeck(
  id: string,
  patch: Partial<{
    productName: string;
    targetPersona: string;
    differentiators: string[];
    keyQuestions: string[];
    pdfUrl: string;
    slideTexts: string[];
    totalSlides: number;
    status: "draft" | "ready";
  }>
): Promise<DemoDeck | null> {
  const db   = getDb();
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (patch.productName    != null) { sets.push("product_name = ?");   vals.push(patch.productName); }
  if (patch.targetPersona  != null) { sets.push("target_persona = ?"); vals.push(patch.targetPersona); }
  if (patch.differentiators!= null) { sets.push("differentiators = ?");vals.push(JSON.stringify(patch.differentiators)); }
  if (patch.keyQuestions   != null) { sets.push("key_questions = ?");  vals.push(JSON.stringify(patch.keyQuestions)); }
  if (patch.pdfUrl         != null) { sets.push("pdf_url = ?");        vals.push(patch.pdfUrl); }
  if (patch.slideTexts     != null) { sets.push("slide_texts = ?");    vals.push(JSON.stringify(patch.slideTexts)); }
  if (patch.totalSlides    != null) { sets.push("total_slides = ?");   vals.push(patch.totalSlides); }
  if (patch.status         != null) { sets.push("status = ?");         vals.push(patch.status); }

  if (sets.length === 0) return getDeckById(id);
  vals.push(id);
  db.prepare(`UPDATE demo_decks SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return getDeckById(id);
}

export async function deleteDeck(id: string): Promise<void> {
  getDb().prepare("DELETE FROM demo_decks WHERE id = ?").run(id);
}

/* ── ProspectSession helpers ──────────────────────────────── */

function rowToSession(row: Record<string, unknown>): ProspectSession {
  return {
    id:                   row.id as string,
    demoDeckId:           row.demo_deck_id as string,
    prospectName:         row.prospect_name as string,
    prospectEmail:        (row.prospect_email as string) ?? null,
    status:               (row.status as "active" | "completed") ?? "active",
    currentSlide:         (row.current_slide as number) ?? 1,
    totalSlides:          (row.total_slides as number) ?? 0,
    slideHistory:         JSON.parse((row.slide_history as string) ?? "[]"),
    chatHistory:          JSON.parse((row.chat_history  as string) ?? "[]"),
    discoveredPainPoints: JSON.parse((row.discovered_pain_points as string) ?? "[]"),
    fitSignal:            (row.fit_signal    as FitSignal)    ?? null,
    fitConfidence:        (row.fit_confidence as FitConfidence) ?? null,
    fitRationale:         (row.fit_rationale as string) ?? null,
    nextStep:             (row.next_step     as string) ?? null,
    repNotes:             (row.rep_notes     as string) ?? null,
    createdAt:            row.created_at as string,
    completedAt:          (row.completed_at  as string) ?? null,
  };
}

export async function createSession(data: {
  demoDeckId: string;
  prospectName: string;
  prospectEmail?: string;
  totalSlides: number;
}): Promise<ProspectSession> {
  const id = uuidv4();
  const db = getDb();
  db.prepare(`
    INSERT INTO prospect_sessions (id, demo_deck_id, prospect_name, prospect_email, total_slides)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.demoDeckId, data.prospectName, data.prospectEmail ?? null, data.totalSlides);
  return rowToSession(db.prepare("SELECT * FROM prospect_sessions WHERE id = ?").get(id) as Record<string, unknown>);
}

export async function getSessionById(id: string): Promise<ProspectSession | null> {
  const row = getDb().prepare("SELECT * FROM prospect_sessions WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToSession(row) : null;
}

export async function listSessionsByDeck(deckId: string): Promise<ProspectSession[]> {
  const rows = getDb().prepare(
    "SELECT * FROM prospect_sessions WHERE demo_deck_id = ? ORDER BY created_at DESC"
  ).all(deckId) as Record<string, unknown>[];
  return rows.map(rowToSession);
}

export async function updateSession(
  id: string,
  patch: Partial<Pick<ProspectSession,
    "currentSlide" | "slideHistory" | "chatHistory" | "discoveredPainPoints" |
    "fitSignal" | "fitConfidence" | "fitRationale" | "nextStep" | "repNotes" | "status" | "completedAt"
  >>
): Promise<ProspectSession | null> {
  const db   = getDb();
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (patch.currentSlide         != null) { sets.push("current_slide = ?");           vals.push(patch.currentSlide); }
  if (patch.slideHistory         != null) { sets.push("slide_history = ?");            vals.push(JSON.stringify(patch.slideHistory)); }
  if (patch.chatHistory          != null) { sets.push("chat_history = ?");             vals.push(JSON.stringify(patch.chatHistory)); }
  if (patch.discoveredPainPoints != null) { sets.push("discovered_pain_points = ?");   vals.push(JSON.stringify(patch.discoveredPainPoints)); }
  if (patch.fitSignal            != null) { sets.push("fit_signal = ?");               vals.push(patch.fitSignal); }
  if (patch.fitConfidence        != null) { sets.push("fit_confidence = ?");           vals.push(patch.fitConfidence); }
  if (patch.fitRationale         != null) { sets.push("fit_rationale = ?");            vals.push(patch.fitRationale); }
  if (patch.nextStep             != null) { sets.push("next_step = ?");                vals.push(patch.nextStep); }
  if (patch.repNotes             != null) { sets.push("rep_notes = ?");                vals.push(patch.repNotes); }
  if (patch.status               != null) { sets.push("status = ?");                   vals.push(patch.status); }
  if (patch.completedAt          != null) { sets.push("completed_at = ?");             vals.push(patch.completedAt); }

  if (sets.length === 0) return getSessionById(id);
  vals.push(id);
  db.prepare(`UPDATE prospect_sessions SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return getSessionById(id);
}
