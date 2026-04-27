import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

// camelCase preference accessors with fallbacks for null columns
function withPrefDefaults(profile) {
  if (!profile) return profile
  return {
    ...profile,
    weekStartDay: profile.week_start_day ?? 1,
    weightUnit: profile.weight_unit ?? 'lbs',
    distanceUnit: profile.distance_unit ?? 'mi',
  }
}

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user.id),
    enabled: !!user?.id,
    select: withPrefDefaults,
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates })
      if (error) throw error
    },
    onMutate: async (updates) => {
      // Optimistic update so toggles feel instant
      await queryClient.cancelQueries({ queryKey: ['profile', user?.id] })
      const previous = queryClient.getQueryData(['profile', user?.id])
      if (previous) {
        queryClient.setQueryData(['profile', user?.id], { ...previous, ...updates })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['profile', user?.id], ctx.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }),
  })
}

// Returns the user's preferred weight unit ('lbs' | 'kg'). Defaults to 'lbs'.
export function useUnitPreference() {
  const { data: profile } = useProfile()
  return profile?.weightUnit ?? 'lbs'
}
