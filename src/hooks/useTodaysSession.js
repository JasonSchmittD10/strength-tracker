import { useQuery } from '@tanstack/react-query'
import { useProfile } from './useProfile'
import { useProgramConfig } from './useProgramConfig'
import { useSessions } from './useSessions'
import { useScheduleOverrides } from './useScheduleOverrides'
import {
  resolveScheduledSession,
  resolveMacroPosition,
  countCompletedSessions,
} from '@/lib/scheduling'
import { useAuth } from './useAuth'

function todayYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Resolves today's scheduled session and the user's macrocycle position.
//
// Returns:
//   resolution    — { type: 'session' | 'rest' | 'completed' | ..., session?, skipped? } | null
//   macroPosition — { mesoId, mesoName, weekInMeso, isDeload, blockNumber, weekInBlock, weekLabel } | null
//   completedToday — boolean: a session was already logged for today
//   isLoading
//
// `date` defaults to today; pass a Date for testing future days, etc.
export function useTodaysSession(date) {
  const { user } = useAuth()
  const { config, program, isLoading: cfgLoading } = useProgramConfig()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions()

  const target = date ?? new Date()
  const targetYmd = date ? (typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 10)) : todayYmd()
  const weekStartDay = profile?.weekStartDay ?? 1
  const isRotation = program?.microcycle?.type === 'rotation'

  // Rotation programs need a count of completed sessions
  const rotationCountQuery = useQuery({
    queryKey: ['rotationCount', user?.id, config?.id],
    queryFn: () => countCompletedSessions(user.id, config.id),
    enabled: !!user?.id && !!config?.id && isRotation,
  })

  // Range of overrides (default ±30 days). Pull today's from the result.
  const overridesQuery = useScheduleOverrides(config?.id)

  const isLoading = cfgLoading || profileLoading || sessionsLoading
    || (isRotation && rotationCountQuery.isLoading)
    || (!!config?.id && overridesQuery.isLoading)

  if (isLoading || !config || !program) {
    return {
      resolution: null,
      macroPosition: null,
      completedToday: sessions.some(s => s.date === targetYmd && (s.completedAt || s.duration)),
      isLoading,
      config,
      program,
      todayOverride: null,
    }
  }

  const allOverrides = overridesQuery.data ?? []
  const todayOverride = allOverrides.find(o => o.date === targetYmd) ?? null
  const rotationCount = rotationCountQuery.data ?? 0

  const resolution = resolveScheduledSession(target, config, program, allOverrides, {
    weekStartDay,
    rotationCount,
  })
  const macroPosition = resolveMacroPosition(target, config, program)
  const completedToday = sessions.some(s => s.date === targetYmd && s.programId && s.programId !== 'custom')

  return {
    resolution,
    macroPosition,
    completedToday,
    isLoading: false,
    config,
    program,
    todayOverride,
  }
}
