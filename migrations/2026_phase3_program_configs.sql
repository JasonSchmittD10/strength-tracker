-- Phase 3 — Periodization Engine
--
-- Adds the user_program_configs table and migrates existing active-program state
-- from user_config.data JSONB into normalized rows.
--
-- Schema notes (and why they differ from the plan):
-- 1. The actual workouts table is `sessions` (not `workout_sessions`), and it stores
--    per-session payload as a JSONB blob in `data`. The Phase 3 plan also asks for
--    new fields on workout_sessions (session_type, program_session_id, scheduled_date,
--    was_swapped). To match this app's convention, those go INSIDE sessions.data
--    going forward — no ALTER TABLE here.
-- 2. activeProgramId / programStartDate currently live in user_config.data JSONB.
--    The data migration below copies them into user_program_configs and leaves the
--    old JSONB keys in place for safety; they are no longer read by the app.
-- 3. No RLS in this migration. Repo-wide pattern is client-side `.eq('user_id', ...)`
--    filtering on every query; user_program_configs follows the same pattern. RLS
--    repo-wide is a separate, larger task.

CREATE TABLE user_program_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  started_at DATE NOT NULL,
  ended_at DATE,
  custom_pattern TEXT[],
  inputs JSONB DEFAULT '{}'::jsonb,
  current_meso_index INTEGER DEFAULT 0,
  current_block_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upc_user_active ON user_program_configs(user_id) WHERE ended_at IS NULL;

-- Data migration: copy active program state from legacy user_config.data JSONB.
-- Safe to re-run: skips users who already have an active config row.
INSERT INTO user_program_configs (user_id, program_id, started_at)
SELECT
  user_id,
  data->>'activeProgramId',
  (data->>'programStartDate')::date
FROM user_config
WHERE data->>'activeProgramId' IS NOT NULL
  AND data->>'programStartDate' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_program_configs upc
    WHERE upc.user_id = user_config.user_id
      AND upc.ended_at IS NULL
  );
