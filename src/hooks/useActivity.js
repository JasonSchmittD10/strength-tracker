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
// Requires Supabase RLS to allow reading activity rows for group members.
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

      // Step 2: fetch activity for those members with profile info
      const { data, error } = await supabase
        .from('activity')
        .select('*, profiles ( display_name, avatar_url, is_private )')
        .in('user_id', memberIds)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error

      // Step 3: filter out private profiles (belt-and-suspenders on top of RLS)
      return (data || []).filter(a => !a.profiles?.is_private)
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2,
  })
}
