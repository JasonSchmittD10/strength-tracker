export function getWorkoutDisplay(params) {
  if (!params) return { title: 'Workout', subtitle: null }
  const { mode, session, template, programSubtitle } = params
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const title = mode === 'program' ? session?.name
              : mode === 'builder' ? 'Build Workout'
              : template?.name || 'Workout'
  const subtitle = mode === 'program' ? (programSubtitle ?? null) : date
  return { title, subtitle }
}

export function formatElapsed(s) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}
