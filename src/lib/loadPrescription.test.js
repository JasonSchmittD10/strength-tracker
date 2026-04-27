import { describe, it, expect } from 'vitest'
import { PROGRAMS } from './programs'
import { resolveMacroPosition } from './scheduling'
import { computePrescribedWeight, getSetPrescription } from './loadPrescription'

const program531 = PROGRAMS['531']
const gvt = PROGRAMS['gvt-6wk']
const phat = PROGRAMS['phat']

function findExercise(program, sessionId, exerciseName) {
  const session = program.sessions.find(s => s.id === sessionId)
  return session?.exercises.find(e => e.name === exerciseName)
}

describe('computePrescribedWeight — 5/3/1 (loadPattern)', () => {
  it('squat-w1 with TM=405 returns three sets at 65/75/85% rounded to nearest 5 lbs', () => {
    const ex = findExercise(program531, 'squat-w1', 'Back Squat (Barbell)')
    const result = computePrescribedWeight(ex, { 'squat-tm': 405 }, null, 'lbs')
    expect(result.perSet).toHaveLength(3)
    // 0.65 * 405 = 263.25 → rounds to 265 (nearest 5)
    expect(result.perSet[0].weight).toBe(265)
    expect(result.perSet[0].reps).toBe('5')
    expect(result.perSet[0].formattedWeight).toBe('265 lbs')
    // 0.75 * 405 = 303.75 → 305
    expect(result.perSet[1].weight).toBe(305)
    // 0.85 * 405 = 344.25 → 345 ; reps '5+'
    expect(result.perSet[2].weight).toBe(345)
    expect(result.perSet[2].reps).toBe('5+')
  })

  it('week 3 (5/3/1) returns 75/85/95% with 5/3/1+ reps', () => {
    const ex = findExercise(program531, 'bench-w3', 'Barbell Bench Press')
    const result = computePrescribedWeight(ex, { 'bench-tm': 200 }, null, 'lbs')
    // 0.75 * 200 = 150 → 150
    expect(result.perSet[0].weight).toBe(150)
    expect(result.perSet[0].reps).toBe('5')
    // 0.85 * 200 = 170
    expect(result.perSet[1].weight).toBe(170)
    expect(result.perSet[1].reps).toBe('3')
    // 0.95 * 200 = 190
    expect(result.perSet[2].weight).toBe(190)
    expect(result.perSet[2].reps).toBe('1+')
  })

  it('returns null when the input is missing', () => {
    const ex = findExercise(program531, 'squat-w1', 'Back Squat (Barbell)')
    expect(computePrescribedWeight(ex, {}, null, 'lbs')).toBeNull()
    expect(computePrescribedWeight(ex, { 'bench-tm': 200 }, null, 'lbs')).toBeNull()
  })

  it('getSetPrescription returns the right set or null past the end', () => {
    const ex = findExercise(program531, 'squat-w1', 'Back Squat (Barbell)')
    const inputs = { 'squat-tm': 405 }
    expect(getSetPrescription(ex, 0, inputs, null, 'lbs').weight).toBe(265)
    expect(getSetPrescription(ex, 2, inputs, null, 'lbs').weight).toBe(345)
    expect(getSetPrescription(ex, 3, inputs, null, 'lbs')).toBeNull()
  })
})

describe('computePrescribedWeight — GVT (percentByMeso)', () => {
  it('bench in meso 0 (60%) with 1RM=275 returns 165 lbs', () => {
    const ex = findExercise(gvt, 'gvt-chest-back', 'Barbell Bench Press')
    const macroPos = { mesoIndex: 0 }
    const result = computePrescribedWeight(ex, { 'bench-1rm': 275 }, macroPos, 'lbs')
    expect(result.weight).toBe(165) // 0.60 * 275 = 165
    expect(result.formattedWeight).toBe('165 lbs')
  })

  it('bench in meso 2 (65%) with 1RM=275 returns 180 lbs (178.75 → rounded)', () => {
    const ex = findExercise(gvt, 'gvt-chest-back', 'Barbell Bench Press')
    const macroPos = { mesoIndex: 2 }
    const result = computePrescribedWeight(ex, { 'bench-1rm': 275 }, macroPos, 'lbs')
    // 0.65 * 275 = 178.75 → nearest 5 = 180
    expect(result.weight).toBe(180)
    expect(result.formattedWeight).toBe('180 lbs')
  })

  it('squat in meso 1 (62.5%) with 1RM=400 returns 250 lbs', () => {
    const ex = findExercise(gvt, 'gvt-legs-abs', 'Back Squat (Barbell)')
    const result = computePrescribedWeight(ex, { 'squat-1rm': 400 }, { mesoIndex: 1 }, 'lbs')
    // 0.625 * 400 = 250
    expect(result.weight).toBe(250)
  })

  it('getSetPrescription returns the same prescription for every set on a percentOfInput exercise', () => {
    const ex = findExercise(gvt, 'gvt-chest-back', 'Barbell Bench Press')
    const inputs = { 'bench-1rm': 275 }
    const macroPos = { mesoIndex: 0 }
    expect(getSetPrescription(ex, 0, inputs, macroPos, 'lbs').weight).toBe(165)
    expect(getSetPrescription(ex, 5, inputs, macroPos, 'lbs').weight).toBe(165)
  })
})

describe('computePrescribedWeight — no-prescription paths', () => {
  it('exercise without loadPattern or percentOfInput returns null', () => {
    const ex = findExercise(program531, 'squat-w1', 'Leg Press')
    expect(computePrescribedWeight(ex, { 'squat-tm': 405 }, null, 'lbs')).toBeNull()
  })

  it('PHAT exercise returns null (program has no userInputs)', () => {
    const ex = findExercise(phat, 'upper-power', 'Barbell Bench Press')
    expect(computePrescribedWeight(ex, {}, null, 'lbs')).toBeNull()
  })

  it('null exercise returns null', () => {
    expect(computePrescribedWeight(null, {}, null, 'lbs')).toBeNull()
  })
})

describe('computePrescribedWeight — TB cluster wave (byWeek)', () => {
  const tb = PROGRAMS['tactical-barbell-operator']
  const ex = tb.sessions.find(s => s.id === 'tb-strength-a').exercises[0]

  it('week 1 returns 70/80/90% (5/5/5+) with 1RM=405', () => {
    const macroPos = { weekInMeso: 1 }
    const r = computePrescribedWeight(ex, { 'squat-1rm': 405 }, macroPos, 'lbs')
    expect(r.perSet).toHaveLength(3)
    // 0.70 * 405 = 283.5 → 285 (nearest 5)
    expect(r.perSet[0].weight).toBe(285)
    expect(r.perSet[0].reps).toBe('5')
    // 0.90 * 405 = 364.5 → 365
    expect(r.perSet[2].weight).toBe(365)
    expect(r.perSet[2].reps).toBe('5+')
  })

  it('week 3 returns 75/85/95% (5/3/1+)', () => {
    const macroPos = { weekInMeso: 3 }
    const r = computePrescribedWeight(ex, { 'squat-1rm': 405 }, macroPos, 'lbs')
    // 0.75 * 405 = 303.75 → 305
    expect(r.perSet[0].weight).toBe(305)
    expect(r.perSet[0].reps).toBe('5')
    // 0.95 * 405 = 384.75 → 385
    expect(r.perSet[2].weight).toBe(385)
    expect(r.perSet[2].reps).toBe('1+')
  })

  it('week 6 wraps back to the wk-3 pattern (75/85/95)', () => {
    const r = computePrescribedWeight(ex, { 'squat-1rm': 405 }, { weekInMeso: 6 }, 'lbs')
    expect(r.perSet[0].reps).toBe('5')
    expect(r.perSet[2].reps).toBe('1+')
  })

  it('out-of-range week clamps to last byWeek entry', () => {
    const r = computePrescribedWeight(ex, { 'squat-1rm': 405 }, { weekInMeso: 99 }, 'lbs')
    expect(r.perSet[2].reps).toBe('1+')
  })
})

describe('computePrescribedWeight — kg display rounding', () => {
  it('input stored canonically in lbs, user pref kg, rounds to nearest 2.5 kg', () => {
    // GVT bench at 60% with 1RM = 275 lbs
    // Raw: 165 lbs = 74.84 kg → nearest 2.5 kg = 75.0 kg → back to lbs = 165.35
    const ex = findExercise(gvt, 'gvt-chest-back', 'Barbell Bench Press')
    const result = computePrescribedWeight(ex, { 'bench-1rm': 275 }, { mesoIndex: 0 }, 'kg')
    // formatted display in kg
    expect(result.formattedWeight).toBe('75 kg')
    // stored value (canonical lbs) reflects the kg-rounded value
    expect(result.weight).toBeCloseTo(165.346, 1)
  })

  it('5/3/1 squat 65% of TM=180 lbs: kg pref rounds the kg, not the lbs', () => {
    // 0.65 * 180 lbs = 117 lbs = 53.07 kg → nearest 2.5 = 52.5 kg
    const ex = findExercise(program531, 'squat-w1', 'Back Squat (Barbell)')
    const result = computePrescribedWeight(ex, { 'squat-tm': 180 }, null, 'kg')
    expect(result.perSet[0].formattedWeight).toBe('52.5 kg')
  })
})
