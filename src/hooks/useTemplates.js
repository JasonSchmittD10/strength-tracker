import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

async function fetchTemplates() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

async function saveTemplate({ id, name, exercises = [], description = null }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (id) {
    const { data, error } = await supabase
      .from('workout_templates')
      .update({ name, exercises, description })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase
    .from('workout_templates')
    .insert({ user_id: user.id, name, exercises, description })
    .select()
    .single()
  if (error) throw error
  return data
}

async function deleteTemplate(id) {
  const { error } = await supabase.from('workout_templates').delete().eq('id', id)
  if (error) throw error
  return id
}

export function useWorkoutTemplates() {
  return useQuery({ queryKey: ['workout_templates'], queryFn: fetchTemplates })
}

export function useSaveTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout_templates'] }),
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout_templates'] }),
  })
}
