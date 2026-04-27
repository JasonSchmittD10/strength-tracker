-- Phase 6 — Conditioning subsystem
--
-- Each conditioning session writes a row to `sessions` (the existing app
-- table; the plan calls it workout_sessions, but the actual table here is
-- `sessions`) with `data->>'session_type' = 'conditioning'`, plus one row
-- per ConditioningBlock to `conditioning_results` keyed by session_id.
--
-- RLS: matches existing repo pattern — no RLS on user-owned tables; ownership
-- is enforced by client-side `.eq('user_id', auth.uid())` filtering, plus a
-- session_id FK that cascades on delete. Phase 3 and Phase 4 made the same
-- choice. Repo-wide RLS remains a separate, larger task.

-- Note: this app's `sessions` table uses BIGINT identity for `id`, not UUID
-- (the plan's schema example assumed UUID). session_id matches the existing
-- column type to keep the FK valid.

CREATE TABLE conditioning_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  block_index INTEGER NOT NULL,
  modality TEXT NOT NULL,
  duration_seconds INTEGER,
  distance_value NUMERIC,
  distance_unit TEXT,
  avg_pace_seconds_per_unit INTEGER,
  rounds_completed INTEGER,
  rpe NUMERIC CHECK (rpe BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cr_session ON conditioning_results(session_id);
