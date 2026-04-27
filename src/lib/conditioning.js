// Conditioning helpers — pace, duration, distance formatting.

// "h:mm:ss" if hours > 0, else "m:ss". Used for the big workout-screen timer
// and history-card duration display. (Distinct from utils.formatDuration,
// which returns "1h 30m" — that's for "this week"-style aggregates.)
export function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '—'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

// Average pace as integer seconds per `unit` ('mi' | 'km'). Returns null if
// either input is missing/zero. Caller is responsible for unit consistency
// between distance and the pace label.
export function computeAvgPace(durationSeconds, distanceValue) {
  if (!durationSeconds || !distanceValue) return null
  const d = Number(durationSeconds)
  const v = Number(distanceValue)
  if (!isFinite(d) || !isFinite(v) || v <= 0 || d <= 0) return null
  return Math.round(d / v)
}

// "8:30/mi" or "5:15/km". Drops hours; pace fits in mm:ss for any sane run.
export function formatPace(secondsPerUnit, unit = 'mi') {
  if (secondsPerUnit == null || isNaN(secondsPerUnit) || secondsPerUnit <= 0) return '—'
  const total = Math.round(secondsPerUnit)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}/${unit}`
}

// Pretty-print a modality label for headers / cards.
const MODALITY_LABELS = {
  run: 'Run',
  bike: 'Bike',
  row: 'Row',
  ruck: 'Ruck',
  swim: 'Swim',
  kettlebell: 'Kettlebell',
  mixed: 'Mixed',
  open: 'Open',
}
export function modalityLabel(modality) {
  return MODALITY_LABELS[modality] ?? (modality ? modality[0].toUpperCase() + modality.slice(1) : '')
}
