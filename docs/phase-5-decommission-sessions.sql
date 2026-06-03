-- Phase 5: Decommission legacy `sessions` table
--
-- PREREQUISITES — run these checks BEFORE applying this script:
--
--   1. Verify Phase 4 migration is complete (expect 0 rows):
--
--      SELECT s.id AS missing_source_id
--      FROM sessions s
--      WHERE NOT EXISTS (
--        SELECT 1 FROM workout_sessions ws
--        WHERE (ws.notes::jsonb->>'migrated_from_session_id')::bigint = s.id
--      );
--
--      If ANY rows are returned, ABORT. Investigate and re-run the Phase 4
--      migration script before proceeding.
--
--   2. Run step (2) below standalone first and confirm it returns 0 before
--      executing the full transaction.
--
-- HOW TO APPLY:
--   Open the Supabase SQL editor, paste this file, and run it.
--   The entire script is wrapped in a transaction; any failure rolls back.

BEGIN;

-- (1) Idempotent activity migration.
--     Updates the ~14 activity rows whose session_id is still a bigint string
--     (pointing at legacy sessions.id) to the corresponding workout_sessions uuid.
--     No-op if already applied.
UPDATE activity a
SET session_id = ws.id::text
FROM workout_sessions ws
WHERE (ws.notes::jsonb->>'migrated_from_session_id')::bigint = a.session_id::bigint
  AND a.session_id ~ '^[0-9]+$';

-- (2) Verify all activity rows are now uuid-shaped.
--     This SELECT MUST return 0 in the bigint_stragglers column before continuing.
--     If it returns > 0, some activity rows reference sessions that were never
--     migrated. Roll back and investigate; those rows may need to be deleted
--     (ask the repo owner before doing so).
SELECT COUNT(*) AS bigint_stragglers
FROM activity
WHERE session_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- (3) Re-tighten the activity.session_id column type back to uuid.
--     The column was widened to text in phase-3-activity-column-prep.sql to
--     allow both bigint-string legacy ids and uuid new ids during the cutover.
ALTER TABLE activity ALTER COLUMN session_id TYPE uuid USING session_id::uuid;

-- (4) Restore the foreign key from activity → workout_sessions.
--     This was dropped in phase-3-fk-prep.sql when the column was widened.
--     ON DELETE CASCADE means deleting a workout session cleans up its activity row.
ALTER TABLE activity
  ADD CONSTRAINT activity_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE;

-- (5) Drop the legacy sessions table.
--     All 25 historical rows have been migrated to workout_sessions (verified
--     by Phase 4 and the prerequisite check above). The table is no longer
--     referenced by any application code after this PR lands.
DROP TABLE sessions;

COMMIT;
