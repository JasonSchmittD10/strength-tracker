import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeExerciseName, resolveAllExerciseIds } from '@/lib/exercises'
import { epley, totalVolume } from '@/lib/utils'

// PostgREST nested-select for hydrating a workout_sessions row back into the
// shape the UI consumes. Exported for SessionDetailSheet's per-row fetch.
export const WORKOUT_SESSION_SELECT = `
  id, session_date, name, bodyweight, notes, created_at,
  workout_exercises (
    id, exercise_order, notes,
    exercises ( id, name ),
    sets ( id, set_number, is_warmup, weight, reps, rpe, tempo )
  )
`

// Reshape a normalized workout_sessions row (with nested exercises + sets)
// into the in-memory shape the UI consumes. Only completed sets are persisted,
// so every set is rehydrated as completed: true. Program metadata rides
// along in `notes` as JSON.
export function normalizeNewSession(row) {
  let meta = {}
  try { meta = row.notes ? JSON.parse(row.notes) : {} } catch {}

  const exercises = (row.workout_exercises ?? [])
    .slice()
    .sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0))
    .map(we => {
      let exMeta = {}
      try { exMeta = we.notes ? JSON.parse(we.notes) : {} } catch {}
      const sets = (we.sets ?? [])
        .slice()
        .sort((a, b) => (a.set_number ?? 0) - (b.set_number ?? 0))
        .map(s => ({
          setNumber: s.set_number,
          weight: s.weight != null ? parseFloat(s.weight) : 0,
          reps: s.reps ?? 0,
          rpe: s.rpe != null ? parseFloat(s.rpe) : null,
          completed: true,
        }))
      return {
        name: we.exercises?.name ?? '',
        supersetId: exMeta.supersetId ?? null,
        sets,
      }
    })

  return {
    _id: row.id,
    sessionId: meta.sessionId ?? null,
    sessionName: row.name ?? meta.sessionName ?? 'Session',
    date: row.session_date,
    duration: meta.durationSeconds ?? 0,
    durationSeconds: meta.durationSeconds ?? 0,
    notes: '',
    tag: meta.tag ?? null,
    tagLabel: meta.tagLabel ?? null,
    programId: meta.programId ?? null,
    program_session_id: meta.program_session_id ?? null,
    program_config_id: meta.program_config_id ?? null,
    scheduled_date: meta.scheduled_date ?? null,
    was_swapped: meta.was_swapped ?? false,
    session_type: meta.session_type ?? 'resistance',
    startedAt: meta.startedAt ?? null,
    completedAt: meta.completedAt ?? null,
    totalVolume: meta.totalVolume ?? null,
    modality: meta.modality,
    conditioning_summary: meta.conditioning_summary,
    exercises,
  }
}

async function fetchSessions() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(WORKOUT_SESSION_SELECT)
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeNewSession)
}

// Build the JSON metadata blob stored in workout_sessions.notes. The normalized
// schema only has columns for {user_id, session_date, name, bodyweight, notes},
// so program metadata (program_session_id, tag, conditioning_summary, etc.)
// rides along here. Read by fetchSessions in stage 3.3.
function buildSessionNotesBlob(session) {
  return JSON.stringify({
    sessionId: session.sessionId ?? null,
    tag: session.tag ?? null,
    tagLabel: session.tagLabel ?? null,
    programId: session.programId ?? null,
    program_session_id: session.program_session_id ?? null,
    program_config_id: session.program_config_id ?? null,
    scheduled_date: session.scheduled_date ?? null,
    was_swapped: session.was_swapped ?? false,
    session_type: session.session_type ?? 'resistance',
    startedAt: session.startedAt ?? null,
    completedAt: session.completedAt ?? null,
    durationSeconds: session.durationSeconds ?? session.duration ?? 0,
    totalVolume: session.totalVolume ?? null,
    ...(session.session_type === 'conditioning'
      ? { modality: session.modality ?? null, conditioning_summary: session.conditioning_summary ?? null }
      : {}),
  })
}

async function saveSession(session) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const exercises = session.exercises ?? []
  const exerciseNames = exercises.map(e => e.name)

  // 1. Resolve all names up front. Fail fast on any miss — no partial writes.
  const idMap = await resolveAllExerciseIds(exerciseNames)
  const unresolved = exerciseNames.filter(n => !idMap.get(n))
  if (unresolved.length > 0) {
    throw new Error(
      `Cannot save workout: ${unresolved.length} exercise${unresolved.length === 1 ? '' : 's'} not in library — ${unresolved.join(', ')}`
    )
  }

  // 2. Insert the parent workout_sessions row.
  const sessionDate = session.date || session.scheduled_date || new Date().toISOString().split('T')[0]
  const { data: parent, error: parentErr } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      session_date: sessionDate,
      name: session.sessionName ?? null,
      notes: buildSessionNotesBlob(session),
    })
    .select('id')
    .single()
  if (parentErr) throw parentErr
  const sessionId = parent.id

  // 3. Insert children. On any failure, delete the parent (cascades to children).
  try {
    if (exercises.length > 0) {
      const exerciseRows = exercises.map((ex, i) => ({
        session_id: sessionId,
        exercise_id: idMap.get(ex.name),
        exercise_order: i + 1,
        notes: ex.supersetId ? JSON.stringify({ supersetId: ex.supersetId }) : null,
      }))
      const { data: insertedExercises, error: exErr } = await supabase
        .from('workout_exercises')
        .insert(exerciseRows)
        .select('id')
      if (exErr) throw exErr

      const setRows = []
      exercises.forEach((ex, i) => {
        const workoutExerciseId = insertedExercises[i].id
        ;(ex.sets ?? [])
          .filter(s => s.completed !== false) // legacy: undefined means completed
          .forEach(s => {
            setRows.push({
              workout_exercise_id: workoutExerciseId,
              set_number: s.setNumber,
              is_warmup: false,
              weight: s.weight ?? null,
              reps: s.reps ?? null,
              rpe: s.rpe ?? null,
            })
          })
      })
      if (setRows.length > 0) {
        const { error: setsErr } = await supabase.from('sets').insert(setRows)
        if (setsErr) throw setsErr
      }
    }
    return { id: sessionId }
  } catch (e) {
    // Compensating cleanup. ON DELETE CASCADE handles workout_exercises and sets.
    const { error: cleanupErr } = await supabase.from('workout_sessions').delete().eq('id', sessionId)
    if (cleanupErr) console.error('[saveSession] orphan cleanup failed for', sessionId, cleanupErr)
    throw e
  }
}

async function writeActivity({ sessionId, summary }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { console.warn('[writeActivity] no authenticated user'); return }
  const { error } = await supabase
    .from('activity')
    .insert({ user_id: user.id, session_id: sessionId, type: 'workout', summary })
  if (error) {
    console.error('[writeActivity] insert failed:', error)
  } else {
    console.log('[writeActivity] wrote activity for session', sessionId)
  }
}

// Compute PRs: for each exercise in the current session, find the best e1RM
// from completed sets, then compare against the historical best from cached sessions.
// Returns an array of PR objects.
function detectPRs(session, previousSessions) {
  // Build historical best e1RM per normalized exercise name
  const historicalBest = {}
  previousSessions.forEach(s => {
    ;(s.exercises || []).forEach(ex => {
      const key = normalizeExerciseName(ex.name)
      ;(ex.sets || []).forEach(set => {
        const e = epley(set.weight, set.reps)
        if (e && e > (historicalBest[key] ?? 0)) historicalBest[key] = e
      })
    })
  })

  // Find PRs in the current session
  const prs = []
  ;(session.exercises || []).forEach(ex => {
    const key = normalizeExerciseName(ex.name)
    let bestSet = null
    let bestE1RM = 0
    ;(ex.sets || []).filter(s => s.completed === true).forEach(s => {
      const e = epley(s.weight, s.reps)
      if (e && e > bestE1RM) { bestE1RM = e; bestSet = s }
    })
    if (bestSet && bestE1RM > (historicalBest[key] ?? 0)) {
      prs.push({
        exercise: ex.name,
        weight: parseFloat(bestSet.weight) || 0,
        reps: parseInt(bestSet.reps) || 0,
        e1RM: bestE1RM,
      })
    }
  })
  return prs
}

export function useSessions() {
  return useQuery({ queryKey: ['sessions'], queryFn: fetchSessions })
}

const MAIN_LIFTS = [
  'Barbell Bench Press',
  'Back Squat (Barbell)',
  'Romanian Deadlift',
  'Overhead Press (Barbell)',
]

export function usePRs() {
  const { data: sessions = [] } = useSessions()
  return useMemo(() => {
    const bests = {}
    for (const session of sessions) {
      for (const exercise of session.exercises ?? []) {
        const name = normalizeExerciseName(exercise.name)
        if (!MAIN_LIFTS.includes(name)) continue
        for (const set of exercise.sets ?? []) {
          if (!set.completed || !set.weight || !set.reps) continue
          const e1rm = set.weight * (1 + set.reps / 30)
          if (!bests[name] || e1rm > bests[name]) bests[name] = e1rm
        }
      }
    }
    return MAIN_LIFTS.map(name => ({ name, e1rm: bests[name] ?? null }))
  }, [sessions])
}

export function useSessionsByExercise(exerciseName) {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    select: sessions =>
      sessions
        .filter(s => s.exercises?.some(e => normalizeExerciseName(e.name) === normalizeExerciseName(exerciseName)))
        .map(s => ({
          ...s,
          exercises: s.exercises?.filter(e => normalizeExerciseName(e.name) === normalizeExerciseName(exerciseName)),
        })),
    enabled: !!exerciseName,
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      // Legacy `sessions.id` is bigint; new `workout_sessions.id` is uuid.
      // Dispatch on id shape — sending a uuid-string to the bigint column
      // throws a type error.
      const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      const table = isUuid ? 'workout_sessions' : 'sessions'
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useSaveSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (session) => {
      const saved = await saveSession(session)

      // PR detection uses cached sessions (before invalidation so previous data is still present)
      const previousSessions = queryClient.getQueryData(['sessions']) ?? []
      const prs = detectPRs(session, previousSessions)

      const summary = {
        sessionName: session.sessionName,
        programId: session.programId || 'custom',
        totalSets: (session.exercises || []).reduce(
          (n, ex) => n + (ex.sets || []).filter(s => s.completed === true).length,
          0
        ),
        totalVolume: session.totalVolume ?? totalVolume(session.exercises),
        durationSeconds: session.durationSeconds || session.duration || 0,
        prs,
        displayDate: session.completedAt || new Date().toISOString(),
      }

      try {
        await writeActivity({ sessionId: saved.id, summary })
      } catch (e) {
        console.warn('activity write failed', e)
      }

      return saved
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['program'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}
