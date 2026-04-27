import { useState, useEffect, useRef } from 'react'

// Shared count-up timer for in-progress workouts (resistance and conditioning).
// `isPaused` toggles the running state; the hook accumulates real seconds
// across pause windows so resume picks up where it left off.
export default function useElapsedTimer(isPaused) {
  const [elapsed, setElapsed] = useState(0)
  const accumulatedRef = useRef(0)
  const segmentStartRef = useRef(Date.now())
  useEffect(() => {
    if (isPaused) {
      accumulatedRef.current += Math.floor((Date.now() - segmentStartRef.current) / 1000)
      return
    }
    segmentStartRef.current = Date.now()
    const id = setInterval(() => {
      setElapsed(accumulatedRef.current + Math.floor((Date.now() - segmentStartRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [isPaused])
  return elapsed
}
