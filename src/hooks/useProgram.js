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
  const { error: seedError } = await supabase.from('user_config').insert({ data: DEFAULT_CONFIG })
  if (seedError) console.warn('config seed failed', seedError)
  return DEFAULT_CONFIG
}

export function useProgram() {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['program'],
    queryFn: async () => {
      const config = await fetchConfig()
      const program = getActiveProgram(config)
      const blockInfo = getBlockAndWeek(config)
      // Read sessions from cache if available, otherwise fetch a lightweight slice
      const cachedSessions = queryClient.getQueryData(['sessions'])
      let recentSessions = cachedSessions
      if (!recentSessions) {
        const { data } = await supabase
          .from('sessions')
          .select('id, data')
          .order('created_at', { ascending: false })
          .limit(10)
        recentSessions = (data || []).map(row => ({
          _id: row.id,
          sessionId: row.data?.sessionId,
          sessionName: row.data?.sessionName,
          date: row.data?.date,
        }))
      }
      const nextSession = getNextSession(config, recentSessions)
      return { config, program, blockInfo, nextSession }
    },
  })
}

export function useSaveConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config) => {
      const { error: deleteError } = await supabase.from('user_config').delete().not('id', 'is', null)
      if (deleteError) throw deleteError
      const { error } = await supabase.from('user_config').insert({ data: config })
      if (error) throw error
      return config
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program'] }),
  })
}
