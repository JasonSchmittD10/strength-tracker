import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ExerciseBlock from './ExerciseBlock'
import RestTimer from './RestTimer'
import WorkoutSummary from './WorkoutSummary'
import { useSessions, useSaveSession } from '@/hooks/useSessions'
import { normalizeExerciseName } from '@/lib/exercises'
import { totalVolume } from '@/lib/utils'

function useElapsedTimer() {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])
  return elapsed
}

function formatElapsed(s) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function WorkoutScreen() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const session = state?.session
  const programId = state?.programId

  const elapsed = useElapsedTimer()
  const { data: allSessions = [] } = useSessions()
  const { mutateAsync: saveSession } = useSaveSession()

  // Pre-fill sets from last matching session in history
  const [exerciseSets, setExerciseSets] = useState(() => {
    if (!session) return {}
    const lastMatch = allSessions.find(s => s.sessionId === session.id)
    return Object.fromEntries(
      session.exercises.map((ex, i) => {
        const prevSets = lastMatch?.exercises?.find(
          e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name)
        )?.sets || []
        const sets = Array.from({ length: ex.sets }, (_, j) => ({
          weight: prevSets[j]?.weight ?? '',
          reps: prevSets[j]?.reps ?? ex.reps?.split('–')[0] ?? '',
          rpe: '',
          completed: false,
        }))
        return [i, sets]
      })
    )
  })

  // Pre-fill effect: runs when allSessions loads (handles async case)
  const prefilledRef = useRef(false)
  useEffect(() => {
    if (!session || prefilledRef.current || !allSessions.length) return
    prefilledRef.current = true
    const lastMatch = allSessions.find(s => s.sessionId === session.id)
    if (!lastMatch) return
    setExerciseSets(prev => {
      const next = { ...prev }
      session.exercises.forEach((ex, i) => {
        const prevSets = lastMatch.exercises?.find(
          e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name)
        )?.sets || []
        if (!prevSets.length) return
        next[i] = prev[i].map((s, j) => ({
          ...s,
          weight: prevSets[j]?.weight ?? s.weight,
          reps: prevSets[j]?.reps ?? s.reps,
        }))
      })
      return next
    })
  }, [allSessions, session])

  const [restTimer, setRestTimer] = useState(null) // { duration }
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [confirmBack, setConfirmBack] = useState(false)

  const handleRestDismiss = useCallback(() => setRestTimer(null), [])
  const startedAt = useRef(new Date().toISOString())

  const hasCompletedSets = Object.values(exerciseSets).some(sets => sets.some(s => s.completed))

  function handleBack() {
    if (hasCompletedSets) setConfirmBack(true)
    else navigate(-1)
  }

  function handleSetComplete(exIdx, setIdx) {
    const sets = exerciseSets[exIdx]
    const wasCompleted = sets[setIdx]?.completed
    if (!wasCompleted) {
      // Only trigger rest timer when marking a set complete (not when un-completing)
      const restDuration = session.exercises[exIdx]?.rest || 90
      setRestTimer({ duration: restDuration })
    }
    setExerciseSets(prev => ({
      ...prev,
      [exIdx]: prev[exIdx].map((s, i) => i === setIdx ? { ...s, completed: !wasCompleted } : s),
    }))
  }

  const buildSessionData = useCallback(() => ({
    sessionId: session.id,
    sessionName: session.name,
    tag: session.tag,
    tagLabel: session.tagLabel,
    programId,
    startedAt: startedAt.current,
    completedAt: new Date().toISOString(),
    durationSeconds: elapsed,
    duration: elapsed,
    date: new Date().toISOString().split('T')[0],
    exercises: session.exercises.map((ex, i) => ({
      name: ex.name,
      sets: (exerciseSets[i] || []).map((s, j) => ({
        setNumber: j + 1,
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps) || 0,
        rpe: s.rpe ? parseFloat(s.rpe) : null,
        completed: s.completed,
      })),
    })),
  }), [session, programId, elapsed, exerciseSets])

  async function handleSave() {
    const data = buildSessionData()
    data.totalVolume = totalVolume(data.exercises)
    await saveSession(data)
    navigate('/history')
  }

  if (!session) return (
    <div className="flex items-center justify-center h-screen text-text-muted">
      No session selected.{' '}
      <button onClick={() => navigate('/home')} className="ml-2 text-accent">Go home</button>
    </div>
  )

  const TAG_COLORS = {
    push: 'text-push bg-push/15',
    pull: 'text-pull bg-pull/15',
    legs: 'text-legs bg-legs/15',
  }

  // Build the current session state for summary
  const currentSessionState = {
    ...session,
    exercises: session.exercises.map((ex, i) => ({ ...ex, sets: exerciseSets[i] || [] })),
  }

  return (
    <div className="safe-top pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur border-b border-bg-tertiary px-4 py-3 flex items-center gap-3">
        <button onClick={handleBack} className="text-text-muted hover:text-text-primary transition-colors p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${TAG_COLORS[session.tag] || ''}`}>
            {session.tagLabel}
          </span>
          <span className="font-bold text-text-primary truncate">{session.name}</span>
        </div>
        <span className="font-mono text-sm text-text-muted flex-shrink-0">{formatElapsed(elapsed)}</span>
      </div>

      {/* Exercise blocks */}
      <div className="px-4 pt-4">
        {session.exercises.map((ex, i) => (
          <ExerciseBlock
            key={i}
            exercise={ex}
            exIdx={i}
            sets={exerciseSets[i] || []}
            onChange={sets => setExerciseSets(prev => ({ ...prev, [i]: sets }))}
            onSetComplete={handleSetComplete}
          />
        ))}
      </div>

      {/* Finish Workout sticky button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-bg-primary/95 backdrop-blur border-t border-bg-tertiary">
        <button
          onClick={() => setSummaryOpen(true)}
          className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl py-3 transition-colors"
        >
          Finish Workout
        </button>
      </div>

      {/* Rest timer overlay */}
      {restTimer && (
        <RestTimer
          duration={restTimer.duration}
          onDismiss={handleRestDismiss}
        />
      )}

      {/* Workout summary sheet */}
      <WorkoutSummary
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onSave={handleSave}
        session={currentSessionState}
        durationSeconds={elapsed}
      />

      {/* Confirm leave dialog */}
      {confirmBack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-back-title"
            className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 id="confirm-back-title" className="font-bold text-text-primary mb-2">Leave workout?</h3>
            <p className="text-text-secondary text-sm mb-5">Your progress will be lost.</p>
            <div className="flex gap-3">
              <button autoFocus onClick={() => setConfirmBack(false)} className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary">Stay</button>
              <button onClick={() => navigate(-1)} className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold">Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
