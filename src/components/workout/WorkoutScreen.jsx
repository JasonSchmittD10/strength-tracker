// src/components/workout/WorkoutScreen.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, useBlocker } from 'react-router-dom'
import { Plus, Pause, Play } from 'lucide-react'
import ExerciseBlock from './ExerciseBlock'
import ExerciseSearchSheet from './ExerciseSearchSheet'
import RestTimer from './RestTimer'
import WorkoutSummary from './WorkoutSummary'
import { useSessions, useSaveSession } from '@/hooks/useSessions'
import { useProgram } from '@/hooks/useProgram'
import { normalizeExerciseName } from '@/lib/exercises'
import { totalVolume } from '@/lib/utils'
import PrimaryButton from '@/components/shared/PrimaryButton'

function useElapsedTimer(isPaused) {
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

  const [isPaused, setIsPaused] = useState(false)
  const pausedRestRemainingRef = useRef(null)
  const elapsed = useElapsedTimer(isPaused)
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
        supersetId: null,
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
  const [selectedExercises, setSelectedExercises] = useState(new Set())
  const [isSelectingSuperset, setIsSelectingSuperset] = useState(false)
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
    const set = sets[setIdx]
    const wasCompleted = set?.completed
    const isRecompletion = set?.editing === true
    if (!wasCompleted && !isRecompletion) {
      const restDuration = activeExercises[exIdx]?.rest ?? 90
      // key: Date.now() forces RestTimer remount — resets countdown if already running
      setRestTimer({ duration: restDuration, key: Date.now() })
      setRestTimerFullScreen(true)
    }
    setExerciseSets(prev => ({
      ...prev,
      [exIdx]: (prev[exIdx] ?? []).map((s, i) =>
        i === setIdx ? { ...s, completed: !wasCompleted, editing: false } : s
      ),
    }))
  }

  function handleTogglePause() {
    if (!isPaused) {
      if (restTimer) {
        const endTime = restTimer.key + restTimer.duration * 1000
        const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000))
        pausedRestRemainingRef.current = remaining > 0 ? remaining : null
        setRestTimer(null)
        setRestTimerFullScreen(false)
      }
      setIsPaused(true)
    } else {
      if (pausedRestRemainingRef.current !== null) {
        setRestTimer({ duration: pausedRestRemainingRef.current, key: Date.now() })
        pausedRestRemainingRef.current = null
      }
      setIsPaused(false)
    }
  }

  function handleToggleSelect(i) {
    setSelectedExercises(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function handleAddSuperset() {
    if (selectedExercises.size < 2) return
    const id = Date.now().toString()
    setCustomExercises(prev =>
      prev.map((ex, i) =>
        selectedExercises.has(i) ? { ...ex, supersetId: id } : ex
      )
    )
    setSelectedExercises(new Set())
    setIsSelectingSuperset(false)
  }

  function removeSet(exIdx, setIdx) {
    setExerciseSets(prev => {
      const sets = prev[exIdx] ?? []
      if (sets.length <= 1) return prev
      return { ...prev, [exIdx]: sets.filter((_, i) => i !== setIdx) }
    })
  }

  function handleAddExercise(exerciseName) {
    const newIdx = customExercises.length
    setCustomExercises(prev => [
      ...prev,
      { name: exerciseName, sets: 3, reps: '8–12', rest: 90, restLabel: '90 sec', supersetId: null },
    ])
    setExerciseSets(prev => ({
      ...prev,
      [newIdx]: Array.from({ length: 3 }, () => ({ weight: '', reps: '', rpe: '', completed: false })),
    }))
  }

  function handleAddSetToSuperset(groupIndices) {
    setExerciseSets(prev => {
      const next = { ...prev }
      groupIndices.forEach(exIdx => {
        const sets = prev[exIdx] ?? []
        const last = sets[sets.length - 1] || {}
        next[exIdx] = [...sets, { weight: last.weight || '', reps: last.reps || '', rpe: '', completed: false }]
      })
      return next
    })
  }

  function handleAddSupersetFromSheet(exerciseNames) {
    if (exerciseNames.length < 2) return
    const id = Date.now().toString()
    const startIdx = customExercises.length
    setCustomExercises(prev => [
      ...prev,
      ...exerciseNames.map(name => ({ name, sets: 3, reps: '8–12', rest: 90, restLabel: '90 sec', supersetId: id })),
    ])
    setExerciseSets(prev => {
      const next = { ...prev }
      exerciseNames.forEach((_, i) => {
        next[startIdx + i] = Array.from({ length: 3 }, () => ({ weight: '', reps: '', rpe: '', completed: false }))
      })
      return next
    })
  }

  const buildSessionData = useCallback(() => {
    const exercises = activeExercises.map((ex, i) => ({
      name: ex.name,
      supersetId: ex.supersetId ?? null,
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

  const displayGroups = []
  const groupedIndices = new Set()
  for (let i = 0; i < activeExercises.length; i++) {
    if (groupedIndices.has(i)) continue
    const ex = activeExercises[i]
    if (ex.supersetId) {
      const indices = activeExercises
        .map((e, j) => e.supersetId === ex.supersetId ? j : -1)
        .filter(j => j !== -1)
      if (indices.length >= 2) {
        indices.forEach(j => groupedIndices.add(j))
        displayGroups.push({ type: 'superset', id: ex.supersetId, indices })
      } else {
        displayGroups.push({ type: 'single', exIdx: i })
      }
    } else {
      displayGroups.push({ type: 'single', exIdx: i })
    }
  }

  const canAddSuperset = selectedExercises.size >= 2 &&
    ![...selectedExercises].some(i => activeExercises[i]?.supersetId)

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
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPaused
            ? <span className="text-sm text-text-muted italic">Paused</span>
            : <span className="font-mono text-sm text-text-muted">{formatElapsed(elapsed)}</span>
          }
          <button
            onClick={handleTogglePause}
            className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
          >
            {isPaused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
      </div>

      {/* Scrollable exercise list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        {isCustomMode && activeExercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">💪</div>
            <p className="text-text-secondary text-sm mb-6">No exercises yet. Add one to get started.</p>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-black font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
            >
              <Plus size={18} />
              Add Exercise
            </button>
          </div>
        )}

        {displayGroups.map((group, gi) => {
          if (group.type === 'single') {
            const { exIdx } = group
            return (
              <ExerciseBlock
                key={exIdx}
                exercise={activeExercises[exIdx]}
                exIdx={exIdx}
                sets={exerciseSets[exIdx] ?? []}
                onChange={sets => setExerciseSets(prev => ({ ...prev, [exIdx]: sets }))}
                onSetComplete={handleSetComplete}
                isProgramMode={mode === 'program'}
                onRemoveSet={isCustomMode ? (setIdx) => removeSet(exIdx, setIdx) : undefined}
                isSelected={selectedExercises.has(exIdx)}
                onSelect={isCustomMode && isSelectingSuperset ? () => handleToggleSelect(exIdx) : undefined}
              />
            )
          }
          return (
            <div key={group.id} className="mb-3">
              <div className="flex items-center gap-2 mb-1.5 ml-0.5">
                <span className="text-xs font-bold text-accent uppercase tracking-wider">Superset</span>
                <div className="flex-1 h-px bg-accent/20" />
              </div>
              <div className="border-l-2 border-accent pl-2.5 space-y-1.5">
                {group.indices.map(exIdx => (
                  <ExerciseBlock
                    key={exIdx}
                    exercise={activeExercises[exIdx]}
                    exIdx={exIdx}
                    sets={exerciseSets[exIdx] ?? []}
                    onChange={sets => setExerciseSets(prev => ({ ...prev, [exIdx]: sets }))}
                    onSetComplete={handleSetComplete}
                    isProgramMode={mode === 'program'}
                    onRemoveSet={isCustomMode ? (setIdx) => removeSet(exIdx, setIdx) : undefined}
                    isInSuperset={true}
                    isSelected={selectedExercises.has(exIdx)}
                    onSelect={isCustomMode && isSelectingSuperset ? () => handleToggleSelect(exIdx) : undefined}
                    onAddSet={isCustomMode ? () => handleAddSetToSuperset(group.indices) : undefined}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Finish + Cancel — inline at bottom of scroll area */}
        <div className="pt-4 mt-2 border-t border-bg-tertiary">
          <PrimaryButton onClick={() => setSummaryOpen(true)} className="mb-2">
            Finish Workout
          </PrimaryButton>
          <button
            onClick={handleBack}
            className="w-full text-danger text-sm font-medium py-2"
          >
            Cancel Workout
          </button>
        </div>
      </div>

      {/* Sticky footer (custom mode only, when exercises exist) */}
      {isCustomMode && activeExercises.length > 0 && (
        <div className="flex-shrink-0 border-t border-bg-tertiary bg-bg-primary px-4 py-3">
          {isSelectingSuperset ? (
            <div className="flex gap-2">
              <button
                onClick={() => { setIsSelectingSuperset(false); setSelectedExercises(new Set()) }}
                className="flex-1 py-3 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSuperset}
                disabled={!canAddSuperset}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${canAddSuperset ? 'bg-accent text-black' : 'bg-bg-tertiary text-text-muted'}`}
              >
                Add Superset{canAddSuperset && selectedExercises.size >= 2 ? ` (${selectedExercises.size})` : ''}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-bg-card border border-bg-tertiary rounded-xl text-sm text-text-primary hover:border-accent/50 transition-colors"
              >
                <Plus size={15} />
                Add Exercise
              </button>
              <button
                onClick={() => setIsSelectingSuperset(true)}
                className="flex-1 flex items-center justify-center py-3 bg-bg-card border border-bg-tertiary rounded-xl text-sm text-text-primary hover:border-accent/50 transition-colors"
              >
                Superset
              </button>
            </div>
          )}
        </div>
      )}

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
        onAddSuperset={handleAddSupersetFromSheet}
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
