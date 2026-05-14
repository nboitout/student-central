import { sql, db } from "@vercel/postgres";
import { v4 as uuidv4 } from "uuid";
import type { DemoDeck, ProspectSession, FitSignal, FitConfidence } from "./types";

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
    totalSlides:     Number(row.total_slides  ?? 0),
    shareId:         row.share_id as string,
    status:          (row.status as "draft" | "ready") ?? "draft",
    sessionCount:    Number(row.session_count ?? 0),
    createdAt:       String(row.created_at ?? ""),
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
  const result  = await sql`
    INSERT INTO demo_decks (id, rep_id, product_name, target_persona, differentiators, key_questions, share_id)
    VALUES (${id}, ${data.repId}, ${data.productName}, ${data.targetPersona},
            ${JSON.stringify(data.differentiators)}, ${JSON.stringify(data.keyQuestions)}, ${shareId})
    RETURNING *
  `;
  return rowToDeck(result.rows[0]);
}

export async function getDeckById(id: string): Promise<DemoDeck | null> {
  const result = await sql`SELECT * FROM demo_decks WHERE id = ${id}`;
  return result.rows.length > 0 ? rowToDeck(result.rows[0]) : null;
}

export async function getDeckByShareId(shareId: string): Promise<DemoDeck | null> {
  const result = await sql`SELECT * FROM demo_decks WHERE share_id = ${shareId}`;
  return result.rows.length > 0 ? rowToDeck(result.rows[0]) : null;
}

export async function listDecksByRep(repId: string): Promise<DemoDeck[]> {
  const result = await sql`
    SELECT d.*, COUNT(s.id) AS session_count
    FROM demo_decks d
    LEFT JOIN prospect_sessions s ON s.demo_deck_id = d.id
    WHERE d.rep_id = ${repId}
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `;
  return result.rows.map(rowToDeck);
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
  let   i = 1;

  if (patch.productName    != null) { sets.push(`product_name = $${i++}`);   vals.push(patch.productName); }
  if (patch.targetPersona  != null) { sets.push(`target_persona = $${i++}`); vals.push(patch.targetPersona); }
  if (patch.differentiators!= null) { sets.push(`differentiators = $${i++}`);vals.push(JSON.stringify(patch.differentiators)); }
  if (patch.keyQuestions   != null) { sets.push(`key_questions = $${i++}`);  vals.push(JSON.stringify(patch.keyQuestions)); }
  if (patch.pdfUrl         != null) { sets.push(`pdf_url = $${i++}`);        vals.push(patch.pdfUrl); }
  if (patch.slideTexts     != null) { sets.push(`slide_texts = $${i++}`);    vals.push(JSON.stringify(patch.slideTexts)); }
  if (patch.totalSlides    != null) { sets.push(`total_slides = $${i++}`);   vals.push(patch.totalSlides); }
  if (patch.status         != null) { sets.push(`status = $${i++}`);         vals.push(patch.status); }

  if (sets.length === 0) return getDeckById(id);
  vals.push(id);
  const client = await db.connect();
  try {
    await client.query(`UPDATE demo_decks SET ${sets.join(", ")} WHERE id = $${i}`, vals as string[]);
  } finally {
    client.release();
  }
  return getDeckById(id);
}

export async function deleteDeck(id: string): Promise<void> {
  await sql`DELETE FROM demo_decks WHERE id = ${id}`;
}

/* ── ProspectSession helpers ──────────────────────────────── */

function rowToSession(row: Record<string, unknown>): ProspectSession {
  return {
    id:                   row.id as string,
    demoDeckId:           row.demo_deck_id as string,
    prospectName:         row.prospect_name as string,
    prospectEmail:        (row.prospect_email as string) ?? null,
    status:               (row.status as "active" | "completed") ?? "active",
    currentSlide:         Number(row.current_slide  ?? 1),
    totalSlides:          Number(row.total_slides   ?? 0),
    slideHistory:         JSON.parse((row.slide_history          as string) ?? "[]"),
    chatHistory:          JSON.parse((row.chat_history           as string) ?? "[]"),
    discoveredPainPoints: JSON.parse((row.discovered_pain_points as string) ?? "[]"),
    fitSignal:            (row.fit_signal     as FitSignal)     ?? null,
    fitConfidence:        (row.fit_confidence as FitConfidence) ?? null,
    fitRationale:         (row.fit_rationale  as string) ?? null,
    nextStep:             (row.next_step      as string) ?? null,
    repNotes:             (row.rep_notes      as string) ?? null,
    createdAt:            String(row.created_at  ?? ""),
    completedAt:          (row.completed_at   as string) ?? null,
  };
}

export async function createSession(data: {
  demoDeckId: string;
  prospectName: string;
  prospectEmail?: string;
  totalSlides: number;
}): Promise<ProspectSession> {
  const id     = uuidv4();
  const result = await sql`
    INSERT INTO prospect_sessions (id, demo_deck_id, prospect_name, prospect_email, total_slides)
    VALUES (${id}, ${data.demoDeckId}, ${data.prospectName}, ${data.prospectEmail ?? null}, ${data.totalSlides})
    RETURNING *
  `;
  return rowToSession(result.rows[0]);
}

export async function getSessionById(id: string): Promise<ProspectSession | null> {
  const result = await sql`SELECT * FROM prospect_sessions WHERE id = ${id}`;
  return result.rows.length > 0 ? rowToSession(result.rows[0]) : null;
}

export async function listSessionsByDeck(deckId: string): Promise<ProspectSession[]> {
  const result = await sql`
    SELECT * FROM prospect_sessions WHERE demo_deck_id = ${deckId} ORDER BY created_at DESC
  `;
  return result.rows.map(rowToSession);
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
  let   i = 1;

  if (patch.currentSlide         != null) { sets.push(`current_slide = $${i++}`);           vals.push(patch.currentSlide); }
  if (patch.slideHistory         != null) { sets.push(`slide_history = $${i++}`);            vals.push(JSON.stringify(patch.slideHistory)); }
  if (patch.chatHistory          != null) { sets.push(`chat_history = $${i++}`);             vals.push(JSON.stringify(patch.chatHistory)); }
  if (patch.discoveredPainPoints != null) { sets.push(`discovered_pain_points = $${i++}`);   vals.push(JSON.stringify(patch.discoveredPainPoints)); }
  if (patch.fitSignal            != null) { sets.push(`fit_signal = $${i++}`);               vals.push(patch.fitSignal); }
  if (patch.fitConfidence        != null) { sets.push(`fit_confidence = $${i++}`);           vals.push(patch.fitConfidence); }
  if (patch.fitRationale         != null) { sets.push(`fit_rationale = $${i++}`);            vals.push(patch.fitRationale); }
  if (patch.nextStep             != null) { sets.push(`next_step = $${i++}`);                vals.push(patch.nextStep); }
  if (patch.repNotes             != null) { sets.push(`rep_notes = $${i++}`);                vals.push(patch.repNotes); }
  if (patch.status               != null) { sets.push(`status = $${i++}`);                   vals.push(patch.status); }
  if (patch.completedAt          != null) { sets.push(`completed_at = $${i++}`);             vals.push(patch.completedAt); }

  if (sets.length === 0) return getSessionById(id);
  vals.push(id);
  const client = await db.connect();
  try {
    await client.query(`UPDATE prospect_sessions SET ${sets.join(", ")} WHERE id = $${i}`, vals as string[]);
  } finally {
    client.release();
  }
  return getSessionById(id);
}
