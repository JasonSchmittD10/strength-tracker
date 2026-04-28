#!/usr/bin/env node
// Phase 4 — historical sessions migration. One-shot, idempotent.
//
//   node scripts/migrate-historical-sessions.mjs           # real
//   node scripts/migrate-historical-sessions.mjs --dry-run # parse + resolve, no writes
//
// Reads every row in `sessions`, resolves exercise names to UUIDs via the
// embedded alias map (snapshot of src/lib/exercises.js NAME_ALIASES at the
// time of writing — Phase 3 reconciliation already landed, so DB names ARE
// the canonical names in this map). Inserts to workout_sessions /
// workout_exercises / sets. Tags `notes` with `migrated_from_session_id`
// so re-runs skip already-migrated rows.
//
// Auth: SUPABASE_SERVICE_ROLE_KEY in .env.local. Bypasses RLS so it can
// write rows for any user_id present in `sessions`.
//
// Failure handling: per-row. A failed exercise lookup aborts that row before
// any insert. A child insert failure deletes the parent (cascades).

import { readFileSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolvePath(__dirname, '..')

// ── Env loader (no dotenv dep) ─────────────────────────────────────────────
function loadEnvFile(path) {
  let raw
  try { raw = readFileSync(path, 'utf8') } catch { return false }
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    const [, k, vRaw] = m
    if (process.env[k] !== undefined) continue
    const v = vRaw.replace(/^["'](.*)["']$/, '$1')
    process.env[k] = v
  }
  return true
}
loadEnvFile(resolvePath(REPO_ROOT, '.env.local'))

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL in .env.local')
  process.exit(1)
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.error('Get it from Supabase Dashboard → Project Settings → API → service_role (secret).')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Alias maps ─────────────────────────────────────────────────────────────
// Snapshot of NAME_ALIASES from src/lib/exercises.js (post-Phase-3
// reconciliation). Right-hand side names ARE the current DB names.
const NAME_ALIASES = {
  'Barbell Overhead Press':             'Overhead Press (Barbell)',
  'Dumbbell Incline Press':             'Incline Dumbbell Press',
  'Cable Tricep Pushdown':              'Tricep Pushdown (Cable)',
  'Dumbbell Overhead Tricep Extension': 'Overhead Tricep Extension',
  'Pull-up':                            'Weighted Pull-Up',
  'Barbell Bent-over Row':              'Barbell Row (Pronated)',
  'Machine Chest-supported Row':        'Chest-Supported Row (DB)',
  'Cable Face Pull':                    'Face Pull (Cable)',
  'Barbell Bicep Curl':                 'Barbell Curl',
  'Dumbbell Hammer Curl':               'Hammer Curl (DB)',
  'Barbell Back Squat':                 'Back Squat (Barbell)',
  'Barbell Romanian Deadlift':          'Romanian Deadlift',
  'Machine Leg Press':                  'Leg Press',
  'Machine Leg Curl':                   'Leg Curl (Machine)',
  'Dumbbell Walking Lunge':             'Walking Lunge (DB)',
  'Machine Standing Calf Raise':        'Standing Calf Raise',
  'Barbell Incline Bench Press':        'Incline Barbell Press',
  'Cable Chest Fly':                    'Cable Fly (Low-to-High)',
  'Dumbbell Lateral Raise':             'Lateral Raise (DB)',
  'Barbell Close Grip Bench Press':     'Close-Grip Bench Press',
  'EZ Bar Skull Crusher':               'Skull Crusher (EZ Bar)',
  'Cable Lat Pulldown':                 'Lat Pulldown (Wide Grip)',
  'Cable Seated Row':                   'Cable Row (Neutral Grip)',
  'Dumbbell Single-arm Row':            'Single-Arm DB Row',
  'Cable Straight-arm Pulldown':        'Straight-Arm Pulldown',
  'Dumbbell Incline Curl':              'Incline DB Curl',
  'Cable Curl':                         'Cable Curl (Rope)',
  'Barbell Bulgarian Split Squat':      'Bulgarian Split Squat (DB)',
  'Barbell Hack Squat':                 'Hack Squat / Leg Press',
  'Nordic Hamstring Curl':              'Nordic Curl / Lying Leg Curl',
  'Dumbbell Goblet Squat':              'Goblet Squat (Tempo)',
  'Barbell Seated Calf Raise':          'Seated Calf Raise',
  'Chest-Supported Row':                'Chest-Supported Row (DB)',
  'Wide-Grip Lat Pulldown':             'Lat Pulldown (Wide Grip)',
  'Back Squat':                         'Back Squat (Barbell)',
  'Lying Leg Curl':                     'Leg Curl (Machine)',
  'Pull-Up':                            'Weighted Pull-Up',
  'Pull Up':                            'Weighted Pull-Up',
  'Pullup':                             'Weighted Pull-Up',
  'Barbell Row (Pendlay)':              'Barbell Row (Pronated)',
  'Pendlay Row':                        'Barbell Row (Pronated)',
  'Bench Press (Speed)':                'Barbell Bench Press',
  'Back Squat (Speed)':                 'Back Squat (Barbell)',
  'Barbell Row (Speed)':                'Barbell Row (Pronated)',
  'Hack Squat (or Leg Press)':          'Hack Squat / Leg Press',
  'Leg Extension':                      'Leg Extension (Machine)',
  'Tricep Pushdown':                    'Tricep Pushdown (Cable)',
  'Lat Pulldown (Wide)':                'Lat Pulldown (Wide Grip)',
  'Incline Bench Press':                'Incline Barbell Press',
  'Bent-Over Rear Delt Raise':          'Rear Delt Fly (DB)',
  'Dips (Weighted)':                    'Parallel Bar Dip',
  'Tricep Dip':                         'Parallel Bar Dip',
  'Dumbbell Row':                       'Single-Arm DB Row',
  'Tricep Extension (DB)':              'Overhead Tricep Extension',
  'Overhead Press (Seated DB)':         'Seated Dumbbell Shoulder Press',
  'Seated DB Shoulder Press':           'Seated Dumbbell Shoulder Press',
  'Box Squat (Speed)':                  'Back Squat (Barbell)',
  'Speed Bench (3 grips)':              'Barbell Bench Press',
  'Speed Deadlift':                     'Deadlift (Barbell)',
}

// Phase 4 typo / freeform variants found in historical data only — kept out
// of production NAME_ALIASES so the app code stays clean.
const HISTORICAL_TYPO_ALIASES = {
  'Cable Lateral Raises':    'Cable Lateral Raise',
  'Tricep Pushdowns (rope)': 'Tricep Pushdown (Cable)',
}

// Slash-pair exercises whose verbatim historical name is preserved on
// workout_exercises.notes for traceability.
const PRESERVE_ORIGINAL_IN_NOTES = new Set([
  'Hack Squat / Leg Press',
  'Nordic Curl / Lying Leg Curl',
])

function normalizeName(raw) {
  if (!raw) return raw
  if (HISTORICAL_TYPO_ALIASES[raw]) return HISTORICAL_TYPO_ALIASES[raw]
  return NAME_ALIASES[raw] || raw
}

const _exerciseIdCache = new Map()
async function resolveExerciseId(rawName) {
  if (!rawName) return null
  const canonical = normalizeName(rawName)
  if (_exerciseIdCache.has(canonical)) return _exerciseIdCache.get(canonical)
  const { data, error } = await supabase
    .from('exercises')
    .select('id')
    .eq('name', canonical)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error(`exercise lookup failed for "${canonical}": ${error.message}`)
  const id = data?.id ?? null
  _exerciseIdCache.set(canonical, id)
  return id
}

// ── Source row parsing ─────────────────────────────────────────────────────
// Handles both modern (data.exercises[]) and legacy (data.lifts[]) shapes.
function parseSourceRow(row) {
  const d = row.data ?? {}
  const dateFromCreated = row.created_at ? row.created_at.slice(0, 10) : null
  const date = d.date || dateFromCreated || new Date().toISOString().slice(0, 10)
  const sessionName = d.sessionName || d.day || 'Migrated Session'
  const exercisesRaw = d.exercises ?? d.lifts ?? []
  const exercises = exercisesRaw.map(ex => ({
    name: ex.name,
    supersetId: ex.supersetId ?? null,
    sets: (ex.sets || []).map((s, j) => ({
      setNumber: j + 1,
      weight: s.weight === '' || s.weight == null ? null : Number(s.weight),
      reps:   s.reps   === '' || s.reps   == null ? null : parseInt(s.reps, 10),
      rpe:    s.rpe    === '' || s.rpe    == null ? null : Number(s.rpe),
    })),
  }))
  return {
    user_id: row.user_id,
    source_id: row.id,
    session_date: date,
    sessionName,
    sessionId: d.sessionId ?? null,
    tag: d.tag ?? null,
    tagLabel: d.tagLabel ?? null,
    programId: d.programId ?? null,
    program_session_id: d.program_session_id ?? null,
    program_config_id: d.program_config_id ?? null,
    scheduled_date: d.scheduled_date ?? null,
    was_swapped: d.was_swapped ?? false,
    session_type: d.session_type ?? 'resistance',
    startedAt: d.startedAt ?? null,
    completedAt: d.completedAt ?? d.date ?? null,
    durationSeconds: d.durationSeconds ?? d.duration ?? 0,
    totalVolume: d.totalVolume ?? null,
    modality: d.modality,
    conditioning_summary: d.conditioning_summary,
    exercises,
  }
}

function buildNotesBlob(parsed) {
  return JSON.stringify({
    sessionId: parsed.sessionId,
    tag: parsed.tag,
    tagLabel: parsed.tagLabel,
    programId: parsed.programId,
    program_session_id: parsed.program_session_id,
    program_config_id: parsed.program_config_id,
    scheduled_date: parsed.scheduled_date,
    was_swapped: parsed.was_swapped,
    session_type: parsed.session_type,
    startedAt: parsed.startedAt,
    completedAt: parsed.completedAt,
    durationSeconds: parsed.durationSeconds,
    totalVolume: parsed.totalVolume,
    ...(parsed.session_type === 'conditioning'
      ? { modality: parsed.modality, conditioning_summary: parsed.conditioning_summary }
      : {}),
    migrated_from_session_id: parsed.source_id,
  })
}

// Idempotence check. Postgres treats `notes` as text, so we substring-match
// the JSON serialization of `migrated_from_session_id`.
async function findExistingMigration(sourceId) {
  const needle = `"migrated_from_session_id":${sourceId}`
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id')
    .ilike('notes', `%${needle}%`)
    .maybeSingle()
  if (error) throw new Error(`idempotence check failed: ${error.message}`)
  return data?.id ?? null
}

async function migrateOne(parsed) {
  // Resolve every exercise upfront — abort the row if any fails.
  const resolved = []
  for (const ex of parsed.exercises) {
    const id = await resolveExerciseId(ex.name)
    if (!id) return { ok: false, reason: `exercise "${ex.name}" did not resolve (normalized to "${normalizeName(ex.name)}")` }
    resolved.push({ ex, exercise_id: id })
  }
  const setCount = resolved.reduce((n, r) => n + r.ex.sets.length, 0)
  if (DRY_RUN) return { ok: true, exercises: resolved.length, sets: setCount }

  // Insert parent
  const { data: parent, error: parentErr } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: parsed.user_id,
      session_date: parsed.session_date,
      name: parsed.sessionName,
      notes: buildNotesBlob(parsed),
    })
    .select('id')
    .single()
  if (parentErr) return { ok: false, reason: `parent insert: ${parentErr.message}` }
  const sessionId = parent.id

  try {
    if (resolved.length > 0) {
      const exerciseRows = resolved.map((r, i) => {
        // notes column carries either: superset marker (Phase 3 pattern), or
        // verbatim original name for slash-pair preservation.
        let notes = null
        if (PRESERVE_ORIGINAL_IN_NOTES.has(r.ex.name)) {
          notes = JSON.stringify({ original_name: r.ex.name })
        } else if (r.ex.supersetId) {
          notes = JSON.stringify({ supersetId: r.ex.supersetId })
        }
        return {
          session_id: sessionId,
          exercise_id: r.exercise_id,
          exercise_order: i + 1,
          notes,
        }
      })
      const { data: insertedExercises, error: exErr } = await supabase
        .from('workout_exercises')
        .insert(exerciseRows)
        .select('id')
      if (exErr) throw exErr

      const setRows = []
      resolved.forEach((r, i) => {
        const woexId = insertedExercises[i].id
        for (const s of r.ex.sets) {
          setRows.push({
            workout_exercise_id: woexId,
            set_number: s.setNumber,
            is_warmup: false,
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            tempo: null,
          })
        }
      })
      if (setRows.length > 0) {
        const { error: setsErr } = await supabase.from('sets').insert(setRows)
        if (setsErr) throw setsErr
      }
    }
    return { ok: true, new_id: sessionId, exercises: resolved.length, sets: setCount }
  } catch (e) {
    // Compensating cleanup; CASCADE handles workout_exercises and sets.
    const { error: cleanupErr } = await supabase.from('workout_sessions').delete().eq('id', sessionId)
    const note = cleanupErr ? ` (cleanup ALSO failed: ${cleanupErr.message})` : ''
    return { ok: false, reason: (e.message ?? String(e)) + note }
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Phase 4 historical migration${DRY_RUN ? '  [DRY RUN — no writes]' : ''}`)
  console.log(`Project: ${SUPABASE_URL}`)
  console.log('')

  const { data: rows, error } = await supabase
    .from('sessions')
    .select('id, user_id, data, created_at')
    .order('created_at', { ascending: true })
  if (error) {
    console.error('Failed to load sessions:', error.message)
    process.exit(1)
  }
  console.log(`Loaded ${rows.length} source rows from \`sessions\`.`)
  console.log('')

  const stats = { migrated: 0, skipped: 0, failed: 0, total_exercises: 0, total_sets: 0 }
  const failures = []

  for (const row of rows) {
    const parsed = parseSourceRow(row)

    let existing = null
    try {
      existing = await findExistingMigration(row.id)
    } catch (e) {
      console.error(`  [src=${row.id}] idempotence check error: ${e.message}`)
    }
    if (existing) {
      stats.skipped++
      console.log(`  [src=${row.id}] SKIP — already migrated as ${existing}`)
      continue
    }

    const result = await migrateOne(parsed)
    if (result.ok) {
      stats.migrated++
      stats.total_exercises += result.exercises
      stats.total_sets += result.sets
      const tag = DRY_RUN ? '(would migrate)' : `→ ${result.new_id}`
      console.log(`  [src=${row.id}] OK ${tag} — ${result.exercises} exercises, ${result.sets} sets`)
    } else {
      stats.failed++
      failures.push({ source_id: row.id, reason: result.reason })
      console.error(`  [src=${row.id}] FAIL — ${result.reason}`)
    }
  }

  console.log('')
  console.log('=== Migration Report ===')
  console.log(`Total source rows:          ${rows.length}`)
  console.log(`Successfully migrated:      ${stats.migrated}${DRY_RUN ? '  (would-be)' : ''}`)
  console.log(`Skipped (already migrated): ${stats.skipped}`)
  console.log(`Failed:                     ${stats.failed}`)
  console.log(`Total exercises processed:  ${stats.total_exercises}`)
  console.log(`Total sets processed:       ${stats.total_sets}`)
  if (failures.length) {
    console.log('')
    console.log('=== Failed rows ===')
    for (const f of failures) console.log(`  source_id=${f.source_id}  reason="${f.reason}"`)
  }
  process.exit(stats.failed > 0 ? 1 : 0)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
