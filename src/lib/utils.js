export function epley(weight, reps) {
  const w = parseFloat(weight), r = parseFloat(reps)
  if (!w || isNaN(w) || !r || isNaN(r) || r <= 0) return null
  return Math.round(w * (1 + r / 30))
}

export function totalVolume(exercises) {
  let vol = 0
  ;(exercises || []).forEach(ex => {
    ;(ex.sets || []).forEach(s => {
      const w = parseFloat(s.weight), r = parseFloat(s.reps)
      if (w > 0 && r > 0 && s.completed !== false) vol += w * r
    })
  })
  return vol
}

export function formatVolume(vol) {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${Math.round(vol / 1_000)}k`
  return String(Math.round(vol))
}

export function formatDuration(seconds) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatDate(dateStr, short = false) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterdayDate = new Date(today)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'
  if (short) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function weekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().split('T')[0]
}

