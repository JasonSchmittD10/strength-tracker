import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeExerciseName } from '@/lib/exercises'

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
  const { error } = await supabase
    .from('activity')
    .insert({ session_id: sessionId, type: 'workout', summary })
  if (error) console.warn('activity write failed', error)
}

export function useSessions() {
  return useQuery({ queryKey: ['sessions'], queryFn: fetchSessions })
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
      try {
        await writeActivity({ sessionId: saved.id, summary: { sessionName: session.sessionName, volume: session.totalVolume } })
      } catch (e) {
        console.warn('activity write failed', e)
      }
      return saved
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['program'] })
    },
  })
}
