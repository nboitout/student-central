import { sql } from "@vercel/postgres";
import type { DemoDeck, ProspectSession, FitSignal, FitConfidence } from "./types";
import { v4 as uuidv4 } from "uuid";

/* ── Schema initialization (run once on first deploy) ─────── */
export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS demo_decks (
      id TEXT PRIMARY KEY,
      rep_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      target_persona TEXT DEFAULT '',
      differentiators JSONB DEFAULT '[]',
      key_questions JSONB DEFAULT '[]',
      pdf_url TEXT,
      slide_texts JSONB DEFAULT '[]',
      total_slides INT DEFAULT 0,
      share_id TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'draft',
      session_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS prospect_sessions (
      id TEXT PRIMARY KEY,
      demo_deck_id TEXT REFERENCES demo_decks(id) ON DELETE CASCADE,
      prospect_name TEXT NOT NULL,
      prospect_email TEXT,
      status TEXT DEFAULT 'active',
      current_slide INT DEFAULT 1,
      total_slides INT DEFAULT 0,
      slide_history JSONB DEFAULT '[]',
      chat_history JSONB DEFAULT '[]',
      discovered_pain_points JSONB DEFAULT '[]',
      fit_signal TEXT,
      fit_confidence TEXT,
      fit_rationale TEXT,
      next_step TEXT,
      rep_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;
}

/* ── DemoDeck helpers ─────────────────────────────────────── */

function rowToDeck(row: Record<string, unknown>): DemoDeck {
  return {
    id:              row.id as string,
    repId:           row.rep_id as string,
    productName:     row.product_name as string,
    targetPersona:   (row.target_persona as string) ?? "",
    differentiators: (row.differentiators as string[]) ?? [],
    keyQuestions:    (row.key_questions as string[]) ?? [],
    pdfUrl:          (row.pdf_url as string) ?? null,
    slideTexts:      (row.slide_texts as string[]) ?? [],
    totalSlides:     (row.total_slides as number) ?? 0,
    shareId:         row.share_id as string,
    status:          (row.status as "draft" | "ready") ?? "draft",
    sessionCount:    (row.session_count as number) ?? 0,
    createdAt:       (row.created_at as Date).toISOString(),
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
  const { rows } = await sql`
    INSERT INTO demo_decks (id, rep_id, product_name, target_persona, differentiators, key_questions, share_id)
    VALUES (
      ${id}, ${data.repId}, ${data.productName}, ${data.targetPersona},
      ${JSON.stringify(data.differentiators)}, ${JSON.stringify(data.keyQuestions)}, ${shareId}
    )
    RETURNING *
  `;
  return rowToDeck(rows[0]);
}

export async function getDeckById(id: string): Promise<DemoDeck | null> {
  const { rows } = await sql`SELECT * FROM demo_decks WHERE id = ${id}`;
  return rows[0] ? rowToDeck(rows[0]) : null;
}

export async function getDeckByShareId(shareId: string): Promise<DemoDeck | null> {
  const { rows } = await sql`SELECT * FROM demo_decks WHERE share_id = ${shareId}`;
  return rows[0] ? rowToDeck(rows[0]) : null;
}

export async function listDecksByRep(repId: string): Promise<DemoDeck[]> {
  const { rows } = await sql`
    SELECT d.*,
      COUNT(s.id)::int AS session_count_live
    FROM demo_decks d
    LEFT JOIN prospect_sessions s ON s.demo_deck_id = d.id
    WHERE d.rep_id = ${repId}
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `;
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
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  if (patch.productName   != null) { sets.push(`product_name = $${idx++}`);   vals.push(patch.productName); }
  if (patch.targetPersona != null) { sets.push(`target_persona = $${idx++}`); vals.push(patch.targetPersona); }
  if (patch.differentiators != null) { sets.push(`differentiators = $${idx++}`); vals.push(JSON.stringify(patch.differentiators)); }
  if (patch.keyQuestions  != null) { sets.push(`key_questions = $${idx++}`);  vals.push(JSON.stringify(patch.keyQuestions)); }
  if (patch.pdfUrl        != null) { sets.push(`pdf_url = $${idx++}`);        vals.push(patch.pdfUrl); }
  if (patch.slideTexts    != null) { sets.push(`slide_texts = $${idx++}`);    vals.push(JSON.stringify(patch.slideTexts)); }
  if (patch.totalSlides   != null) { sets.push(`total_slides = $${idx++}`);   vals.push(patch.totalSlides); }
  if (patch.status        != null) { sets.push(`status = $${idx++}`);         vals.push(patch.status); }

  if (sets.length === 0) return getDeckById(id);

  vals.push(id);
  const query = `UPDATE demo_decks SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`;
  const { rows } = await sql.query(query, vals);
  return rows[0] ? rowToDeck(rows[0]) : null;
}

export async function deleteDeck(id: string): Promise<void> {
  await sql`DELETE FROM demo_decks WHERE id = ${id}`;
}

/* ── ProspectSession helpers ──────────────────────────────── */

function rowToSession(row: Record<string, unknown>): ProspectSession {
  return {
    id:                  row.id as string,
    demoDeckId:          row.demo_deck_id as string,
    prospectName:        row.prospect_name as string,
    prospectEmail:       (row.prospect_email as string) ?? null,
    status:              (row.status as "active" | "completed") ?? "active",
    currentSlide:        (row.current_slide as number) ?? 1,
    totalSlides:         (row.total_slides as number) ?? 0,
    slideHistory:        (row.slide_history as ProspectSession["slideHistory"]) ?? [],
    chatHistory:         (row.chat_history as ProspectSession["chatHistory"]) ?? [],
    discoveredPainPoints:(row.discovered_pain_points as string[]) ?? [],
    fitSignal:           (row.fit_signal as FitSignal) ?? null,
    fitConfidence:       (row.fit_confidence as FitConfidence) ?? null,
    fitRationale:        (row.fit_rationale as string) ?? null,
    nextStep:            (row.next_step as string) ?? null,
    repNotes:            (row.rep_notes as string) ?? null,
    createdAt:           (row.created_at as Date).toISOString(),
    completedAt:         row.completed_at ? (row.completed_at as Date).toISOString() : null,
  };
}

export async function createSession(data: {
  demoDeckId: string;
  prospectName: string;
  prospectEmail?: string;
  totalSlides: number;
}): Promise<ProspectSession> {
  const id = uuidv4();
  const { rows } = await sql`
    INSERT INTO prospect_sessions (id, demo_deck_id, prospect_name, prospect_email, total_slides)
    VALUES (${id}, ${data.demoDeckId}, ${data.prospectName}, ${data.prospectEmail ?? null}, ${data.totalSlides})
    RETURNING *
  `;
  return rowToSession(rows[0]);
}

export async function getSessionById(id: string): Promise<ProspectSession | null> {
  const { rows } = await sql`SELECT * FROM prospect_sessions WHERE id = ${id}`;
  return rows[0] ? rowToSession(rows[0]) : null;
}

export async function listSessionsByDeck(deckId: string): Promise<ProspectSession[]> {
  const { rows } = await sql`
    SELECT * FROM prospect_sessions
    WHERE demo_deck_id = ${deckId}
    ORDER BY created_at DESC
  `;
  return rows.map(rowToSession);
}

export async function updateSession(
  id: string,
  patch: Partial<Pick<ProspectSession,
    "currentSlide" | "slideHistory" | "chatHistory" | "discoveredPainPoints" |
    "fitSignal" | "fitConfidence" | "fitRationale" | "nextStep" | "repNotes" | "status" | "completedAt"
  >>
): Promise<ProspectSession | null> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  if (patch.currentSlide         != null) { sets.push(`current_slide = $${idx++}`);          vals.push(patch.currentSlide); }
  if (patch.slideHistory         != null) { sets.push(`slide_history = $${idx++}`);           vals.push(JSON.stringify(patch.slideHistory)); }
  if (patch.chatHistory          != null) { sets.push(`chat_history = $${idx++}`);            vals.push(JSON.stringify(patch.chatHistory)); }
  if (patch.discoveredPainPoints != null) { sets.push(`discovered_pain_points = $${idx++}`);  vals.push(JSON.stringify(patch.discoveredPainPoints)); }
  if (patch.fitSignal            != null) { sets.push(`fit_signal = $${idx++}`);              vals.push(patch.fitSignal); }
  if (patch.fitConfidence        != null) { sets.push(`fit_confidence = $${idx++}`);          vals.push(patch.fitConfidence); }
  if (patch.fitRationale         != null) { sets.push(`fit_rationale = $${idx++}`);           vals.push(patch.fitRationale); }
  if (patch.nextStep             != null) { sets.push(`next_step = $${idx++}`);               vals.push(patch.nextStep); }
  if (patch.repNotes             != null) { sets.push(`rep_notes = $${idx++}`);               vals.push(patch.repNotes); }
  if (patch.status               != null) { sets.push(`status = $${idx++}`);                  vals.push(patch.status); }
  if (patch.completedAt          != null) { sets.push(`completed_at = $${idx++}`);            vals.push(patch.completedAt); }

  if (sets.length === 0) return getSessionById(id);

  vals.push(id);
  const query = `UPDATE prospect_sessions SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`;
  const { rows } = await sql.query(query, vals);
  return rows[0] ? rowToSession(rows[0]) : null;
}
