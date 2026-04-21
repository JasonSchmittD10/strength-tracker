import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PrimaryButton from '@/components/shared/PrimaryButton'
import BuildWorkoutHeader from './BuildWorkoutHeader'
import BuildWorkoutEmptyState from './BuildWorkoutEmptyState'
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
    if (swipeX < -60) onRemove()
    else setSwipeX(0)
    startXRef.current = null
  }

  return (
    <div className="relative overflow-hidden rounded-[8px]">
      <div className="absolute inset-0 bg-[#c02727] flex items-center justify-end px-[20px]">
        <span className="font-commons font-semibold text-white text-[14px]">Delete</span>
      </div>
      <div
        style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s ease' : 'none' }}
        className="relative bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] px-[16px] py-[14px] flex items-center gap-[12px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex-1 min-w-0">
          <div className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19] truncate">{exercise.name}</div>
          {primaryMuscle && (
            <div className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">{primaryMuscle}</div>
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

  function handleStartWorkout() {
    navigate('/workout', {
      state: { mode: 'custom', prebuiltExercises: exercises },
    })
  }

  const hasExercises = exercises.length > 0

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <BuildWorkoutHeader
        onBack={() => navigate(-1)}
        onAdd={() => setSearchOpen(true)}
      />

      {!hasExercises ? (
        <div className="flex-1 flex items-center justify-center px-[16px]">
          <BuildWorkoutEmptyState onAdd={() => setSearchOpen(true)} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-[16px] pt-[16px] pb-[8px] flex flex-col gap-[8px]">
            {exercises.map((ex, i) => (
              <BuildExerciseRow
                key={i}
                exercise={ex}
                onRemove={() => removeExercise(i)}
              />
            ))}
          </div>
          <div className="flex-shrink-0 px-[16px] pb-[34px] pt-[12px] bg-bg-primary border-t border-[rgba(255,255,255,0.1)] flex flex-col gap-[8px]">
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
