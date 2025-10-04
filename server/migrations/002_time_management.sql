-- Time Management Migration: add start_date/estimate and time_entries table

-- 1) Add columns to cards for scheduling
ALTER TABLE IF EXISTS cards
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_seconds INTEGER DEFAULT 0;

-- 2) Create time_entries table for time tracking
CREATE TABLE IF NOT EXISTS time_entries (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE WHEN end_time IS NULL THEN NULL ELSE EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER END
  ) STORED,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_card_id ON time_entries(card_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_end_time ON time_entries(end_time);

-- 4) Optional constraint: disallow multiple open timers per user (comment out if not needed)
-- A partial unique index to ensure at most one open time entry per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_time_entries_user_open
  ON time_entries(user_id)
  WHERE end_time IS NULL;



