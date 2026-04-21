// src/components/workout/WorkoutScreen.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, useBlocker } from 'react-router-dom'
import workoutIcon from '@/assets/icons/icon-workout.svg'
import pauseIcon from '@/assets/icons/icon-pause.svg'
import playIcon from '@/assets/icons/icon-play.svg'
import supersetIcon from '@/assets/icons/icon-superset.svg'
import ExerciseBlock from './ExerciseBlock'
import ExerciseSearchSheet from './ExerciseSearchSheet'
import RestTimer from './RestTimer'
import WorkoutSummary from './WorkoutSummary'
import { useSessions, useSaveSession } from '@/hooks/useSessions'
import { useSaveTemplate } from '@/hooks/useTemplates'
import { useProgram } from '@/hooks/useProgram'
import { normalizeExerciseName } from '@/lib/exercises'
import { totalVolume } from '@/lib/utils'
import { getBlockAndWeek } from '@/lib/programs'

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
  const prebuiltExercises = state?.prebuiltExercises

  const [isPaused, setIsPaused] = useState(false)
  const pausedRestRemainingRef = useRef(null)
  const elapsed = useElapsedTimer(isPaused)
  const { data: allSessions = [] } = useSessions()
  const { mutateAsync: saveSession } = useSaveSession()
  const { mutateAsync: saveTemplate } = useSaveTemplate()

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
    if (prebuiltExercises?.length) {
      return prebuiltExercises.map(ex => ({
        name: ex.name,
        sets: 3,
        reps: '8–12',
        rest: 90,
        restLabel: '90 sec',
        supersetId: ex.supersetId ?? null,
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
    if (prebuiltExercises?.length) {
      return Object.fromEntries(
        prebuiltExercises.map((_, i) => [
          i,
          Array.from({ length: 3 }, () => ({ weight: '', reps: '', rpe: '', completed: false })),
        ])
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
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false)
  const [confirmBack, setConfirmBack] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedExercises, setSelectedExercises] = useState(new Set())
  const [isSelectingSuperset, setIsSelectingSuperset] = useState(false)
  const [builderName, setBuilderName] = useState('')
  const [builderSaving, setBuilderSaving] = useState(false)
  const [builderSaveError, setBuilderSaveError] = useState(null)
  const allowNavRef = useRef(false)
  const { program, config: programConfig } = useProgram()
  const blockInfo = mode === 'program' && programConfig ? getBlockAndWeek(programConfig) : null
  const programSubtitle = program && blockInfo
    ? `${program.name} · Block ${blockInfo.blockNumber} · Week ${blockInfo.weekInBlock} · ${blockInfo.phaseName}`
    : null

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

  function handleRemoveExercise(exIdx) {
    setCustomExercises(prev => prev.filter((_, i) => i !== exIdx))
    setExerciseSets(prev => {
      const next = {}
      Object.entries(prev).forEach(([key, sets]) => {
        const k = parseInt(key)
        if (k < exIdx) next[k] = sets
        else if (k > exIdx) next[k - 1] = sets
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

  async function handleSaveBuilder() {
    if (activeExercises.length === 0) return
    setBuilderSaving(true)
    setBuilderSaveError(null)
    try {
      const name = builderName.trim() || 'Custom Workout'
      const exercises = activeExercises.map((ex, i) => ({
        name: ex.name,
        sets: (exerciseSets[i] ?? []).length || ex.sets || 3,
        reps: ex.reps || '8–12',
        rest: ex.rest ?? 90,
        restLabel: ex.restLabel ?? '90 sec',
      }))
      await saveTemplate({ name, exercises })
      allowNavRef.current = true
      navigate('/home')
    } catch (e) {
      setBuilderSaveError('Failed to save. Please try again.')
    } finally {
      setBuilderSaving(false)
    }
  }

  async function handleFinishConfirmed() {
    setConfirmFinishOpen(false)
    setIsSelectingSuperset(false)
    setSelectedExercises(new Set())
    setSaving(true)
    setSaveError(null)
    try {
      const data = buildSessionData()
      data.totalVolume = totalVolume(data.exercises)
      await saveSession(data)
      allowNavRef.current = true
    } catch (e) {
      console.error('Save session failed:', e)
      setSaveError(e?.message ?? 'Failed to save workout. Please try again.')
    } finally {
      setSaving(false)
      setSummaryOpen(true)
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

  const isCustomMode = mode === 'custom' || mode === 'template' || mode === 'builder'

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

  const activeExIdx = activeExercises.findIndex((_, i) =>
    (exerciseSets[i] ?? []).some(s => !s.completed)
  )

  const currentSessionState = {
    ...(mode === 'program' ? session : {}),
    exercises: activeExercises.map((ex, i) => ({ ...ex, sets: exerciseSets[i] ?? [] })),
  }

  const headerDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const headerTitle = mode === 'program'
    ? session.name
    : mode === 'builder'
      ? 'Build Workout'
      : template?.name || 'Workout'
  const headerSubtitle = mode === 'program' ? programSubtitle : headerDate

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      {/* Static header */}
      <div className="flex-shrink-0 px-[16px] pb-[16px] pt-[12px] flex items-center justify-between bg-bg-primary border-b border-[rgba(255,255,255,0.1)]">
        {/* Left: icon + session name + subtitle */}
        <div className="flex items-center gap-[8px] flex-1 min-w-0">
          <div className="bg-[rgba(255,255,255,0.1)] rounded-[4px] p-[6px] flex-shrink-0">
            <img src={workoutIcon} alt="" className="w-[20px] h-[20px]" />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="font-judge text-[16px] text-white leading-[1.2]">
              {headerTitle}
            </span>
            {headerSubtitle && (
              <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] truncate">
                {headerSubtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: timer + pause/play button */}
        {mode !== 'builder' && (
          <div className="flex items-center gap-[12px] flex-shrink-0">
            <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[0.5px] leading-[14px]">
              {formatElapsed(elapsed)}
            </span>
            <button
              onClick={handleTogglePause}
              className={`rounded-[4px] p-[8px] flex items-center justify-center ${isPaused ? 'bg-[rgba(242,166,85,0.5)]' : 'bg-[rgba(255,255,255,0.1)]'}`}
              aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
            >
              <img src={isPaused ? playIcon : pauseIcon} alt="" className="w-[16px] h-[16px]" />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable exercise list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        {isCustomMode && activeExercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-commons text-[16px] text-[#8b8b8b] mb-[24px]">No exercises yet. Add one to get started.</p>
            <button
              onClick={() => setSearchOpen(true)}
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] py-[12px] px-[24px] font-commons font-bold text-[18px] text-white"
            >
              + Add Exercise
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
                isActive={exIdx === activeExIdx}
                onRemove={isCustomMode ? () => handleRemoveExercise(exIdx) : undefined}
                isBuilderMode={mode === 'builder'}
              />
            )
          }
          return (
            <div key={group.id} className="border border-[#2d2d2d] rounded-[16px] p-[12px] flex flex-col gap-[12px] mb-[12px]">
              {/* Superset header */}
              <div className="flex items-center gap-[8px]">
                <img src={supersetIcon} alt="" className="w-[16px] h-[16px] flex-shrink-0" />
                <span className="font-commons font-semibold text-[#8b8b8b] text-[14px] tracking-[0.28px]">SUPERSET</span>
              </div>
              {/* Exercise blocks */}
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
                  isActive={exIdx === activeExIdx}
                  onRemove={isCustomMode ? () => handleRemoveExercise(exIdx) : undefined}
                  isBuilderMode={mode === 'builder'}
                />
              ))}
            </div>
          )
        })}

        {/* Finish / Save — inline at bottom of scroll area */}
        <div className="pt-[24px] mt-[8px] flex flex-col gap-[12px]">
          {mode === 'builder' ? (
            <>
              <input
                value={builderName}
                onChange={e => setBuilderName(e.target.value)}
                placeholder="e.g. Upper Body Power"
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons text-[18px] text-white placeholder-[#5c5c5c] focus:outline-none focus:border-accent"
              />
              {builderSaveError && <p className="font-commons text-[14px] text-danger">{builderSaveError}</p>}
              <button
                onClick={handleSaveBuilder}
                disabled={builderSaving || activeExercises.length === 0}
                className="w-full h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black disabled:opacity-50"
              >
                {builderSaving ? 'Saving…' : 'Save Template'}
              </button>
              <button
                onClick={() => { allowNavRef.current = true; navigate(-1) }}
                className="w-full font-commons font-bold text-[18px] text-[#c02727] text-center py-[12px]"
              >
                Discard
              </button>
            </>
          ) : (
            <>
              {isCustomMode && activeExercises.length > 0 && !isSelectingSuperset && (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] py-[12px] px-[16px] font-commons font-bold text-[18px] text-white"
                >
                  + Add Exercise
                </button>
              )}
              {isCustomMode && activeExercises.length >= 2 && !isSelectingSuperset && (
                <button
                  onClick={() => setIsSelectingSuperset(true)}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] py-[12px] px-[16px] font-commons font-bold text-[18px] text-white"
                >
                  + Superset
                </button>
              )}
              <button
                onClick={() => setConfirmFinishOpen(true)}
                className="w-full h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black"
              >
                {saving ? 'Saving…' : 'Finish Workout'}
              </button>
              <button
                onClick={handleBack}
                className="w-full font-commons font-bold text-[18px] text-[#c02727] text-center py-[12px]"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sticky footer — superset selection only */}
      {isCustomMode && isSelectingSuperset && (
        <div className="flex-shrink-0 border-t border-bg-tertiary bg-bg-primary px-[16px] py-[12px]">
          <div className="flex gap-[8px]">
            <button
              onClick={() => { setIsSelectingSuperset(false); setSelectedExercises(new Set()) }}
              className="flex-1 py-[12px] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons text-[16px] text-[#8b8b8b]"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSuperset}
              disabled={!canAddSuperset}
              className={`flex-1 py-[12px] rounded-[6px] font-commons font-bold text-[16px] transition-colors ${canAddSuperset ? 'bg-accent text-black' : 'bg-[rgba(255,255,255,0.05)] text-[#5c5c5c]'}`}
            >
              Add Superset{canAddSuperset && selectedExercises.size >= 2 ? ` (${selectedExercises.size})` : ''}
            </button>
          </div>
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

      {/* Workout summary / results */}
      <WorkoutSummary
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onDone={() => { setSummaryOpen(false); navigate('/history') }}
        session={currentSessionState}
        durationSeconds={elapsed}
        mode={mode}
        templateId={template?.id}
        templateName={template?.name}
        saveError={saveError}
      />

      {/* Confirm finish dialog */}
      {confirmFinishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-[24px]">
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px] w-full max-w-sm flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[6px]">
              <h3 className="font-judge text-[22px] text-white leading-snug">Finish workout?</h3>
              <p className="font-commons text-[16px] text-[rgba(255,255,255,0.6)] leading-[1.4]">Ready to log your session?</p>
            </div>
            <div className="flex flex-col gap-[10px]">
              <button
                onClick={handleFinishConfirmed}
                className="w-full h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black"
              >
                Finish Workout
              </button>
              <button
                onClick={() => setConfirmFinishOpen(false)}
                className="w-full h-[46px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons font-bold text-[18px] text-white"
              >
                Keep Going
              </button>
            </div>
          </div>
        </div>
      )}

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
