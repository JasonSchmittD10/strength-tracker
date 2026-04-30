import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { EXERCISE_LIBRARY } from '@/lib/exercises'

// Fetches the canonical exercise library from the `exercises` table and merges
// in display metadata (primary muscle, cues, inputType) from EXERCISE_LIBRARY
// where present. The DB is the source of truth for which exercises exist; the
// hardcoded EXERCISE_LIBRARY is the metadata layer until we move it into the DB.
async function fetchExerciseLibrary() {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, modifiers')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return (data ?? []).map(row => {
    const meta = EXERCISE_LIBRARY[row.name] ?? {}
    return {
      id: row.id,
      name: row.name,
      primaryMuscle: meta.muscles?.primary?.[0] ?? '',
      // input_type comes from row.modifiers first (DB source of truth), falls
      // back to EXERCISE_LIBRARY[name].inputType (legacy metadata layer).
      inputType: row.modifiers?.input_type ?? meta.inputType ?? 'reps',
    }
  })
}

export function useExerciseLibrary() {
  return useQuery({
    queryKey: ['exerciseLibrary'],
    queryFn: fetchExerciseLibrary,
    // Library is admin-managed and changes rarely; cache for the page lifetime.
    staleTime: 5 * 60 * 1000,
  })
}

// Convenience: returns the same data grouped alphabetically by first letter.
// Used by the custom-workout exercise picker.
export function useAlphaGroupedExercises() {
  const query = useExerciseLibrary()
  const groups = useMemo(() => {
    const exercises = query.data ?? []
    return exercises.reduce((acc, ex) => {
      const letter = ex.name[0]?.toUpperCase() ?? '#'
      if (!acc[letter]) acc[letter] = []
      acc[letter].push(ex)
      return acc
    }, {})
  }, [query.data])
  return { ...query, groups }
}
