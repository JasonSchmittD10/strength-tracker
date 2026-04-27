import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PROGRAMS } from '@/lib/programs'
import { useAuth } from './useAuth'

async function fetchActiveConfig(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('user_program_configs')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

// Fetches the user's currently active program config (ended_at IS NULL)
// and resolves the corresponding Program from PROGRAMS.
//
// Shape: { config, program, isLoading, error }
//   config  — the user_program_configs row, or null if none active
//   program — the program object from PROGRAMS, or null
export function useProgramConfig() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['programConfig', user?.id],
    queryFn: () => fetchActiveConfig(user.id),
    enabled: !!user?.id,
  })
  const config = query.data ?? null
  const program = config?.program_id ? (PROGRAMS[config.program_id] ?? null) : null
  return {
    config,
    program,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

// Starts a new program: ends any active config and inserts a new one.
// `inputs` is the user_program_configs.inputs JSONB blob (canonical lbs).
export function useStartProgram() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ programId, startedAt, inputs = {} }) => {
      if (!user?.id) throw new Error('Not authenticated')
      // End any active config
      const { error: endErr } = await supabase
        .from('user_program_configs')
        .update({ ended_at: startedAt, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('ended_at', null)
      if (endErr) throw endErr
      // Insert the new active row
      const { data, error } = await supabase
        .from('user_program_configs')
        .insert({
          user_id: user.id,
          program_id: programId,
          started_at: startedAt,
          inputs,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programConfig', user?.id] })
    },
  })
}

// Updates only the inputs JSONB on the active config. Used by Edit Inputs and
// the 5/3/1 block-end TM-update prompt.
export function useUpdateInputs() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ inputs, currentBlockNumber }) => {
      if (!user?.id) throw new Error('Not authenticated')
      const updates = { inputs, updated_at: new Date().toISOString() }
      if (currentBlockNumber != null) updates.current_block_number = currentBlockNumber
      const { error } = await supabase
        .from('user_program_configs')
        .update(updates)
        .eq('user_id', user.id)
        .is('ended_at', null)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programConfig', user?.id] })
    },
  })
}

// Ends the currently active program (one-shot completion or user-initiated end).
export function useEndProgram() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (endedAt) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('user_program_configs')
        .update({ ended_at: endedAt ?? new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('ended_at', null)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programConfig', user?.id] })
    },
  })
}

// Updates fields on the currently active config (custom_pattern, inputs, etc.).
export function useUpdateProgramConfig() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('user_program_configs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('ended_at', null)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programConfig', user?.id] })
    },
  })
}
