// Resolves exercise fields that vary per macrocycle position.
//
// Two new shapes were introduced in Phase 7 alongside the load-prescription
// engine from Phase 5:
//
// 1. Week-indexed string sets / RIR (RP Hypertrophy):
//      sets: '3|4|5|6|2'       — set count for weeks 1..5
//      rirByWeek: '3|2|1|1|5'  — RIR string per week
//
// 2. Per-week loadPattern (Tactical Barbell, Conjugate DE wave):
//      loadPattern: { inputId, byWeek: [[wk1 sets...], [wk2 sets...], ...] }
//    The number of working sets follows the byWeek entry's length, which
//    can also vary per week.
//
// 3. Rotating exercise variant (Conjugate ME):
//      rotationInputId: 'me-lower-rotation'
//      rotationOptions: { 'box-squat': { name, cues, ... }, ... }
//    Display swaps based on userInputs[rotationInputId].

// Returns the working-set count for `exercise` at `weekInMeso` (1-indexed).
// Falls back to a numeric `exercise.sets` for the resistance-style baseline.
export function resolveSetCount(exercise, weekInMeso = 1) {
  if (!exercise) return 0
  const idx = Math.max(0, weekInMeso - 1)

  // RP-style week-indexed string
  if (typeof exercise.sets === 'string' && exercise.sets.includes('|')) {
    const parts = exercise.sets.split('|')
    const v = parts[Math.min(idx, parts.length - 1)]
    const n = parseInt(v, 10)
    return isNaN(n) ? 0 : n
  }

  // TB / Conjugate per-week loadPattern
  if (Array.isArray(exercise.loadPattern?.byWeek)) {
    const wk = exercise.loadPattern.byWeek
    const arr = wk[Math.min(idx, wk.length - 1)]
    return arr?.length ?? 0
  }

  // Phase 5 flat loadPattern: count is sets.length
  if (Array.isArray(exercise.loadPattern?.sets)) {
    return exercise.loadPattern.sets.length
  }

  const n = Number(exercise.sets)
  return isFinite(n) ? n : 0
}

// Returns the RIR target for `exercise` at `weekInMeso` as a string ("3",
// "0–1") or null. RP uses `rirByWeek: '3|2|1|1|5'`; older programs use a
// scalar `rir` (number or string). Returns null if neither is set.
export function resolveRIR(exercise, weekInMeso = 1) {
  if (!exercise) return null
  const idx = Math.max(0, weekInMeso - 1)
  if (typeof exercise.rirByWeek === 'string' && exercise.rirByWeek.length) {
    const parts = exercise.rirByWeek.split('|')
    return parts[Math.min(idx, parts.length - 1)] ?? null
  }
  if (exercise.rir != null) return String(exercise.rir)
  return null
}

// Resolves the rotating display fields for an exercise (Conjugate ME). For
// non-rotating exercises returns the raw exercise's name/cues/notes.
export function resolveExerciseDisplay(exercise, inputs) {
  if (!exercise) return { name: '', cues: null, notes: null }
  if (!exercise.rotationInputId || !exercise.rotationOptions) {
    return { name: exercise.name, cues: exercise.cues ?? null, notes: exercise.notes ?? null }
  }
  const selected = inputs?.[exercise.rotationInputId]
  const optionKeys = Object.keys(exercise.rotationOptions)
  const opt = exercise.rotationOptions[selected] ?? exercise.rotationOptions[optionKeys[0]]
  if (!opt) {
    return { name: exercise.name ?? '', cues: null, notes: exercise.notes ?? null }
  }
  return {
    name: opt.name,
    cues: opt.cues ?? null,
    notes: opt.notes ?? exercise.notes ?? null,
  }
}
