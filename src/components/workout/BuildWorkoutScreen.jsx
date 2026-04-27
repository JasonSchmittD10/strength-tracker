import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrimaryButton from '@/components/shared/PrimaryButton'
import BuildWorkoutHeader from './BuildWorkoutHeader'
import BuildWorkoutEmptyState from './BuildWorkoutEmptyState'
import ExerciseSearchSheet from './ExerciseSearchSheet'
import supersetIcon from '@/assets/icons/icon-superset.svg'
import plusSmIcon from '@/assets/icons/icon-plus-sm.svg'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeDisplayGroups(exList) {
  const groups = []
  const seen = new Set()
  for (let i = 0; i < exList.length; i++) {
    if (seen.has(i)) continue
    const ex = exList[i]
    if (ex.supersetId) {
      const indices = exList
        .map((e, j) => e.supersetId === ex.supersetId ? j : -1)
        .filter(j => j !== -1)
      if (indices.length >= 2) {
        indices.forEach(j => seen.add(j))
        groups.push({ type: 'superset', id: ex.supersetId, indices })
      } else {
        groups.push({ type: 'single', index: i })
      }
    } else {
      groups.push({ type: 'single', index: i })
    }
  }
  return groups
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// Transform (translateY) and z-index are applied by the parent wrapper in the
// render loop, so BuildExerciseRow is purely a visual/swipe component.
function BuildExerciseRow({ exercise, onRemove, onDragStart }) {
  const startXRef = useRef(null)
  const swipeXAtStartRef = useRef(0)
  const [swipeX, setSwipeX] = useState(0)

  function onCardTouchStart(e) {
    startXRef.current = e.touches[0].clientX
    swipeXAtStartRef.current = swipeX
  }
  function onCardTouchMove(e) {
    if (startXRef.current === null) return
    const dx = e.touches[0].clientX - startXRef.current
    setSwipeX(Math.min(0, Math.max(swipeXAtStartRef.current + dx, -80)))
  }
  function onCardTouchEnd() {
    if (swipeX < -40) setSwipeX(-80)
    else setSwipeX(0)
    startXRef.current = null
  }

  function onHandleTouchStart(e) {
    e.stopPropagation() // prevent card's swipe handler from consuming this touch
    onDragStart(e.touches[0].clientY)
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-[rgba(255,255,255,0.1)]">
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
        <div className="flex-1 min-w-0 bg-[rgba(255,255,255,0.05)] px-[16px] py-[16px] flex items-center gap-[8px]">
          <div className="flex-1 min-w-0">
            <div className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19] truncate">
              {exercise.name}
            </div>
          </div>
          <DragHandle onTouchStart={onHandleTouchStart} />
        </div>
        <div
          className="w-[80px] bg-[#c02727] border-l-4 border-[rgba(0,0,0,0.1)] flex items-center justify-center flex-shrink-0"
          onClick={onRemove}
        >
          <span className="font-commons font-bold text-white text-[14px] tracking-[-0.28px]">Delete</span>
        </div>
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BuildWorkoutScreen() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [dragState, setDragState] = useState(null)
  // dragState: { fromGroupIndex, startY, currentY }

  // Refs let document-level handlers always read fresh values without
  // re-registering listeners on every state change.
  const dragStateRef = useRef(null)
  const exercisesRef = useRef([])
  useEffect(() => { exercisesRef.current = exercises }, [exercises])

  // One ref slot per display group — populated via ref callbacks in the render loop.
  // offsetTop / offsetHeight are unaffected by CSS transforms, so they give the
  // natural layout positions even while a drag is in progress.
  const groupRefs = useRef([])
  const groupNaturalTopsRef = useRef([])
  const groupNaturalHeightsRef = useRef([])

  // ── Document-level drag listeners (registered once) ──────────────────────
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
      const { fromGroupIndex, startY, currentY } = dragStateRef.current
      const offset = currentY - startY
      const toGroupIndex = resolveTargetGroup(fromGroupIndex, offset)

      dragStateRef.current = null
      groupNaturalTopsRef.current = []
      groupNaturalHeightsRef.current = []
      setDragState(null)

      if (toGroupIndex !== fromGroupIndex) {
        setExercises(prev => {
          const groups = computeDisplayGroups(prev)
          // Turn each group into a chunk of exercise objects, reorder chunks, flatten
          const chunks = groups.map(g =>
            g.type === 'single' ? [prev[g.index]] : g.indices.map(i => prev[i])
          )
          const [moved] = chunks.splice(fromGroupIndex, 1)
          chunks.splice(toGroupIndex, 0, moved)
          return chunks.flat()
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

  // ── Drag helpers ─────────────────────────────────────────────────────────

  // Find which group slot the dragged group's center is closest to
  function resolveTargetGroup(fromGroupIndex, offset) {
    const tops = groupNaturalTopsRef.current
    const heights = groupNaturalHeightsRef.current
    if (!tops.length) return fromGroupIndex

    const dragCenterY = tops[fromGroupIndex] + heights[fromGroupIndex] / 2 + offset
    let closest = fromGroupIndex
    let closestDist = Infinity
    tops.forEach((top, i) => {
      const dist = Math.abs(dragCenterY - (top + heights[i] / 2))
      if (dist < closestDist) { closestDist = dist; closest = i }
    })
    return closest
  }

  function startGroupDrag(groupIndex, clientY) {
    groupNaturalTopsRef.current = groupRefs.current.map(el => el?.offsetTop ?? 0)
    groupNaturalHeightsRef.current = groupRefs.current.map(el => el?.offsetHeight ?? 63)
    const state = { fromGroupIndex: groupIndex, startY: clientY, currentY: clientY }
    dragStateRef.current = state
    setDragState(state)
  }

  function getGroupTranslate(groupIndex) {
    if (!dragState) return 0
    const { fromGroupIndex, startY, currentY } = dragState
    const offset = currentY - startY
    const target = resolveTargetGroup(fromGroupIndex, offset)
    if (groupIndex === fromGroupIndex) return offset

    const heights = groupNaturalHeightsRef.current
    const GAP = 8 // matches gap-[8px] on the list container
    const fromHeight = (heights[fromGroupIndex] ?? 63) + GAP

    if (fromGroupIndex < target) {
      if (groupIndex > fromGroupIndex && groupIndex <= target) return -fromHeight
    } else if (fromGroupIndex > target) {
      if (groupIndex >= target && groupIndex < fromGroupIndex) return fromHeight
    }
    return 0
  }

  // ── Exercise mutations ────────────────────────────────────────────────────

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
    navigate('/workout', { state: { mode: 'custom', prebuiltExercises: exercises } })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const hasExercises = exercises.length > 0
  const displayGroups = computeDisplayGroups(exercises)

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
            {displayGroups.map((group, gi) => {
              const isDragging = dragState?.fromGroupIndex === gi
              const wrapperStyle = {
                transform: `translateY(${getGroupTranslate(gi)}px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease',
                zIndex: isDragging ? 10 : 1,
                position: 'relative',
              }

              if (group.type === 'single') {
                const i = group.index
                return (
                  <div
                    key={exercises[i].id ?? i}
                    ref={el => { groupRefs.current[gi] = el }}
                    style={wrapperStyle}
                  >
                    <BuildExerciseRow
                      exercise={exercises[i]}
                      onRemove={() => removeExercise(i)}
                      onDragStart={(y) => startGroupDrag(gi, y)}
                    />
                  </div>
                )
              }

              // Superset group
              return (
                <div
                  key={group.id}
                  ref={el => { groupRefs.current[gi] = el }}
                  style={wrapperStyle}
                  className="border border-[#2d2d2d] rounded-[16px] p-[12px] flex flex-col gap-[12px]"
                >
                  {/* Header: label left, drag handle right */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[8px]">
                      <img src={supersetIcon} alt="" className="w-[16px] h-[16px] flex-shrink-0" />
                      <span className="font-commons font-semibold text-[#8b8b8b] text-[14px] tracking-[0.28px]">SUPERSET</span>
                    </div>
                    <div
                      className="flex flex-col gap-[4px] px-[4px] py-[6px] touch-none select-none"
                      onTouchStart={e => { e.stopPropagation(); startGroupDrag(gi, e.touches[0].clientY) }}
                    >
                      <div className="h-[2px] w-[14px] bg-[#8c8c8c]" />
                      <div className="h-[2px] w-[14px] bg-[#8c8c8c]" />
                    </div>
                  </div>
                  {/* Exercise rows — no individual drag within a superset */}
                  {group.indices.map(i => (
                    <BuildExerciseRow
                      key={exercises[i].id ?? i}
                      exercise={exercises[i]}
                      onRemove={() => removeExercise(i)}
                      onDragStart={() => {}}
                    />
                  ))}
                </div>
              )
            })}

            {/* Inline "Add Exercise" — always visible below the list per Figma 114-2786 */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full mt-[4px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons font-bold text-[18px] text-white tracking-[-0.36px] flex items-center justify-center gap-[8px]"
            >
              <img src={plusSmIcon} alt="" className="w-[14px] h-[14px] flex-shrink-0 brightness-0 invert" />
              Add Exercise
            </button>
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
