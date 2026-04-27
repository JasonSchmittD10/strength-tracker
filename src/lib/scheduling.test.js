import { describe, it, expect } from 'vitest'
import { PROGRAMS } from './programs'
import {
  resolveScheduledSession,
  resolveMacroPosition,
  getDayOfWeekIndex,
  getMesoForWeek,
} from './scheduling'

// Helper: make a config row-like object pinned to a known start date.
const cfg = (programId, startedAt) => ({
  id: 'cfg-1',
  program_id: programId,
  started_at: startedAt,
  ended_at: null,
  custom_pattern: null,
})

const phat = PROGRAMS['phat']
const ppl = PROGRAMS['ppl-x2']
const program531 = PROGRAMS['531']
const phul = PROGRAMS['phul']
const gvt = PROGRAMS['gvt-6wk']

describe('getDayOfWeekIndex', () => {
  it('Monday (start=Mon) → 0', () => {
    // 2026-04-27 is a Monday
    expect(getDayOfWeekIndex(new Date('2026-04-27T12:00:00'), 1)).toBe(0)
  })
  it('Sunday (start=Mon) → 6', () => {
    expect(getDayOfWeekIndex(new Date('2026-04-26T12:00:00'), 1)).toBe(6)
  })
  it('Sunday (start=Sun) → 0', () => {
    expect(getDayOfWeekIndex(new Date('2026-04-26T12:00:00'), 0)).toBe(0)
  })
})

describe('resolveScheduledSession — calendar programs', () => {
  it('PHAT on Monday returns Upper Power', () => {
    const config = cfg('phat', '2026-04-27') // Monday
    const r = resolveScheduledSession(new Date('2026-04-27T12:00:00'), config, phat)
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('upper-power')
  })

  it('PHAT on Wednesday returns rest', () => {
    const config = cfg('phat', '2026-04-27')
    const r = resolveScheduledSession(new Date('2026-04-29T12:00:00'), config, phat)
    expect(r).toEqual({ type: 'rest' })
  })

  it('PHAT on Saturday returns Chest & Arms', () => {
    const config = cfg('phat', '2026-04-27')
    const r = resolveScheduledSession(new Date('2026-05-02T12:00:00'), config, phat)
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('chest-arms-hyp')
  })

  it('PPL×2 on Sunday returns Legs B', () => {
    const config = cfg('ppl-x2', '2026-04-27')
    const r = resolveScheduledSession(new Date('2026-05-03T12:00:00'), config, ppl) // Sunday
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('legs-b')
  })

  it('PHUL on Wednesday returns rest', () => {
    const config = cfg('phul', '2026-04-27')
    const r = resolveScheduledSession(new Date('2026-04-29T12:00:00'), config, phul)
    expect(r.type).toBe('rest')
  })
})

describe('resolveScheduledSession — 5/3/1 weeklyPatterns (week-aware)', () => {
  it('week 1 Monday returns squat-w1', () => {
    const config = cfg('531', '2026-04-27') // Mon, week 1
    const r = resolveScheduledSession(new Date('2026-04-27T12:00:00'), config, program531)
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('squat-w1')
  })

  it('week 2 Monday returns squat-w2 (not squat-w1)', () => {
    const config = cfg('531', '2026-04-27')
    const r = resolveScheduledSession(new Date('2026-05-04T12:00:00'), config, program531) // 7 days later
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('squat-w2')
  })

  it('week 4 (deload) Tuesday returns bench-w4', () => {
    const config = cfg('531', '2026-04-27')
    const r = resolveScheduledSession(new Date('2026-05-19T12:00:00'), config, program531) // 22 days = wk4 Tue
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('bench-w4')
  })
})

describe('resolveScheduledSession — overrides', () => {
  it('skip override returns rest with skipped: true', () => {
    const config = cfg('phat', '2026-04-27')
    const overrides = [{ date: '2026-04-27', override_type: 'skip' }]
    const r = resolveScheduledSession(new Date('2026-04-27T12:00:00'), config, phat, overrides)
    expect(r).toEqual({ type: 'rest', skipped: true })
  })

  it('swap override returns the swapped session', () => {
    const config = cfg('phat', '2026-04-27')
    const overrides = [{
      date: '2026-04-27',
      override_type: 'swap',
      new_session_id: 'lower-hyp',
    }]
    const r = resolveScheduledSession(new Date('2026-04-27T12:00:00'), config, phat, overrides)
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('lower-hyp')
  })

  it('override only applies to the matching date', () => {
    const config = cfg('phat', '2026-04-27')
    const overrides = [{ date: '2026-04-28', override_type: 'skip' }]
    const r = resolveScheduledSession(new Date('2026-04-27T12:00:00'), config, phat, overrides)
    // Monday should still resolve to Upper Power
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('upper-power')
  })

  it('skip override on a scheduled session day → rest with skipped: true', () => {
    const config = cfg('phat', '2026-04-27')
    // Tuesday is normally Lower Power
    const overrides = [{ date: '2026-04-28', override_type: 'skip', original_session_id: 'lower-power' }]
    const r = resolveScheduledSession(new Date('2026-04-28T12:00:00'), config, phat, overrides)
    expect(r).toEqual({ type: 'rest', skipped: true })
  })

  it('train-anyway: swap override on a normally-rest day returns the chosen session', () => {
    const config = cfg('phat', '2026-04-27')
    // Wednesday is rest in PHAT pattern. With a swap override, return the chosen session.
    const overrides = [{
      date: '2026-04-29',
      override_type: 'swap',
      original_session_id: null,
      new_session_id: 'lower-hyp',
    }]
    const r = resolveScheduledSession(new Date('2026-04-29T12:00:00'), config, phat, overrides)
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('lower-hyp')
  })

  it('multiple overrides for different dates: only today\'s applies', () => {
    const config = cfg('phat', '2026-04-27')
    const overrides = [
      { date: '2026-04-27', override_type: 'skip', original_session_id: 'upper-power' },
      { date: '2026-04-28', override_type: 'swap', original_session_id: 'lower-power', new_session_id: 'chest-arms-hyp' },
      { date: '2026-04-29', override_type: 'skip' },
    ]
    // Today (Monday) gets the skip
    const monday = resolveScheduledSession(new Date('2026-04-27T12:00:00'), config, phat, overrides)
    expect(monday).toEqual({ type: 'rest', skipped: true })
    // Tuesday gets the swap
    const tuesday = resolveScheduledSession(new Date('2026-04-28T12:00:00'), config, phat, overrides)
    expect(tuesday.type).toBe('session')
    expect(tuesday.session.id).toBe('chest-arms-hyp')
    // Wednesday (already a rest day) gets the skip with skipped flag
    const wednesday = resolveScheduledSession(new Date('2026-04-29T12:00:00'), config, phat, overrides)
    expect(wednesday).toEqual({ type: 'rest', skipped: true })
  })
})

describe('resolveScheduledSession — one-shot completion', () => {
  it('GVT past 6 weeks returns { type: "completed" }', () => {
    const config = cfg('gvt-6wk', '2026-04-27')
    // 6 weeks * 7 = 42 days. Day 42 is past the program.
    const r = resolveScheduledSession(new Date('2026-06-08T12:00:00'), config, gvt)
    expect(r).toEqual({ type: 'completed' })
  })

  it('GVT in week 6 still returns a session', () => {
    const config = cfg('gvt-6wk', '2026-04-27')
    // Day 35 = start of week 6 (Mon). Pattern starts with gvt-chest-back.
    const r = resolveScheduledSession(new Date('2026-06-01T12:00:00'), config, gvt)
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('gvt-chest-back')
  })
})

describe('resolveScheduledSession — custom_pattern', () => {
  it('custom_pattern overrides program.microcycle.pattern', () => {
    const config = {
      ...cfg('phat', '2026-04-27'),
      custom_pattern: ['lower-hyp', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest'],
    }
    const r = resolveScheduledSession(new Date('2026-04-27T12:00:00'), config, phat)
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('lower-hyp')
  })
})

describe('resolveScheduledSession — rotation programs', () => {
  // Construct a synthetic rotation program for testing (no current programs are rotation)
  const rotationProgram = {
    id: 'rot',
    name: 'Rotation Test',
    macrocycle: {
      name: 'Cycle',
      mesocycles: [{ id: 'r-meso', name: 'Cycle', weeks: 4, deloadWeek: null }],
      repeatStrategy: 'progress-and-repeat',
    },
    microcycle: { type: 'rotation', pattern: ['a', 'b', 'c'] },
    sessions: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ],
  }

  it('rotationCount = 0 returns first session in pattern', () => {
    const config = cfg('rot', '2026-04-27')
    const r = resolveScheduledSession(new Date('2026-04-27T12:00:00'), config, rotationProgram, [], { rotationCount: 0 })
    expect(r.type).toBe('session')
    expect(r.session.id).toBe('a')
  })

  it('rotationCount = 4 wraps around to second session', () => {
    const config = cfg('rot', '2026-04-27')
    const r = resolveScheduledSession(new Date('2026-04-27T12:00:00'), config, rotationProgram, [], { rotationCount: 4 })
    expect(r.session.id).toBe('b')
  })
})

describe('resolveMacroPosition', () => {
  it('PHAT day 0 → block 1, week 1, weekInMeso 1', () => {
    const config = cfg('phat', '2026-04-27')
    const p = resolveMacroPosition(new Date('2026-04-27T12:00:00'), config, phat)
    expect(p.blockNumber).toBe(1)
    expect(p.weekInBlock).toBe(1)
    expect(p.weekInMeso).toBe(1)
    expect(p.isDeload).toBe(false)
    expect(p.weekLabel).toBe('Foundation')
  })

  it('PHAT week 5 = block 2, week 1 of meso', () => {
    const config = cfg('phat', '2026-04-27')
    // Day 28 = start of week 5 (a new block)
    const p = resolveMacroPosition(new Date('2026-05-25T12:00:00'), config, phat)
    expect(p.blockNumber).toBe(2)
    expect(p.weekInBlock).toBe(1)
    expect(p.weekInMeso).toBe(1)
    expect(p.weekLabel).toBe('Foundation')
  })

  it('PHAT week 4 is the deload week', () => {
    const config = cfg('phat', '2026-04-27')
    // Day 21 = Monday of week 4
    const p = resolveMacroPosition(new Date('2026-05-18T12:00:00'), config, phat)
    expect(p.weekInBlock).toBe(4)
    expect(p.isDeload).toBe(true)
    expect(p.weekLabel).toBe('Deload')
  })

  it('GVT week 3 = mesoId gvt-625, weekInMeso 1', () => {
    const config = cfg('gvt-6wk', '2026-04-27')
    // Day 14 = start of week 3 → second meso
    const p = resolveMacroPosition(new Date('2026-05-11T12:00:00'), config, gvt)
    expect(p.mesoId).toBe('gvt-625')
    expect(p.weekInMeso).toBe(1)
    expect(p.weekInBlock).toBe(3)
  })

  it('GVT past 6 weeks → completed', () => {
    const config = cfg('gvt-6wk', '2026-04-27')
    const p = resolveMacroPosition(new Date('2026-06-08T12:00:00'), config, gvt)
    expect(p.completed).toBe(true)
  })

  it('returns null before started_at', () => {
    const config = cfg('phat', '2026-04-27')
    const p = resolveMacroPosition(new Date('2026-04-26T12:00:00'), config, phat)
    expect(p).toBeNull()
  })
})

describe('getMesoForWeek (multi-meso)', () => {
  it('GVT week 1 → 60% Phase, weekInMeso 1', () => {
    const r = getMesoForWeek(gvt, 1)
    expect(r.meso.id).toBe('gvt-60')
    expect(r.weekInMeso).toBe(1)
  })
  it('GVT week 4 → 62.5% Phase, weekInMeso 2', () => {
    const r = getMesoForWeek(gvt, 4)
    expect(r.meso.id).toBe('gvt-625')
    expect(r.weekInMeso).toBe(2)
  })
  it('GVT week 6 → 65% Phase, weekInMeso 2', () => {
    const r = getMesoForWeek(gvt, 6)
    expect(r.meso.id).toBe('gvt-65')
    expect(r.weekInMeso).toBe(2)
  })
})
