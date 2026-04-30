import { supabase } from '@/lib/supabase'

export const NAME_ALIASES = {
  // Push A variants
  'Barbell Overhead Press':             'Overhead Press (Barbell)',
  'Dumbbell Incline Press':             'Incline Dumbbell Press',
  'Cable Tricep Pushdown':              'Tricep Pushdown (Cable)',
  'Dumbbell Overhead Tricep Extension': 'Overhead Tricep Extension',
  // Pull A variants
  'Pull-up':                            'Weighted Pull-Up',
  'Barbell Bent-over Row':              'Barbell Row (Pronated)',
  'Machine Chest-supported Row':        'Chest-Supported Row (DB)',
  'Cable Face Pull':                    'Face Pull (Cable)',
  'Barbell Bicep Curl':                 'Barbell Curl',
  'Dumbbell Hammer Curl':               'Hammer Curl (DB)',
  // Legs A variants
  'Barbell Back Squat':                 'Back Squat (Barbell)',
  'Barbell Romanian Deadlift':          'Romanian Deadlift',
  'Machine Leg Press':                  'Leg Press',
  'Machine Leg Curl':                   'Leg Curl (Machine)',
  'Dumbbell Walking Lunge':             'Walking Lunge (DB)',
  'Machine Standing Calf Raise':        'Standing Calf Raise',
  // Push B variants
  'Barbell Incline Bench Press':        'Incline Barbell Press',
  'Cable Chest Fly':                    'Cable Fly (Low-to-High)',
  'Dumbbell Lateral Raise':             'Lateral Raise (DB)',
  'Barbell Close Grip Bench Press':     'Close-Grip Bench Press',
  'EZ Bar Skull Crusher':               'Skull Crusher (EZ Bar)',
  // Pull B variants
  'Cable Lat Pulldown':                 'Lat Pulldown (Wide Grip)',
  'Cable Seated Row':                   'Cable Row (Neutral Grip)',
  'Dumbbell Single-arm Row':            'Single-Arm DB Row',
  'Cable Straight-arm Pulldown':        'Straight-Arm Pulldown',
  'Dumbbell Incline Curl':              'Incline DB Curl',
  'Cable Curl':                         'Cable Curl (Rope)',
  // Legs B variants
  'Barbell Bulgarian Split Squat':      'Bulgarian Split Squat (DB)',
  'Barbell Hack Squat':                 'Hack Squat / Leg Press',
  'Nordic Hamstring Curl':              'Nordic Curl / Lying Leg Curl',
  'Dumbbell Goblet Squat':              'Goblet Squat (Tempo)',
  'Barbell Seated Calf Raise':          'Seated Calf Raise',
  // GVT exercise name variants
  'Chest-Supported Row':                'Chest-Supported Row (DB)',
  'Wide-Grip Lat Pulldown':             'Lat Pulldown (Wide Grip)',
  'Back Squat':                         'Back Squat (Barbell)',
  'Lying Leg Curl':                     'Leg Curl (Machine)',
  // Known freeform historical variants
  'Pull-Up':                            'Weighted Pull-Up',
  'Pull Up':                            'Weighted Pull-Up',
  'Pullup':                             'Weighted Pull-Up',
  // PHAT — Pendlay row is a sub-variant of barbell row; aggregate history under one name
  'Barbell Row (Pendlay)':              'Barbell Row (Pronated)',
  'Pendlay Row':                        'Barbell Row (Pronated)',
  // PHAT — speed-day variants share history with the parent power lift
  'Bench Press (Speed)':                'Barbell Bench Press',
  'Back Squat (Speed)':                 'Back Squat (Barbell)',
  'Barbell Row (Speed)':                'Barbell Row (Pronated)',
  // PHAT — phrasing variants used in the new program data
  'Hack Squat (or Leg Press)':          'Hack Squat / Leg Press',
  'Leg Extension':                      'Leg Extension (Machine)',
  // ── Phase 3 reconciliation: collapse program-name variants onto canonical
  // DB rows. See docs/phase-3-name-reconciliation.md for rationale.
  // Conflict-resolution overflow (where multiple program names mapped to one
  // DB row; the most-specific name became canonical and the rest alias here):
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
  // Westside speed-day variants share PR history with the parent lift.
  'Box Squat (Speed)':                  'Back Squat (Barbell)',
  'Speed Bench (3 grips)':              'Barbell Bench Press',
  'Speed Deadlift':                     'Deadlift (Barbell)',
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
