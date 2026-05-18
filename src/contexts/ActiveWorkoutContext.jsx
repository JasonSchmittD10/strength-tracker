import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

const ActiveWorkoutContext = createContext(null)
const STORAGE_KEY = 'hst:active-workout:v1'
const EXERCISE_STORAGE_KEY = 'hst:active-workout:exercise-state:v1'
const STALE_AFTER_MS = 24 * 60 * 60 * 1000 // 24h

function readPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data?.schemaVersion !== 1) return null
    if (!data.startedAtIso) return null
    const ageMs = Date.now() - new Date(data.startedAtIso).getTime()
    if (ageMs > STALE_AFTER_MS || ageMs < 0) return null
    return data
  } catch {
    return null
  }
}

function clearPersisted() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
  try { localStorage.removeItem(EXERCISE_STORAGE_KEY) } catch {}
}

export function ActiveWorkoutProvider({ children }) {
  const initial = readPersisted()
  const [params, setParams] = useState(initial?.params ?? null)
  const [isActive, setIsActive] = useState(!!initial)
  // Wake up minimized after a refresh so the user isn't slammed back into the workout UI
  const [isMinimized, setIsMinimized] = useState(initial ? true : false)
  const [startedAtIso, setStartedAtIso] = useState(initial?.startedAtIso ?? null)
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(initial?.accumulatedSeconds ?? 0)
  const [segmentStartMs, setSegmentStartMs] = useState(initial?.segmentStartMs ?? null)
  const [, setTick] = useState(0)

  const isPaused = segmentStartMs === null

  useEffect(() => {
    if (segmentStartMs === null) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [segmentStartMs])

  const elapsedSeconds = useMemo(() => {
    if (segmentStartMs === null) return accumulatedSeconds
    return accumulatedSeconds + Math.floor((Date.now() - segmentStartMs) / 1000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accumulatedSeconds, segmentStartMs])

  useEffect(() => {
    if (!isActive) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        schemaVersion: 1,
        params,
        startedAtIso,
        accumulatedSeconds,
        segmentStartMs,
        isMinimized,
      }))
    } catch {}
  }, [isActive, params, startedAtIso, accumulatedSeconds, segmentStartMs, isMinimized])

  const startWorkout = useCallback((nextParams) => {
    // Clear any previous per-exercise snapshot; the workout is fresh.
    try { localStorage.removeItem(EXERCISE_STORAGE_KEY) } catch {}
    setParams(nextParams ?? null)
    setStartedAtIso(new Date().toISOString())
    setAccumulatedSeconds(0)
    setSegmentStartMs(Date.now())
    setIsMinimized(false)
    setIsActive(true)
  }, [])

  const endWorkout = useCallback(() => {
    setIsActive(false)
    setIsMinimized(false)
    setParams(null)
    setStartedAtIso(null)
    setAccumulatedSeconds(0)
    setSegmentStartMs(null)
    clearPersisted()
  }, [])

  const minimize = useCallback(() => setIsMinimized(true), [])
  const expand = useCallback(() => setIsMinimized(false), [])

  const togglePause = useCallback(() => {
    setSegmentStartMs(prev => {
      if (prev === null) {
        return Date.now()
      }
      const delta = Math.floor((Date.now() - prev) / 1000)
      setAccumulatedSeconds(s => s + delta)
      return null
    })
  }, [])

  const value = useMemo(() => ({
    params,
    isActive,
    isMinimized,
    isPaused,
    startedAtIso,
    elapsedSeconds,
    startWorkout,
    endWorkout,
    minimize,
    expand,
    togglePause,
  }), [params, isActive, isMinimized, isPaused, startedAtIso, elapsedSeconds, startWorkout, endWorkout, minimize, expand, togglePause])

  return <ActiveWorkoutContext.Provider value={value}>{children}</ActiveWorkoutContext.Provider>
}

export function useActiveWorkout() {
  const ctx = useContext(ActiveWorkoutContext)
  if (!ctx) throw new Error('useActiveWorkout must be used within ActiveWorkoutProvider')
  return ctx
}

export { EXERCISE_STORAGE_KEY }
