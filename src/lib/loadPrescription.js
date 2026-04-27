// Load prescription engine.
//
// Reads a program exercise's `loadPattern` (per-set %) or `percentOfInput`
// (single % or per-meso %) plus the user's stored inputs (canonical lbs)
// and returns the prescribed weight in canonical lbs, rounded to the
// nearest gym increment in the user's display unit.

import { convertWeight, formatWeight, roundToIncrement } from './units'

const DEFAULT_UNIT = 'lbs'

// Round a canonical-lbs value to the nearest gym increment in `weightUnit`,
// returning the rounded value back in canonical lbs. Plates come in 5 lb /
// 2.5 kg pairs; rounding in the user's actual unit avoids weird display
// numbers like "229 lbs" when the user is in kg.
function roundLbsForDisplayUnit(lbs, weightUnit) {
  if (lbs == null || isNaN(lbs)) return null
  if (weightUnit === 'kg') {
    const kgRaw = convertWeight(lbs, 'lbs', 'kg')
    const kgRounded = roundToIncrement(kgRaw, 'kg')
    return convertWeight(kgRounded, 'kg', 'lbs')
  }
  return roundToIncrement(lbs, 'lbs')
}

// Returns the loadPattern's set spec array for the current week. Handles
// both Phase 5 flat `sets` and Phase 7 per-week `byWeek` shapes.
function setsForWeek(loadPattern, weekInMeso) {
  if (!loadPattern) return null
  if (Array.isArray(loadPattern.byWeek)) {
    const idx = Math.max(0, (weekInMeso ?? 1) - 1)
    return loadPattern.byWeek[Math.min(idx, loadPattern.byWeek.length - 1)] ?? null
  }
  if (Array.isArray(loadPattern.sets)) return loadPattern.sets
  return null
}

// Returns null if the exercise has no prescription.
//
// For exercises with `loadPattern`: returns an array of per-set prescriptions.
// For exercises with `percentOfInput`: returns a single prescription used for
//   every set on this exercise.
//
// Each prescription has shape:
//   { weight, formattedWeight, reps?, source: 'prescribed' }
//   weight is in canonical lbs (matches storage); formattedWeight is the
//   user-facing string in their preferred unit.
export function computePrescribedWeight(exercise, inputs, macroPosition, weightUnit = DEFAULT_UNIT) {
  if (!exercise || !inputs) return null

  // Per-set load pattern — flat (5/3/1) or per-week (TB cluster, Conjugate DE)
  if (exercise.loadPattern && (exercise.loadPattern.sets?.length || exercise.loadPattern.byWeek?.length)) {
    const lp = exercise.loadPattern
    const inputLbs = numericInput(inputs[lp.inputId])
    if (inputLbs == null) return null
    const weekSets = setsForWeek(lp, macroPosition?.weekInMeso)
    if (!weekSets?.length) return null
    const sets = weekSets.map(setSpec => {
      const rawLbs = inputLbs * setSpec.percent
      const lbs = roundLbsForDisplayUnit(rawLbs, weightUnit)
      return {
        weight: lbs,
        formattedWeight: formatWeight(lbs, weightUnit),
        reps: setSpec.reps,
        source: 'prescribed',
      }
    })
    return { perSet: sets, source: 'prescribed' }
  }

  // Single-% (or per-meso %) prescription (GVT-style)
  if (exercise.percentOfInput?.inputId) {
    const p = exercise.percentOfInput
    const inputLbs = numericInput(inputs[p.inputId])
    if (inputLbs == null) return null
    let percent = null
    if (Array.isArray(p.percentByMeso)) {
      const idx = macroPosition?.mesoIndex ?? 0
      percent = p.percentByMeso[idx] ?? p.percentByMeso[p.percentByMeso.length - 1]
    } else if (typeof p.percent === 'number') {
      percent = p.percent
    }
    if (percent == null) return null
    const rawLbs = inputLbs * percent
    const lbs = roundLbsForDisplayUnit(rawLbs, weightUnit)
    return {
      weight: lbs,
      formattedWeight: formatWeight(lbs, weightUnit),
      source: 'prescribed',
    }
  }

  return null
}

// Per-set prescription. Returns null when there is no prescription, or no
// prescription for the requested set index. setIndex is 0-based.
export function getSetPrescription(exercise, setIndex, inputs, macroPosition, weightUnit = DEFAULT_UNIT) {
  if (!exercise || !inputs) return null

  if (exercise.loadPattern && (exercise.loadPattern.sets?.length || exercise.loadPattern.byWeek?.length)) {
    const lp = exercise.loadPattern
    const weekSets = setsForWeek(lp, macroPosition?.weekInMeso)
    const setSpec = weekSets?.[setIndex]
    if (!setSpec) return null
    const inputLbs = numericInput(inputs[lp.inputId])
    if (inputLbs == null) return null
    const rawLbs = inputLbs * setSpec.percent
    const lbs = roundLbsForDisplayUnit(rawLbs, weightUnit)
    return {
      weight: lbs,
      formattedWeight: formatWeight(lbs, weightUnit),
      reps: setSpec.reps,
      source: 'prescribed',
    }
  }

  // Same prescription for every set
  if (exercise.percentOfInput?.inputId) {
    return computePrescribedWeight(exercise, inputs, macroPosition, weightUnit)
  }

  return null
}

function numericInput(v) {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(v)
  return isNaN(n) ? null : n
}
