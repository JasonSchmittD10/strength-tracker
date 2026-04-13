import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Fetch the current user's own recent activity rows, newest first
export function useRecentActivity(limit = 3) {
  return useQuery({
    queryKey: ['activity', 'mine', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Fetch activity for all members of a group, with profile info attached.
// Profiles are fetched in a separate query to avoid relying on an auto-detected
// FK join between activity.user_id → profiles.id (which may not exist).
export function useGroupActivity(groupId) {
  return useQuery({
    queryKey: ['activity', 'group', groupId],
    queryFn: async () => {
      // Step 1: get member user_ids for this group
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
      if (membersError) throw membersError

      const memberIds = (members || []).map(m => m.user_id)
      if (memberIds.length === 0) return []

      // Step 2: fetch activity + profiles in parallel (separate queries avoid FK dependency)
      const [activityRes, profilesRes] = await Promise.all([
        supabase
          .from('activity')
          .select('id, user_id, session_id, type, summary, created_at')
          .in('user_id', memberIds)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('profiles')
          .select('id, display_name, avatar_url, is_private')
          .in('id', memberIds),
      ])

      if (activityRes.error) {
        console.error('[useGroupActivity] activity fetch failed:', activityRes.error)
        throw activityRes.error
      }

      // Build a lookup map from profiles (profilesRes errors are non-fatal — names just won't show)
      const profilesMap = {}
      for (const p of profilesRes.data || []) {
        profilesMap[p.id] = p
      }

      // Merge profiles and filter private users
      return (activityRes.data || [])
        .map(a => ({ ...a, profiles: profilesMap[a.user_id] ?? null }))
        .filter(a => !a.profiles?.is_private)
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2,
  })
}
