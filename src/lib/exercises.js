import { supabase } from '@/lib/supabase'

// Maps non-canonical exercise names (variants from programs, historical
// session blobs, freeform user typing) onto the canonical name in the
// `exercises` table. The canonical naming style is documented in
// CLAUDE.md → Data layer → Conventions:
//   - equipment-prefix (Dumbbell X, Cable X, Machine X) by default
//   - modifier-first when more natural (Incline Dumbbell Press)
//   - paren-suffix only for grip / style / tempo modifiers (Cable Curl (Rope))
//   - no equipment-name suffixes, no "DB" abbreviations
//
// Each entry's right-hand side MUST exist as a row in the exercises table.
// Identity entries (LHS === RHS) are omitted — normalizeExerciseName falls
// through to the input unchanged.
export const NAME_ALIASES = {
  // ── Equipment-prefix variants of program/historical names ────────────────
  'Pull-up':                            'Weighted Pull-Up',
  'Pull-Up':                            'Weighted Pull-Up',
  'Pull Up':                            'Weighted Pull-Up',
  'Pullup':                             'Weighted Pull-Up',
  'Barbell Bent-over Row':              'Barbell Row (Pronated)',
  'Barbell Bicep Curl':                 'Barbell Curl',
  'Barbell Romanian Deadlift':          'Romanian Deadlift',
  'Barbell Close Grip Bench Press':     'Close-Grip Bench Press',
  'Barbell Seated Calf Raise':          'Seated Calf Raise',
  'Barbell Incline Bench Press':        'Incline Barbell Press',
  'Incline Bench Press':                'Incline Barbell Press',
  'Cable Chest Fly':                    'Cable Fly (Low-to-High)',
  'Cable Seated Row':                   'Cable Row (Neutral Grip)',
  'Cable Straight-arm Pulldown':        'Straight-Arm Pulldown',
  'Cable Curl':                         'Cable Curl (Rope)',
  'Cable Lat Pulldown':                 'Cable Lat Pulldown (Wide Grip)',
  'Wide-Grip Lat Pulldown':             'Cable Lat Pulldown (Wide Grip)',
  'Lat Pulldown (Wide)':                'Cable Lat Pulldown (Wide Grip)',
  'Machine Chest-supported Row':        'Dumbbell Chest-Supported Row',
  'Chest-Supported Row':                'Dumbbell Chest-Supported Row',
  'Machine Leg Press':                  'Leg Press',
  'Machine Standing Calf Raise':        'Standing Calf Raise',
  'Lying Leg Curl':                     'Machine Leg Curl',
  'Leg Extension':                      'Machine Leg Extension',
  'Dumbbell Incline Press':             'Incline Dumbbell Press',
  'Dumbbell Overhead Tricep Extension': 'Overhead Tricep Extension',
  'Tricep Extension (DB)':              'Overhead Tricep Extension',
  'Tricep Pushdown':                    'Cable Tricep Pushdown',
  'Dumbbell Goblet Squat':              'Goblet Squat (Tempo)',
  'Bent-Over Rear Delt Raise':          'Dumbbell Rear Delt Fly',
  'Dips (Weighted)':                    'Parallel Bar Dip',
  'Tricep Dip':                         'Parallel Bar Dip',
  'Dumbbell Row':                       'Dumbbell Single-Arm Row',
  'Overhead Press (Seated DB)':         'Seated Dumbbell Shoulder Press',
  'Seated DB Shoulder Press':           'Seated Dumbbell Shoulder Press',
  'Back Squat':                         'Barbell Back Squat',
  'Nordic Hamstring Curl':              'Nordic Curl',
  // PHAT — Pendlay row is a sub-variant of barbell row; aggregate under one canonical
  'Barbell Row (Pendlay)':              'Barbell Row (Pronated)',
  'Pendlay Row':                        'Barbell Row (Pronated)',
  // Speed-day variants share PR history with the parent lift
  'Bench Press (Speed)':                'Barbell Bench Press',
  'Speed Bench (3 grips)':              'Barbell Bench Press',
  'Back Squat (Speed)':                 'Barbell Back Squat',
  'Box Squat (Speed)':                  'Barbell Back Squat',
  'Barbell Row (Speed)':                'Barbell Row (Pronated)',
  'Speed Deadlift':                     'Barbell Deadlift',
  // PHAT phrasing variants
  'Hack Squat (or Leg Press)':          'Barbell Hack Squat',
  // ── Pre-Phase-8 canonicals (kept so historical session blobs and any
  // pre-update program references continue to resolve)
  'Walking Lunge (DB)':                 'Dumbbell Walking Lunge',
  'Bulgarian Split Squat (DB)':         'Dumbbell Bulgarian Split Squat',
  'Hammer Curl (DB)':                   'Dumbbell Hammer Curl',
  'Lateral Raise (DB)':                 'Dumbbell Lateral Raise',
  'Rear Delt Fly (DB)':                 'Dumbbell Rear Delt Fly',
  'Chest-Supported Row (DB)':           'Dumbbell Chest-Supported Row',
  'Single-Arm DB Row':                  'Dumbbell Single-Arm Row',
  'Incline DB Curl':                    'Incline Dumbbell Curl',
  'Back Squat (Barbell)':               'Barbell Back Squat',
  'Deadlift (Barbell)':                 'Barbell Deadlift',
  'Overhead Press (Barbell)':           'Barbell Overhead Press',
  'Face Pull (Cable)':                  'Cable Face Pull',
  'Tricep Pushdown (Cable)':            'Cable Tricep Pushdown',
  'Skull Crusher (EZ Bar)':             'EZ Bar Skull Crusher',
  'Leg Curl (Machine)':                 'Machine Leg Curl',
  'Leg Extension (Machine)':            'Machine Leg Extension',
  'Lat Pulldown (Wide Grip)':           'Cable Lat Pulldown (Wide Grip)',
  'Hack Squat / Leg Press':             'Barbell Hack Squat',
  'Nordic Curl / Lying Leg Curl':       'Nordic Curl',
}

export function normalizeExerciseName(name) {
  return NAME_ALIASES[name] || name
}

// In-memory cache of canonical name → exercise UUID. The exercises table is
// read-only at runtime (admin-managed), so caching for the page lifetime is safe.
// `null` is cached for misses to avoid re-querying broken names.
const _exerciseIdCache = new Map()

export function _clearExerciseIdCache() {
  _exerciseIdCache.clear()
}

export async function resolveExerciseId(rawName) {
  if (!rawName) return null
  const canonical = normalizeExerciseName(rawName)
  if (_exerciseIdCache.has(canonical)) return _exerciseIdCache.get(canonical)

  const { data, error } = await supabase
    .from('exercises')
    .select('id')
    .eq('name', canonical)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('[resolveExerciseId] query failed for', canonical, error)
    return null
  }
  const id = data?.id ?? null
  _exerciseIdCache.set(canonical, id)
  return id
}

export async function resolveAllExerciseIds(rawNames) {
  const result = new Map()
  const canonicalByRaw = new Map()
  const toFetch = new Set()

  for (const raw of rawNames) {
    if (!raw) { result.set(raw, null); continue }
    const canonical = normalizeExerciseName(raw)
    canonicalByRaw.set(raw, canonical)
    if (_exerciseIdCache.has(canonical)) {
      result.set(raw, _exerciseIdCache.get(canonical))
    } else {
      toFetch.add(canonical)
    }
  }

  if (toFetch.size > 0) {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name')
      .in('name', Array.from(toFetch))
      .eq('is_active', true)

    if (error) {
      console.error('[resolveAllExerciseIds] query failed:', error)
      // Cache nothing on error; let caller decide
      for (const raw of rawNames) {
        if (!result.has(raw)) result.set(raw, null)
      }
      return result
    }

    const idByCanonical = new Map((data ?? []).map(r => [r.name, r.id]))
    for (const canonical of toFetch) {
      const id = idByCanonical.get(canonical) ?? null
      _exerciseIdCache.set(canonical, id)
    }
    for (const raw of rawNames) {
      if (!result.has(raw)) {
        const canonical = canonicalByRaw.get(raw)
        result.set(raw, idByCanonical.get(canonical) ?? null)
      }
    }
  }

  return result
}


export async function migrateExerciseNames(supabase) {
  console.log('[migrate] Loading all sessions...')
  const { data: rows, error } = await supabase
    .from('sessions')
    .select('id, data')
    .order('created_at', { ascending: false })

  if (error) { console.error('[migrate] Load error', error); return }

  let updated = 0, unchanged = 0
  for (const row of rows) {
    const s = row.data
    if (!s?.exercises) { unchanged++; continue }

    let changed = false
    const normalizedExercises = s.exercises.map(ex => {
      const canonical = normalizeExerciseName(ex.name)
      if (canonical !== ex.name) { changed = true; return { ...ex, name: canonical } }
      return ex
    })

    if (!changed) { unchanged++; continue }

    const { error: patchErr } = await supabase
      .from('sessions')
      .update({ data: { ...s, exercises: normalizedExercises } })
      .eq('id', row.id)

    if (patchErr) console.error(`[migrate] PATCH failed for ${row.id}:`, patchErr)
    else updated++
  }
  console.log(`[migrate] Done. ${updated} updated, ${unchanged} unchanged.`)
}
