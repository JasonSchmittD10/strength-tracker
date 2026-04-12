// src/components/workout/WorkoutScreen.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, useBlocker } from 'react-router-dom'
import { Plus } from 'lucide-react'
import ExerciseBlock from './ExerciseBlock'
import ExerciseSearchSheet from './ExerciseSearchSheet'
import RestTimer from './RestTimer'
import WorkoutSummary from './WorkoutSummary'
import { useSessions, useSaveSession } from '@/hooks/useSessions'
import { useProgram } from '@/hooks/useProgram'
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

  const mode = state?.mode || (state?.session ? 'program' : 'custom')
  const session = state?.session
  const programId = state?.programId
  const template = state?.template

  const elapsed = useElapsedTimer()
  const { data: allSessions = [] } = useSessions()
  const { mutateAsync: saveSession } = useSaveSession()
  const { data: programData } = useProgram()
  const { program, blockInfo } = programData || {}

  // ─── Custom/template exercises ────────────────────────────────────────────
  const [customExercises, setCustomExercises] = useState(() => {
    if (mode === 'template' && template?.exercises) {
      return template.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest ?? 90,
        restLabel: ex.restLabel ?? '90 sec',
      }))
    }
    return []
  })

  const activeExercises = mode === 'program' ? (session?.exercises ?? []) : customExercises

  // ─── exerciseSets ─────────────────────────────────────────────────────────
  const [exerciseSets, setExerciseSets] = useState(() => {
    if (mode === 'program' && session) {
      const lastMatch = allSessions.find(s => s.sessionId === session.id)
      return Object.fromEntries(
        session.exercises.map((ex, i) => {
          const prevSets = lastMatch?.exercises?.find(
            e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name)
          )?.sets ?? []
          const sets = Array.from({ length: ex.sets }, (_, j) => ({
            weight: prevSets[j]?.weight ?? '',
            reps: prevSets[j]?.reps ?? ex.reps?.split('–')[0] ?? '',
            rpe: '',
            completed: false,
          }))
          return [i, sets]
        })
      )
    }
    if (mode === 'template' && template?.exercises) {
      const lastMatch = allSessions.find(s => s.sessionName === template.name)
      return Object.fromEntries(
        template.exercises.map((ex, i) => {
          const prevSets = lastMatch?.exercises?.find(
            e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name)
          )?.sets ?? []
          const setsCount = ex.sets ?? 3
          const sets = Array.from({ length: setsCount }, (_, j) => ({
            weight: prevSets[j]?.weight ?? '',
            reps: prevSets[j]?.reps ?? ex.reps?.split('–')[0] ?? '',
            rpe: '',
            completed: false,
          }))
          return [i, sets]
        })
      )
    }
    return {}
  })

  const prefilledRef = useRef(false)
  useEffect(() => {
    if (mode !== 'program' || !session || prefilledRef.current || !allSessions.length) return
    prefilledRef.current = true
    const lastMatch = allSessions.find(s => s.sessionId === session.id)
    if (!lastMatch) return
    setExerciseSets(prev => {
      const next = { ...prev }
      session.exercises.forEach((ex, i) => {
        const prevSets = lastMatch.exercises?.find(
          e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name)
        )?.sets ?? []
        if (!prevSets.length) return
        next[i] = prev[i].map((s, j) => ({
          ...s,
          weight: prevSets[j]?.weight ?? s.weight,
          reps: prevSets[j]?.reps ?? s.reps,
        }))
      })
      return next
    })
  }, [allSessions, session, mode])

  const templatePrefilledRef = useRef(false)
  useEffect(() => {
    if (mode !== 'template' || !template || templatePrefilledRef.current || !allSessions.length) return
    templatePrefilledRef.current = true
    const lastMatch = allSessions.find(s => s.sessionName === template.name)
    if (!lastMatch) return
    setExerciseSets(prev => {
      const next = { ...prev }
      template.exercises.forEach((ex, i) => {
        const prevSets = lastMatch.exercises?.find(
          e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name)
        )?.sets ?? []
        if (!prevSets.length) return
        next[i] = (prev[i] ?? []).map((s, j) => ({
          ...s,
          weight: prevSets[j]?.weight ?? s.weight,
          reps: prevSets[j]?.reps ?? s.reps,
        }))
      })
      return next
    })
  }, [allSessions, template, mode])

  // ─── Rest timer ───────────────────────────────────────────────────────────
  const [restTimer, setRestTimer] = useState(null)          // { duration, key }
  const [restTimerFullScreen, setRestTimerFullScreen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [confirmBack, setConfirmBack] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const allowNavRef = useRef(false)

  // Block swipe-back and browser back button during workout
  // useRef so the flag is synchronously true before navigate() is called
  const blocker = useBlocker(() => !allowNavRef.current)
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setConfirmBack(true)
    }
  }, [blocker.state])

  // Suppress iOS swipe-back gesture at the CSS level (fires before JS can react)
  useEffect(() => {
    document.body.style.overscrollBehaviorX = 'none'
    return () => { document.body.style.overscrollBehaviorX = '' }
  }, [])

  const handleRestDismiss = useCallback(() => {
    setRestTimer(null)
    setRestTimerFullScreen(false)
  }, [])
  const startedAt = useRef(new Date().toISOString())

  const hasCompletedSets = Object.values(exerciseSets).some(sets => sets.some(s => s.completed))

  function handleBack() {
    if (hasCompletedSets) setConfirmBack(true)
    else navigate(-1)
  }

  function handleSetComplete(exIdx, setIdx) {
    const sets = exerciseSets[exIdx] ?? []
    const wasCompleted = sets[setIdx]?.completed
    if (!wasCompleted) {
      const restDuration = activeExercises[exIdx]?.rest ?? 90
      // key: Date.now() forces RestTimer remount — resets countdown if already running
      setRestTimer({ duration: restDuration, key: Date.now() })
      setRestTimerFullScreen(true)
    }
    setExerciseSets(prev => ({
      ...prev,
      [exIdx]: (prev[exIdx] ?? []).map((s, i) => i === setIdx ? { ...s, completed: !wasCompleted } : s),
    }))
  }

  function handleAddExercise(exerciseName) {
    const newIdx = customExercises.length
    setCustomExercises(prev => [
      ...prev,
      { name: exerciseName, sets: 3, reps: '8–12', rest: 90, restLabel: '90 sec' },
    ])
    setExerciseSets(prev => ({
      ...prev,
      [newIdx]: Array.from({ length: 3 }, () => ({ weight: '', reps: '', rpe: '', completed: false })),
    }))
  }

  const buildSessionData = useCallback(() => {
    const exercises = activeExercises.map((ex, i) => ({
      name: ex.name,
      sets: (exerciseSets[i] ?? []).map((s, j) => ({
        setNumber: j + 1,
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps) || 0,
        rpe: s.rpe ? parseFloat(s.rpe) : null,
        completed: s.completed,
      })),
    }))
    if (mode === 'program') {
      return {
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
        exercises,
      }
    }
    return {
      sessionId: null,
      sessionName: 'Custom Workout',
      tag: null,
      tagLabel: null,
      programId: 'custom',
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      durationSeconds: elapsed,
      duration: elapsed,
      date: new Date().toISOString().split('T')[0],
      exercises,
    }
  }, [mode, session, programId, elapsed, exerciseSets, activeExercises])

  async function handleSave(sessionName) {
    setSaving(true)
    setSaveError(null)
    try {
      const data = buildSessionData()
      if (sessionName) data.sessionName = sessionName
      data.totalVolume = totalVolume(data.exercises)
      await saveSession(data)
      allowNavRef.current = true
      navigate('/history')
    } catch (e) {
      console.error('Save session failed:', e)
      setSaveError(e?.message ?? 'Failed to save workout. Please try again.')
      setSaving(false)
    }
  }

  if (mode === 'program' && !session) {
    return (
      <div className="flex items-center justify-center h-screen text-text-muted">
        No session selected.{' '}
        <button onClick={() => navigate('/home')} className="ml-2 text-accent">Go home</button>
      </div>
    )
  }

  const TAG_COLORS = {
    push: 'text-push bg-push/15',
    pull: 'text-pull bg-pull/15',
    legs: 'text-legs bg-legs/15',
  }

  const isCustomMode = mode === 'custom' || mode === 'template'

  const currentSessionState = {
    ...(mode === 'program' ? session : {}),
    exercises: activeExercises.map((ex, i) => ({ ...ex, sets: exerciseSets[i] ?? [] })),
  }

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      {/* Static header — does not scroll */}
      <div className="flex-shrink-0 bg-bg-primary/95 backdrop-blur border-b border-bg-tertiary px-4 py-3 flex items-center gap-3">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {mode === 'program' && session.tag && (
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${TAG_COLORS[session.tag] ?? ''}`}>
                {session.tagLabel}
              </span>
            )}
            <span className="font-bold text-text-primary truncate">
              {mode === 'program' ? session.name : 'Custom Workout'}
            </span>
          </div>
          {mode === 'program' && blockInfo && (
            <div className="text-xs text-text-muted leading-none mt-0.5">
              {program?.name} · Block {blockInfo.blockNumber} · Week {blockInfo.weekInBlock} · {blockInfo.phaseName}
            </div>
          )}
        </div>
        <span className="font-mono text-sm text-text-muted flex-shrink-0">{formatElapsed(elapsed)}</span>
      </div>

      {/* Scrollable exercise list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        {isCustomMode && activeExercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">💪</div>
            <p className="text-text-secondary text-sm mb-6">No exercises yet. Add one to get started.</p>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
            >
              <Plus size={18} />
              Add Exercise
            </button>
          </div>
        )}

        {activeExercises.map((ex, i) => (
          <ExerciseBlock
            key={i}
            exercise={ex}
            exIdx={i}
            sets={exerciseSets[i] ?? []}
            onChange={sets => setExerciseSets(prev => ({ ...prev, [i]: sets }))}
            onSetComplete={handleSetComplete}
            isProgramMode={mode === 'program'}
          />
        ))}

        {isCustomMode && activeExercises.length > 0 && (
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-4 border border-dashed border-bg-tertiary rounded-xl text-text-muted text-sm hover:border-accent/50 hover:text-accent transition-colors"
          >
            <Plus size={16} />
            Add Exercise
          </button>
        )}

        {/* Finish + Cancel — inline at bottom of scroll area */}
        <div className="pt-4 mt-2 border-t border-bg-tertiary">
          <button
            onClick={() => setSummaryOpen(true)}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl py-3 transition-colors mb-2"
          >
            Finish Workout
          </button>
          <button
            onClick={handleBack}
            className="w-full text-danger text-sm font-medium py-2"
          >
            Cancel Workout
          </button>
        </div>
      </div>

      {/* Rest timer */}
      {restTimer && (
        <RestTimer
          key={restTimer.key}
          duration={restTimer.duration}
          onDismiss={handleRestDismiss}
          fullScreen={restTimerFullScreen}
          onMinimize={() => setRestTimerFullScreen(false)}
          onExpand={() => setRestTimerFullScreen(true)}
        />
      )}

      {/* Exercise search sheet */}
      <ExerciseSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={handleAddExercise}
      />

      {/* Workout summary sheet */}
      <WorkoutSummary
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onSave={handleSave}
        session={currentSessionState}
        durationSeconds={elapsed}
        mode={mode}
        templateId={template?.id}
        templateName={template?.name}
        externalSaving={saving}
        externalSaveError={saveError}
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
            <h3 id="confirm-back-title" className="font-bold text-text-primary mb-2">Cancel workout?</h3>
            <p className="text-text-secondary text-sm mb-5">Your progress will be lost.</p>
            <div className="flex gap-3">
              <button autoFocus onClick={() => { setConfirmBack(false); blocker.reset?.() }} className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary">Keep going</button>
              <button onClick={() => { allowNavRef.current = true; setConfirmBack(false); blocker.proceed?.() ?? navigate(-1) }} className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold">Cancel Workout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
