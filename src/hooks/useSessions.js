import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeExerciseName } from '@/lib/exercises'
import { epley, totalVolume } from '@/lib/utils'

function normalizeSession(row) {
  const d = row.data
  const base = { _id: row.id }
  if (d.sessionName && d.exercises) return { ...d, ...base }
  // Legacy format
  const exercises = (d.lifts || []).map(lift => ({
    name: lift.name,
    sets: (lift.sets || []).map(s => ({ weight: s.weight ?? '', reps: s.reps ?? '', rpe: s.rpe ?? '' })),
  }))
  return {
    ...base,
    id: d.id,
    sessionId: (d.type || 'push') + '-a',
    sessionName: d.day || d.sessionName || 'Session',
    date: d.date || new Date().toISOString().split('T')[0],
    duration: d.duration || null,
    notes: d.notes || '',
    exercises,
  }
}

async function fetchSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, data, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeSession)
}

async function saveSession(session) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ data: session })
    .select()
    .single()
  if (error) throw error
  return data
}

async function writeActivity({ sessionId, summary }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase
    .from('activity')
    .insert({ user_id: user.id, session_id: sessionId, type: 'workout', summary })
  if (error) console.warn('activity write failed', error)
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
