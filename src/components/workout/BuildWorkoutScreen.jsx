import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrimaryButton from '@/components/shared/PrimaryButton'
import BuildWorkoutHeader from './BuildWorkoutHeader'
import BuildWorkoutEmptyState from './BuildWorkoutEmptyState'
import ExerciseSearchSheet from './ExerciseSearchSheet'
import supersetIcon from '@/assets/icons/icon-superset.svg'

// Approximate item height (py-16 padding = 32px + ~21px text + 2px border) + 8px gap
const ITEM_HEIGHT = 63

function DragHandle({ onTouchStart }) {
  return (
    <div
      className="flex flex-col gap-[4px] flex-shrink-0 p-[10px] touch-none select-none"
      onTouchStart={onTouchStart}
    >
      <div className="h-[2px] w-[14px] bg-[#8c8c8c]" />
      <div className="h-[2px] w-[14px] bg-[#8c8c8c]" />
    </div>
  )
}

function BuildExerciseRow({ exercise, onRemove, onDragStart, translateY, isDragging }) {
  const startXRef = useRef(null)
  const swipeXAtStartRef = useRef(0)
  const [swipeX, setSwipeX] = useState(0)

  // Reset swipe if row becomes the dragged item
  useEffect(() => {
    if (isDragging) setSwipeX(0)
  }, [isDragging])

  function onCardTouchStart(e) {
    startXRef.current = e.touches[0].clientX
    swipeXAtStartRef.current = swipeX
  }
  function onCardTouchMove(e) {
    if (startXRef.current === null) return
    const dx = e.touches[0].clientX - startXRef.current
    const next = swipeXAtStartRef.current + dx
    setSwipeX(Math.min(0, Math.max(next, -80)))
  }
  function onCardTouchEnd() {
    // Snap open (reveal delete) or snap closed — never auto-delete
    if (swipeX < -40) setSwipeX(-80)
    else setSwipeX(0)
    startXRef.current = null
  }

  function onHandleTouchStart(e) {
    // Stop propagation so the card swipe handler doesn't pick up this touch
    e.stopPropagation()
    onDragStart(e.touches[0].clientY)
  }

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 0.15s ease',
        zIndex: isDragging ? 10 : 1,
        position: 'relative',
      }}
    >
      {/* Outer container: provides border, rounded corners, and clips the sliding inner row */}
      <div className="overflow-hidden rounded-[8px] border border-[rgba(255,255,255,0.1)]">
        {/* Inner flex row: wider than container, slides left to reveal delete panel */}
        <div
          style={{
            transform: `translateX(${swipeX}px)`,
            transition: startXRef.current === null ? 'transform 0.2s ease' : 'none',
            width: 'calc(100% + 80px)',
          }}
          className="flex"
          onTouchStart={onCardTouchStart}
          onTouchMove={onCardTouchMove}
          onTouchEnd={onCardTouchEnd}
        >
          {/* Card content — solid enough bg so nothing bleeds through */}
          <div className="flex-1 min-w-0 bg-[rgba(255,255,255,0.05)] px-[16px] py-[16px] flex items-center gap-[8px]">
            <div className="flex-1 min-w-0">
              <div className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19] truncate">
                {exercise.name}
              </div>
            </div>
            <DragHandle onTouchStart={onHandleTouchStart} />
          </div>

          {/* Delete panel — sibling in the flex row, not an overlay */}
          <div
            className="w-[80px] bg-[#c02727] border-l-4 border-[rgba(0,0,0,0.1)] flex items-center justify-center flex-shrink-0"
            onClick={onRemove}
          >
            <span className="font-commons font-bold text-white text-[14px] tracking-[-0.28px]">Delete</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuildWorkoutScreen() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [dragState, setDragState] = useState(null)
  // dragState: { fromIndex, startY, currentY }

  // Refs so touch event handlers always have fresh data without re-registering
  const dragStateRef = useRef(null)
  const exercisesRef = useRef([])
  useEffect(() => { exercisesRef.current = exercises }, [exercises])

  // Register drag listeners once
  useEffect(() => {
    function onMove(e) {
      if (!dragStateRef.current) return
      e.preventDefault()
      const y = e.touches[0].clientY
      dragStateRef.current.currentY = y
      setDragState(ds => ds ? { ...ds, currentY: y } : null)
    }

    function onEnd() {
      if (!dragStateRef.current) return
      const { fromIndex, startY, currentY } = dragStateRef.current
      const offset = currentY - startY
      const exs = exercisesRef.current
      const toIndex = Math.max(0, Math.min(exs.length - 1, fromIndex + Math.round(offset / ITEM_HEIGHT)))
      dragStateRef.current = null
      setDragState(null)
      if (toIndex !== fromIndex) {
        setExercises(prev => {
          const next = [...prev]
          const [item] = next.splice(fromIndex, 1)
          next.splice(toIndex, 0, item)
          return next
        })
      }
    }

    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    return () => {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [])

  function startDrag(index, clientY) {
    const state = { fromIndex: index, startY: clientY, currentY: clientY }
    dragStateRef.current = state
    setDragState(state)
  }

  function getItemTranslate(itemIndex) {
    if (!dragState) return 0
    const { fromIndex, startY, currentY } = dragState
    const offset = currentY - startY
    const targetIndex = Math.max(
      0,
      Math.min(exercises.length - 1, fromIndex + Math.round(offset / ITEM_HEIGHT))
    )

    if (itemIndex === fromIndex) return offset

    if (fromIndex < targetIndex) {
      // Dragging down: items between fromIndex+1..targetIndex shift up
      if (itemIndex > fromIndex && itemIndex <= targetIndex) return -ITEM_HEIGHT
    } else if (fromIndex > targetIndex) {
      // Dragging up: items between targetIndex..fromIndex-1 shift down
      if (itemIndex >= targetIndex && itemIndex < fromIndex) return ITEM_HEIGHT
    }
    return 0
  }

  function addExercise(name) {
    setExercises(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, name, supersetId: null }])
  }

  function addSuperset(names) {
    const supersetId = Date.now().toString()
    setExercises(prev => [
      ...prev,
      ...names.map(name => ({ id: `${Date.now()}-${Math.random()}`, name, supersetId })),
    ])
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

  // Compute display groups (single exercises or superset bundles)
  const displayGroups = []
  const groupedIndices = new Set()
  for (let i = 0; i < exercises.length; i++) {
    if (groupedIndices.has(i)) continue
    const ex = exercises[i]
    if (ex.supersetId) {
      const indices = exercises
        .map((e, j) => e.supersetId === ex.supersetId ? j : -1)
        .filter(j => j !== -1)
      if (indices.length >= 2) {
        indices.forEach(j => groupedIndices.add(j))
        displayGroups.push({ type: 'superset', id: ex.supersetId, indices })
      } else {
        displayGroups.push({ type: 'single', index: i })
      }
    } else {
      displayGroups.push({ type: 'single', index: i })
    }
  }

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
            {displayGroups.map(group => {
              if (group.type === 'single') {
                const i = group.index
                return (
                  <BuildExerciseRow
                    key={exercises[i].id ?? i}
                    exercise={exercises[i]}
                    onRemove={() => removeExercise(i)}
                    onDragStart={(clientY) => startDrag(i, clientY)}
                    translateY={getItemTranslate(i)}
                    isDragging={dragState?.fromIndex === i}
                  />
                )
              }
              // Superset group
              return (
                <div key={group.id} className="border border-[#2d2d2d] rounded-[16px] p-[12px] flex flex-col gap-[12px]">
                  {/* Superset header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[8px]">
                      <img src={supersetIcon} alt="" className="w-[16px] h-[16px] flex-shrink-0" />
                      <span className="font-commons font-semibold text-[#8b8b8b] text-[14px] tracking-[0.28px]">SUPERSET</span>
                    </div>
                    {/* Drag handle (visual only — group drag is a future enhancement) */}
                    <div className="flex flex-col gap-[4px] px-[4px] py-[6px]">
                      <div className="h-[2px] w-[14px] bg-[#8c8c8c]" />
                      <div className="h-[2px] w-[14px] bg-[#8c8c8c]" />
                    </div>
                  </div>
                  {/* Exercise rows within superset */}
                  {group.indices.map(i => (
                    <BuildExerciseRow
                      key={exercises[i].id ?? i}
                      exercise={exercises[i]}
                      onRemove={() => removeExercise(i)}
                      onDragStart={() => {}}
                      translateY={0}
                      isDragging={false}
                    />
                  ))}
                </div>
              )
            })}
          </div>
          <div className="flex-shrink-0 px-[16px] pb-[34px] pt-[12px] bg-bg-primary border-t border-[rgba(255,255,255,0.1)]">
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
