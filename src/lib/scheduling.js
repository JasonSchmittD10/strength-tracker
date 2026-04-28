// Scheduling engine for the periodization system.
//
// Pure functions (no side effects) for resolving today's session and the user's
// position within a program's macrocycle. Async helpers query Supabase for
// rotation-program completion counts and per-date overrides.
//
// See docs/PROGRAMMING_ENGINE_PLAN.md §§3.3–3.4 for the algorithms.
//
// The async helpers below dynamically import `@/lib/supabase` so that this
// module can be unit-tested without env vars set.

const DAY_MS = 86_400_000

// ─── Date helpers ───────────────────────────────────────────────────────────

function toDate(d) {
  if (d instanceof Date) return d
  if (typeof d === 'string') return new Date(d + (d.length === 10 ? 'T00:00:00' : ''))
  return new Date(d)
}

function startOfDay(d) {
  const x = toDate(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function ymd(d) {
  const x = toDate(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Public helpers ─────────────────────────────────────────────────────────

// Returns 0–6 where 0 = first day of the user's week.
// Matches JS Date.getDay() shifted by weekStartDay (0 = Sun, 1 = Mon, ...).
export function getDayOfWeekIndex(date, weekStartDay = 1) {
  const d = toDate(date)
  return (d.getDay() - weekStartDay + 7) % 7
}

// Total weeks across all mesocycles in the macrocycle.
export function getWeeksInMacrocycle(program) {
  return program.macrocycle.mesocycles.reduce((sum, m) => sum + m.weeks, 0)
}

// Given a 1-indexed week number within a macrocycle block, return the meso
// it falls into and the 1-indexed week within that meso.
export function getMesoForWeek(program, weekInMacro) {
  let cum = 0
  for (let i = 0; i < program.macrocycle.mesocycles.length; i++) {
    const meso = program.macrocycle.mesocycles[i]
    if (weekInMacro <= cum + meso.weeks) {
      const weekInMeso = weekInMacro - cum
      const isDeload = meso.deloadWeek === weekInMeso
      const weekLabel = meso.weekLabels?.[weekInMeso - 1]
        ?? (isDeload ? 'Deload' : meso.name)
      return { meso, mesoIndex: i, weekInMeso, isDeload, weekLabel }
    }
    cum += meso.weeks
  }
  return null
}

// Per-week phase label (used by JourneyBlocks etc. that still want a string per week).
export function getPhaseLabelForWeek(program, weekInBlock) {
  return getMesoForWeek(program, weekInBlock)?.weekLabel ?? `Week ${weekInBlock}`
}

// Derive the 7-element day → sessionId|null array for a given week.
// Replaces the old `program.weekSchedule` field. For weeklyPatterns programs,
// pass `weekInMeso` to get the right week's pattern.
export function getWeekSchedule(program, weekInMeso = 1) {
  const m = program.microcycle
  if (m.type === 'rotation') return null
  const pattern = m.weeklyPatterns
    ? (m.weeklyPatterns[weekInMeso - 1] ?? m.weeklyPatterns[0])
    : m.pattern
  if (!pattern) return null
  return pattern.map(s => (s === 'rest' || s == null) ? null : s)
}

// Sessions per week derived from microcycle.pattern (for rotation, the rotation length).
export function getSessionsPerWeek(program) {
  const m = program.microcycle
  if (m.type === 'rotation') {
    return (m.pattern || []).filter(s => s !== 'rest').length
  }
  if (m.weeklyPatterns?.length) {
    return m.weeklyPatterns[0].filter(s => s !== 'rest').length
  }
  return (m.pattern || []).filter(s => s !== 'rest').length
}

// ─── Macrocycle position ───────────────────────────────────────────────────

// Resolves the user's macrocycle position for `date` given an active config.
// Returns null if config or program missing or date is before started_at.
// Returns { completed: true, ... } if a one-shot program has run its course.
export function resolveMacroPosition(date, config, program) {
  if (!config || !program) return null
  const start = startOfDay(config.started_at)
  const today = startOfDay(date)
  const days = Math.floor((today - start) / DAY_MS)
  if (days < 0) return null

  const weekNumber = Math.floor(days / 7) // 0-indexed
  const weeksInMacro = getWeeksInMacrocycle(program)
  if (weeksInMacro <= 0) return null

  if (program.macrocycle.repeatStrategy === 'one-shot' && weekNumber >= weeksInMacro) {
    return {
      mesoId: null,
      mesoIndex: null,
      mesoName: null,
      weekInMeso: 0,
      weeksInMeso: 0,
      isDeload: false,
      blockNumber: 1,
      weekInBlock: weeksInMacro,
      weeksInBlock: weeksInMacro,
      weekLabel: null,
      completed: true,
    }
  }

  const weekInBlock = (weekNumber % weeksInMacro) + 1 // 1-indexed
  const blockNumber = Math.floor(weekNumber / weeksInMacro) + 1
  const lookup = getMesoForWeek(program, weekInBlock)

  return {
    mesoId: lookup.meso.id,
    mesoIndex: lookup.mesoIndex,
    mesoName: lookup.meso.name,
    weekInMeso: lookup.weekInMeso,
    weeksInMeso: lookup.meso.weeks,
    isDeload: lookup.isDeload,
    blockNumber,
    weekInBlock,
    weeksInBlock: weeksInMacro,
    weekLabel: lookup.weekLabel,
    completed: false,
  }
}

// ─── Session resolution ────────────────────────────────────────────────────

// Resolves the session scheduled for `date` given config, program, and any
// per-date overrides. Pure function; no DB calls.
//
// Return shape:
//   { type: 'session', session }                — there is a session today
//   { type: 'rest' }                            — rest day per the pattern
//   { type: 'rest', skipped: true }             — explicit skip override
//   { type: 'completed' }                       — one-shot program is done
//   null                                        — no active config / before start
//
// opts:
//   weekStartDay  — user pref (0..6); default 1 (Mon)
//   rotationCount — # of completed sessions for rotation programs; default 0
export function resolveScheduledSession(date, config, program, overrides = [], opts = {}) {
  if (!config || !program) return null
  const { weekStartDay = 1, rotationCount = 0 } = opts

  // Per-date overrides win
  const dateStr = ymd(date)
  const override = overrides.find(o => o.date === dateStr)
  if (override?.override_type === 'skip') return { type: 'rest', skipped: true }
  if (override?.override_type === 'swap') {
    const session = program.sessions.find(s => s.id === override.new_session_id)
    return session ? { type: 'session', session } : { type: 'rest' }
  }
  if (override?.override_type === 'reschedule') return null

  const macroPos = resolveMacroPosition(date, config, program)
  if (macroPos == null) return null
  if (macroPos.completed) return { type: 'completed' }

  const m = program.microcycle

  // Rotation programs: pattern indexed by completed-session count
  if (m.type === 'rotation') {
    const pattern = (config.custom_pattern && config.custom_pattern.length)
      ? config.custom_pattern
      : m.pattern
    if (!pattern?.length) return { type: 'rest' }
    const sessionId = pattern[rotationCount % pattern.length]
    if (sessionId == null || sessionId === 'rest') return { type: 'rest' }
    const session = program.sessions.find(s => s.id === sessionId)
    return session ? { type: 'session', session } : { type: 'rest' }
  }

  // Calendar programs: day-of-week into the right week's pattern
  const dayIdx = getDayOfWeekIndex(date, weekStartDay)
  const pattern = m.weeklyPatterns
    ? (m.weeklyPatterns[macroPos.weekInMeso - 1] ?? m.weeklyPatterns[0])
    : ((config.custom_pattern && config.custom_pattern.length) ? config.custom_pattern : m.pattern)
  if (!pattern?.length) return { type: 'rest' }
  const sessionId = pattern[dayIdx]
  if (sessionId == null || sessionId === 'rest') return { type: 'rest' }
  const session = program.sessions.find(s => s.id === sessionId)
  return session ? { type: 'session', session } : { type: 'rest' }
}

// ─── DB helpers ────────────────────────────────────────────────────────────

// Counts completed sessions logged against the given config (rotation programs only).
// Reads from both the legacy `sessions` (JSONB) and the new `workout_sessions`
// (program metadata in `notes` as JSON) during the cutover transition.
export async function countCompletedSessions(userId, programConfigId, supabaseClient) {
  if (!userId || !programConfigId) return 0
  const client = supabaseClient ?? (await import('@/lib/supabase')).supabase
  const { data: cfg, error: cfgErr } = await client
    .from('user_program_configs')
    .select('started_at')
    .eq('id', programConfigId)
    .maybeSingle()
  if (cfgErr || !cfg) return 0

  // Legacy sessions table: filter via JSONB selectors.
  const { count: legacyCount, error: legacyErr } = await client
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('data->>date', cfg.started_at)
    .not('data->>program_session_id', 'is', null)
  if (legacyErr) return 0

  // New normalized table: program metadata is JSON in notes; parse in JS.
  const { data: newRows, error: newErr } = await client
    .from('workout_sessions')
    .select('notes')
    .eq('user_id', userId)
    .gte('session_date', cfg.started_at)
  if (newErr) return legacyCount ?? 0

  const newCount = (newRows ?? []).reduce((n, r) => {
    if (!r.notes) return n
    try {
      const meta = JSON.parse(r.notes)
      return meta?.program_session_id != null ? n + 1 : n
    } catch { return n }
  }, 0)

  return (legacyCount ?? 0) + newCount
}

// Loads any per-date overrides for the given config in a date range. Phase 4
// will populate the table; for now this just queries a (possibly empty) table.
export async function fetchOverrides(programConfigId, fromDate, toDate, supabaseClient) {
  if (!programConfigId) return []
  const client = supabaseClient ?? (await import('@/lib/supabase')).supabase
  const { data, error } = await client
    .from('scheduled_session_overrides')
    .select('*')
    .eq('program_config_id', programConfigId)
    .gte('date', ymd(fromDate))
    .lte('date', ymd(toDate))
  if (error) return []
  return data ?? []
}
