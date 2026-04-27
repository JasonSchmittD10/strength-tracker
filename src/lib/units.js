// Unit helpers for weight (lbs/kg) and distance (mi/km).
//
// Storage convention: weights are stored in lbs in the DB; distances in mi.
// formatWeight / formatDistance assume `value` is in the canonical storage
// unit (lbs / mi) and convert to the requested display `unit` for output.
// convertWeight / convertDistance are pure conversion utilities.

const LBS_PER_KG = 2.20462
const KG_PER_LBS = 0.453592
const KM_PER_MI = 1.609344
const MI_PER_KM = 0.621371

export function convertWeight(value, fromUnit, toUnit) {
  if (value == null || value === '') return value
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return value
  if (fromUnit === toUnit) return num
  if (fromUnit === 'lbs' && toUnit === 'kg') return num * KG_PER_LBS
  if (fromUnit === 'kg' && toUnit === 'lbs') return num * LBS_PER_KG
  return num
}

export function convertDistance(value, fromUnit, toUnit) {
  if (value == null || value === '') return value
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return value
  if (fromUnit === toUnit) return num
  if (fromUnit === 'mi' && toUnit === 'km') return num * KM_PER_MI
  if (fromUnit === 'km' && toUnit === 'mi') return num * MI_PER_KM
  return num
}

export function roundToIncrement(value, unit) {
  if (value == null || value === '' || isNaN(value)) return value
  const num = typeof value === 'number' ? value : parseFloat(value)
  const increment = unit === 'kg' ? 2.5 : 5
  return Math.round(num / increment) * increment
}

// Format a weight stored in lbs for display in the user's preferred unit.
// value: stored value in LBS (canonical storage). null/undefined → '—'.
// unit:  display unit ('lbs' | 'kg').
// opts.precision: digits after decimal. Default 0 for lbs, 1 for kg.
// opts.showUnit:  whether to append the unit string. Default true.
export function formatWeight(value, unit = 'lbs', opts = {}) {
  if (value == null || value === '') return '—'
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return '—'
  const showUnit = opts.showUnit ?? true
  const precision = opts.precision ?? (unit === 'kg' ? 1 : 0)
  const display = unit === 'kg' ? convertWeight(num, 'lbs', 'kg') : num
  const formatted = Number(display).toFixed(precision)
  // Strip a trailing ".0" for whole numbers when precision > 0 to avoid e.g. "100.0 kg"
  const trimmed = precision > 0 ? formatted.replace(/\.0+$/, '') : formatted
  return showUnit ? `${trimmed} ${unit}` : trimmed
}

// Format a distance stored in mi for display in the user's preferred unit.
// value: stored value in MILES (canonical). null/undefined → '—'.
// opts.precision default 1.
export function formatDistance(value, unit = 'mi', opts = {}) {
  if (value == null || value === '') return '—'
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return '—'
  const showUnit = opts.showUnit ?? true
  const precision = opts.precision ?? 1
  const display = unit === 'km' ? convertDistance(num, 'mi', 'km') : num
  const formatted = Number(display).toFixed(precision)
  return showUnit ? `${formatted} ${unit}` : formatted
}
