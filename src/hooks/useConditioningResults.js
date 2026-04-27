import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

// Fetches all conditioning_results rows for the user's sessions (joined via
// session_id). Used by the history view and any conditioning analytics.
async function fetchAllResults(userId) {
  if (!userId) return []
  // sessions.user_id gates ownership; we fetch results for this user's
  // sessions only via an inner join against sessions.
  const { data, error } = await supabase
    .from('conditioning_results')
    .select('*, sessions!inner(user_id)')
    .eq('sessions.user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export function useConditioningResults() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['conditioningResults', user?.id],
    queryFn: () => fetchAllResults(user.id),
    enabled: !!user?.id,
  })
}

// Insert a single conditioning_results row. Pass `result` with the column
// names from the migration (snake_case).
export function useSaveConditioningResult() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (result) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('conditioning_results')
        .insert(result)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditioningResults', user?.id] })
    },
  })
}
