import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeExerciseName } from '@/lib/exercises'

// Fetches the canonical exercise library — every active row in `exercises`
// with its full metadata. Each entry is shaped like the DB row plus a
// computed `primaryMuscle` convenience field for the picker.
async function fetchExerciseLibrary() {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, modifiers, muscles_primary, muscles_secondary, pattern, cues, description, input_type')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return (data ?? []).map(row => ({
    ...row,
    // Postgres text[] arrives as a JS array; nulls become empty arrays for
    // consumer ergonomics. (Backfilled rows already default to '{}'; this
    // only matters if a future row is inserted without setting them.)
    muscles_primary: row.muscles_primary ?? [],
    muscles_secondary: row.muscles_secondary ?? [],
    cues: row.cues ?? [],
    primaryMuscle: row.muscles_primary?.[0] ?? '',
  }))
}

export function useExerciseLibrary() {
  return useQuery({
    queryKey: ['exerciseLibrary'],
    queryFn: fetchExerciseLibrary,
    // Library is admin-managed and changes rarely; cache for the page lifetime.
    staleTime: 5 * 60 * 1000,
  })
}

// Lookup a single exercise by name. Applies NAME_ALIASES first so historical
// or program-variant names still find their canonical row. Shares the
// useExerciseLibrary cache — no extra DB round trip.
export function useExerciseByName(rawName) {
  const query = useExerciseLibrary()
  const data = useMemo(() => {
    if (!rawName) return null
    const canonical = normalizeExerciseName(rawName)
    return (query.data ?? []).find(e => e.name === canonical) ?? null
  }, [query.data, rawName])
  return { ...query, data }
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
