-- Run this once in the Vercel Postgres dashboard (Storage → your DB → Query tab)

CREATE TABLE IF NOT EXISTS demo_decks (
  id              TEXT PRIMARY KEY,
  rep_id          TEXT NOT NULL,
  product_name    TEXT NOT NULL,
  target_persona  TEXT DEFAULT '',
  differentiators TEXT DEFAULT '[]',
  key_questions   TEXT DEFAULT '[]',
  pdf_url         TEXT,
  slide_texts     TEXT DEFAULT '[]',
  total_slides    INTEGER DEFAULT 0,
  share_id        TEXT UNIQUE NOT NULL,
  status          TEXT DEFAULT 'draft',
  session_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prospect_sessions (
  id                    TEXT PRIMARY KEY,
  demo_deck_id          TEXT REFERENCES demo_decks(id) ON DELETE CASCADE,
  prospect_name         TEXT NOT NULL,
  prospect_email        TEXT,
  status                TEXT DEFAULT 'active',
  current_slide         INTEGER DEFAULT 1,
  total_slides          INTEGER DEFAULT 0,
  slide_history         TEXT DEFAULT '[]',
  chat_history          TEXT DEFAULT '[]',
  discovered_pain_points TEXT DEFAULT '[]',
  fit_signal            TEXT,
  fit_confidence        TEXT,
  fit_rationale         TEXT,
  next_step             TEXT,
  rep_notes             TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);
