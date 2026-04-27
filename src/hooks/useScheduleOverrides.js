import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

const DAY_MS = 86_400_000

function ymd(d) {
  const x = d instanceof Date ? d : new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function defaultRange() {
  const now = new Date()
  const from = new Date(now.getTime() - 30 * DAY_MS)
  const to = new Date(now.getTime() + 30 * DAY_MS)
  return { from: ymd(from), to: ymd(to) }
}

async function fetchOverrides(userId, programConfigId, fromDate, toDate) {
  if (!userId || !programConfigId) return []
  const { data, error } = await supabase
    .from('scheduled_session_overrides')
    .select('*')
    .eq('user_id', userId)
    .eq('program_config_id', programConfigId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Range query for overrides on the active program config.
// Defaults to ±30 days from today; pass explicit dates for other ranges.
export function useScheduleOverrides(programConfigId, fromDate, toDate) {
  const { user } = useAuth()
  const range = (fromDate && toDate) ? { from: fromDate, to: toDate } : defaultRange()
  return useQuery({
    queryKey: ['scheduleOverrides', user?.id, programConfigId, range.from, range.to],
    queryFn: () => fetchOverrides(user.id, programConfigId, range.from, range.to),
    enabled: !!user?.id && !!programConfigId,
  })
}

function invalidateOverrides(queryClient, userId) {
  queryClient.invalidateQueries({ queryKey: ['scheduleOverrides', userId] })
  // Today's session resolution depends on today's override
  queryClient.invalidateQueries({ queryKey: ['programConfig', userId] })
}

// Upsert an override on the (user, program_config_id, date) tuple.
// Use for skip and swap (and the train-anyway variant of swap).
export function useCreateOverride() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ programConfigId, date, overrideType, originalSessionId = null, newSessionId = null, rescheduledTo = null }) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('scheduled_session_overrides')
        .upsert({
          user_id: user.id,
          program_config_id: programConfigId,
          date,
          override_type: overrideType,
          original_session_id: originalSessionId,
          new_session_id: newSessionId,
          rescheduled_to: rescheduledTo,
        }, { onConflict: 'user_id,program_config_id,date' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateOverrides(queryClient, user?.id),
  })
}

export function useUpdateOverride() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('scheduled_session_overrides')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => invalidateOverrides(queryClient, user?.id),
  })
}

// Delete by date (cancel today's swap/skip) or by id.
export function useDeleteOverride() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, date, programConfigId }) => {
      if (!user?.id) throw new Error('Not authenticated')
      let q = supabase.from('scheduled_session_overrides').delete().eq('user_id', user.id)
      if (id) q = q.eq('id', id)
      else if (date && programConfigId) q = q.eq('date', date).eq('program_config_id', programConfigId)
      else throw new Error('Must provide id or (date + programConfigId)')
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => invalidateOverrides(queryClient, user?.id),
  })
}

// TODO Phase 4.1: reschedule UI (long-press in history). Data layer is ready;
// this stub creates a 'reschedule' override with the new date.
export function useCreateReschedule() {
  const create = useCreateOverride()
  return {
    ...create,
    mutateAsync: ({ programConfigId, date, rescheduledTo, originalSessionId }) =>
      create.mutateAsync({
        programConfigId,
        date,
        overrideType: 'reschedule',
        originalSessionId,
        rescheduledTo,
      }),
  }
}
