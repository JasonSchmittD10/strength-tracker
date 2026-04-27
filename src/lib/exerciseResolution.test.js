import { describe, it, expect } from 'vitest'
import { PROGRAMS } from './programs'
import { resolveSetCount, resolveRIR, resolveExerciseDisplay } from './exerciseResolution'

const rp = PROGRAMS['rp-upper-lower']
const tb = PROGRAMS['tactical-barbell-operator']
const conj = PROGRAMS['conjugate-westside-lite']
const phat = PROGRAMS['phat']

function findExercise(program, sessionId, exerciseName) {
  const session = program.sessions.find(s => s.id === sessionId)
  return session?.exercises.find(e => e.name === exerciseName)
}

describe('resolveSetCount — week-indexed string', () => {
  const ex = findExercise(rp, 'upper-1', 'Barbell Bench Press') // sets: '3|4|5|6|2'
  it('week 1 → 3', () => expect(resolveSetCount(ex, 1)).toBe(3))
  it('week 2 → 4', () => expect(resolveSetCount(ex, 2)).toBe(4))
  it('week 4 → 6', () => expect(resolveSetCount(ex, 4)).toBe(6))
  it('week 5 (deload) → 2', () => expect(resolveSetCount(ex, 5)).toBe(2))
  it('out of range clamps to last', () => expect(resolveSetCount(ex, 99)).toBe(2))
})

describe('resolveSetCount — byWeek loadPattern', () => {
  const ex = findExercise(tb, 'tb-strength-a', 'Back Squat (Barbell)')
  it('any week → 3 sets (cluster wave is always 3 sets)', () => {
    expect(resolveSetCount(ex, 1)).toBe(3)
    expect(resolveSetCount(ex, 6)).toBe(3)
  })
})

describe('resolveSetCount — flat numeric (legacy)', () => {
  const ex = findExercise(phat, 'upper-power', 'Barbell Bench Press')
  it('returns the numeric sets value', () => {
    expect(resolveSetCount(ex, 1)).toBe(3)
  })
})

describe('resolveRIR', () => {
  const ex = findExercise(rp, 'upper-1', 'Barbell Bench Press')
  it('week 1 → "3"', () => expect(resolveRIR(ex, 1)).toBe('3'))
  it('week 4 → "1"', () => expect(resolveRIR(ex, 4)).toBe('1'))
  it('week 5 → "5"', () => expect(resolveRIR(ex, 5)).toBe('5'))
  it('exercise without RIR returns null', () => {
    const phatEx = findExercise(phat, 'upper-power', 'Barbell Bench Press')
    expect(resolveRIR(phatEx, 1)).toBeNull()
  })
})

describe('resolveExerciseDisplay — Conjugate ME rotation', () => {
  const ex = findExercise(conj, 'me-lower', 'ME Lower Lift')
  it('selected rotation returns its display name', () => {
    expect(resolveExerciseDisplay(ex, { 'me-lower-rotation': 'box-squat' }).name).toBe('Box Squat')
    expect(resolveExerciseDisplay(ex, { 'me-lower-rotation': 'good-morning' }).name).toBe('Good Morning')
  })
  it('missing selection falls back to first option', () => {
    expect(resolveExerciseDisplay(ex, {}).name).toBe('Box Squat')
    expect(resolveExerciseDisplay(ex, undefined).name).toBe('Box Squat')
  })
  it('selection with cues returns them', () => {
    const r = resolveExerciseDisplay(ex, { 'me-lower-rotation': 'pin-squat' })
    expect(r.name).toBe('Pin Squat')
    expect(r.cues).toContain('pins')
  })
  it('non-rotating exercise returns its base name', () => {
    const phatEx = findExercise(phat, 'upper-power', 'Barbell Bench Press')
    expect(resolveExerciseDisplay(phatEx, {}).name).toBe('Barbell Bench Press')
  })
})
