-- Phase 4 — Schedule Overrides (Skip / Swap / Reschedule)
--
-- One row per (user, program_config, date) representing a user-applied
-- override on top of the program's normal schedule. resolveScheduledSession
-- consults this table for each date.
--
-- RLS: matching the existing repo pattern (no RLS policies on any user-owned
-- table; client-side `.eq('user_id', auth.uid())` filtering everywhere). The
-- new hook keeps that contract. Phase 3's user_program_configs followed the
-- same approach. Repo-wide RLS remains a separate, larger task.

CREATE TABLE scheduled_session_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_config_id UUID NOT NULL REFERENCES user_program_configs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  override_type TEXT NOT NULL CHECK (override_type IN ('skip', 'swap', 'reschedule')),
  original_session_id TEXT,
  new_session_id TEXT,
  rescheduled_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_config_id, date)
);

CREATE INDEX idx_sso_user_date ON scheduled_session_overrides(user_id, date);
