import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

async function fetchUserGroups() {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      role,
      joined_at,
      groups (
        id, name, description, invite_code, created_by, created_at, avatar_url, cover_url,
        group_members ( count )
      )
    `)
  if (error) throw error
  return (data || []).map(row => ({
    role: row.role,
    joined_at: row.joined_at,
    ...row.groups,
    memberCount: row.groups?.group_members?.[0]?.count ?? 0,
  }))
}

async function fetchGroupDetail(groupId) {
  // Query via group_members (same direction as fetchUserGroups, avoids RLS issues on groups table)
  const { data: memberRows, error } = await supabase
    .from('group_members')
    .select(`
      user_id, role, joined_at,
      groups ( id, name, description, invite_code, created_by, created_at, avatar_url, cover_url )
    `)
    .eq('group_id', groupId)
  if (error) throw error
  if (!memberRows || memberRows.length === 0) return null

  const groupData = memberRows[0].groups
  const memberIds = memberRows.map(m => m.user_id)

  let profilesMap = {}
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, is_private')
      .in('id', memberIds)
    for (const p of profiles || []) profilesMap[p.id] = p
  }

  return {
    ...groupData,
    group_members: memberRows.map(m => ({
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      profiles: profilesMap[m.user_id] ?? null,
    })),
  }
}

async function createGroup({ name, description }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, description: description || null, created_by: user.id })
    .select()
    .single()
  if (error) throw error

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })
  if (memberError) throw memberError

  return group
}

async function joinGroup(inviteCode) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group, error: findError } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', inviteCode.trim())
    .single()
  if (findError || !group) throw new Error('No group found with that code')

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'member' })
  if (error) throw error

  return group
}

async function leaveGroup({ groupId, userId, isAdmin }) {
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
  if (membersError) throw membersError

  const otherMembers = (members || []).filter(m => m.user_id !== userId)

  if (otherMembers.length === 0) {
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) throw error
    return { deleted: true }
  }

  if (isAdmin) {
    const newAdmin = otherMembers[0]
    const { error: transferError } = await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', newAdmin.user_id)
    if (transferError) throw transferError
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)
  if (error) throw error

  return { deleted: false }
}

async function updateGroupMedia({ groupId, avatarUrl, coverUrl }) {
  const updates = {}
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl
  if (coverUrl !== undefined) updates.cover_url = coverUrl
  const { error } = await supabase.from('groups').update(updates).eq('id', groupId)
  if (error) throw error
}

export function useGroups() {
  return useQuery({ queryKey: ['groups'], queryFn: fetchUserGroups })
}

export function useGroupDetail(groupId) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => fetchGroupDetail(groupId),
    enabled: !!groupId,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useJoinGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: joinGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useLeaveGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useUpdateGroupMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateGroupMedia,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}
