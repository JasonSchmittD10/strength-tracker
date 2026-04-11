import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getActiveProgram, getBlockAndWeek, getNextSession } from '@/lib/programs'

const DEFAULT_CONFIG = { activeProgramId: 'ppl-x2', programStartDate: '2026-03-30' }

async function fetchConfig() {
  const { data, error } = await supabase
    .from('user_config')
    .select('data')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (data) return data.data
  // First run — seed default config
  await supabase.from('user_config').insert({ data: DEFAULT_CONFIG })
  return DEFAULT_CONFIG
}

async function fetchSessionsForProgram() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, data, created_at')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return (data || []).map(row => {
    const d = row.data
    return { _id: row.id, sessionId: d.sessionId, sessionName: d.sessionName, date: d.date }
  })
}

export function useProgram() {
  return useQuery({
    queryKey: ['program'],
    queryFn: async () => {
      const [config, recentSessions] = await Promise.all([fetchConfig(), fetchSessionsForProgram()])
      const program = getActiveProgram(config)
      const blockInfo = getBlockAndWeek(config)
      const nextSession = getNextSession(config, recentSessions)
      return { config, program, blockInfo, nextSession }
    },
  })
}

export function useSaveConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config) => {
      // Delete existing and insert fresh (single-row config pattern)
      await supabase.from('user_config').delete().not('id', 'is', null)
      const { error } = await supabase.from('user_config').insert({ data: config })
      if (error) throw error
      return config
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program'] }),
  })
}
