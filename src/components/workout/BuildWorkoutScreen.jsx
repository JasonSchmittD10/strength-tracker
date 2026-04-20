import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import PrimaryButton from '@/components/shared/PrimaryButton'
import ExerciseSearchSheet from './ExerciseSearchSheet'
import { EXERCISE_LIBRARY } from '@/lib/exercises'

function DragHandle() {
  return (
    <div className="flex flex-col gap-[4px] flex-shrink-0">
      <div className="h-[2px] w-[14px] bg-[#8c8c8c] rounded-full" />
      <div className="h-[2px] w-[14px] bg-[#8c8c8c] rounded-full" />
    </div>
  )
}

function BuildExerciseRow({ exercise, onRemove }) {
  const info = EXERCISE_LIBRARY[exercise.name] || {}
  const primaryMuscle = info.muscles?.primary?.[0] || ''
  const startXRef = useRef(null)
  const [swipeX, setSwipeX] = useState(0)

  function onTouchStart(e) {
    startXRef.current = e.touches[0].clientX
  }
  function onTouchMove(e) {
    if (startXRef.current === null) return
    const dx = e.touches[0].clientX - startXRef.current
    if (dx < 0) setSwipeX(Math.max(dx, -80))
  }
  function onTouchEnd() {
    if (swipeX < -60) {
      onRemove()
    } else {
      setSwipeX(0)
    }
    startXRef.current = null
  }

  return (
    <div className="relative overflow-hidden rounded-[8px] mb-[8px]">
      {/* Delete background */}
      <div className="absolute inset-0 bg-[#c02727] border-l-4 border-black/10 flex items-center justify-end px-[20px]">
        <span className="font-commons font-semibold text-white text-[14px]">Delete</span>
      </div>
      {/* Card */}
      <div
        style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s ease' : 'none' }}
        className="relative bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] px-[16px] py-[14px] flex items-center gap-[12px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex-1 min-w-0">
          <div className="font-commons font-bold text-[16px] text-white leading-snug truncate">{exercise.name}</div>
          {primaryMuscle && (
            <div className="font-commons text-[13px] text-text-muted leading-snug">{primaryMuscle}</div>
          )}
        </div>
        <DragHandle />
      </div>
    </div>
  )
}

export default function BuildWorkoutScreen() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)

  function addExercise(name) {
    setExercises(prev => [...prev, { name, supersetId: null }])
  }

  function addSuperset(names) {
    const supersetId = Date.now().toString()
    setExercises(prev => [...prev, ...names.map(name => ({ name, supersetId }))])
  }

  function removeExercise(idx) {
    setExercises(prev => prev.filter((_, i) => i !== idx))
  }

  function handleDiscard() {
    navigate(-1)
  }

  function handleStartWorkout() {
    navigate('/workout', {
      state: { mode: 'custom', prebuiltExercises: exercises },
    })
  }

  const hasExercises = exercises.length > 0

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-[16px] pt-[56px] pb-[16px] border-b border-[rgba(255,255,255,0.1)] flex-shrink-0">
        {hasExercises ? (
          <>
            <h1 className="font-judge text-[26px] leading-none text-white">Build Workout</h1>
            <button
              onClick={handleDiscard}
              className="font-commons font-bold text-[18px] text-accent"
            >
              Discard
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate(-1)} className="p-[4px] -ml-[4px]">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="font-judge text-[26px] leading-none text-white">Build Workout</h1>
            <button onClick={() => setSearchOpen(true)} className="p-[4px] -mr-[4px]">
              <Plus size={24} className="text-white" />
            </button>
          </>
        )}
      </div>

      {/* Content */}
      {!hasExercises ? (
        <div className="flex-1 flex items-center justify-center px-[16px]">
          <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] py-[36px] px-[16px] w-full flex flex-col items-center gap-[12px]">
            <div className="w-[48px] h-[48px] rounded-full bg-[rgba(242,166,85,0.15)] flex items-center justify-center">
              <Plus size={24} className="text-accent" />
            </div>
            <div className="text-center">
              <p className="font-commons font-semibold text-[18px] text-white">No exercises yet.</p>
              <p className="font-commons text-[14px] text-text-muted mt-[4px]">Add exercises to build your workout</p>
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="bg-accent text-black font-commons font-bold text-[14px] rounded-[6px] px-[20px] py-[10px] mt-[4px]"
            >
              Add Exercise
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-[16px] pt-[16px] pb-[8px]">
            {exercises.map((ex, i) => (
              <BuildExerciseRow
                key={i}
                exercise={ex}
                onRemove={() => removeExercise(i)}
              />
            ))}
            <div className="flex gap-[8px] mt-[8px]">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex-1 py-[12px] font-commons font-bold text-[14px] text-white/50 border border-white/10 rounded-[6px]"
              >
                Add Exercise
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="flex-1 py-[12px] font-commons font-bold text-[14px] text-white/50 border border-white/10 rounded-[6px]"
              >
                Add Superset
              </button>
            </div>
          </div>
          <div className="flex-shrink-0 px-[16px] pb-[34px] pt-[12px] bg-bg-primary">
            <PrimaryButton onClick={handleStartWorkout}>Start Workout</PrimaryButton>
          </div>
        </>
      )}

      <ExerciseSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={addExercise}
        onAddSuperset={addSuperset}
      />
    </div>
  )
}
