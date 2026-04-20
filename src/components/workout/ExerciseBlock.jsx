// src/components/workout/ExerciseBlock.jsx
import { useState, useEffect } from 'react'
import { Clock, Trash2, Check } from 'lucide-react'
import SetRow from './SetRow'
import { EXERCISE_LIBRARY } from '@/lib/exercises'
import ExerciseHistorySheet from './ExerciseHistorySheet'
import ExerciseInfoSheet from './ExerciseInfoSheet'

export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete, isProgramMode = false, onRemoveSet, isInSuperset = false, isSelected = false, onSelect, onAddSet, isActive = false, onRemove, isBuilderMode = false }) {
  const [infoOpen, setInfoOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const info = EXERCISE_LIBRARY[exercise.name] || {}
  const primaryMuscle = info.muscles?.primary?.[0] || ''
  const inputType = info.inputType ?? 'reps'

  useEffect(() => {
    if (sets.length > 0 && sets.every(s => s.completed)) {
      setCollapsed(true)
    }
  }, [sets])

  function updateSet(setIdx, updated) {
    let next = sets.map((s, i) => i === setIdx ? updated : s)
    if (updated.weight !== sets[setIdx]?.weight) {
      next = next.map((s, i) =>
        i > setIdx && !s.completed ? { ...s, weight: updated.weight } : s
      )
    }
    onChange(next)
  }

  function addSet() {
    if (onAddSet) {
      onAddSet()
    } else {
      const last = sets[sets.length - 1] || {}
      onChange([...sets, { weight: last.weight || '', reps: last.reps || '', rpe: '', completed: false }])
    }
  }

  const firstUncompletedIdx = isActive ? sets.findIndex(s => !s.completed) : -1

  const metaParts = []
  if (primaryMuscle) metaParts.push(primaryMuscle)
  if (exercise.sets && exercise.reps) metaParts.push(`${exercise.sets}×${exercise.reps} ${inputType === 'time' ? 'sec' : 'reps'}`)
  if (exercise.tempo) metaParts.push(`Tempo ${exercise.tempo}`)

  return (
    <div className={`bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px] ${isInSuperset ? 'mb-0' : 'mb-[12px]'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-[16px]">
        <div className="flex items-center gap-[10px] flex-1 min-w-0">
          {onSelect && (
            <button
              onClick={onSelect}
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-accent border-accent' : 'border-text-muted'}`}
            >
              {isSelected && <Check size={10} className="text-black" />}
            </button>
          )}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setCollapsed(c => !c)}
          >
            <div className="flex items-center gap-[8px]">
              <span
                className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-snug"
                onClick={e => { e.stopPropagation(); setInfoOpen(true) }}
              >
                {exercise.name}
              </span>
              {collapsed && sets.every(s => s.completed) && (
                <span className="text-xs text-success font-semibold">Done</span>
              )}
            </div>
            {metaParts.length > 0 && (
              <div className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-snug mt-[2px]">
                {metaParts.join(' · ')}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-[16px] flex-shrink-0 ml-[12px]">
          <button
            onClick={e => { e.stopPropagation(); setHistoryOpen(true) }}
            className="text-[#8b8b8b] hover:text-accent transition-colors"
          >
            <Clock size={16} />
          </button>
          {onRemove && (
            <button
              onClick={e => { e.stopPropagation(); onRemove() }}
              className="text-[#8b8b8b] hover:text-danger transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Sets — no standalone column header row; labels are in SetRow for first row only */}
          {sets.map((set, i) => (
            <SetRow
              key={i}
              setNumber={i + 1}
              set={set}
              onChange={updated => updateSet(i, updated)}
              onComplete={() => onSetComplete(exIdx, i)}
              onRemove={onRemoveSet && sets.length > 1 ? () => onRemoveSet(i) : undefined}
              highlighted={i === firstUncompletedIdx}
              hideComplete={isBuilderMode}
              inputType={inputType}
              showLabels={i === 0}
            />
          ))}

          {!isProgramMode && (
            <button
              onClick={addSet}
              className="w-full mt-[12px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[4px] px-[12px] py-[10px] font-commons font-bold text-[14px] text-white"
            >
              + Add Set
            </button>
          )}
        </>
      )}

      <ExerciseHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        exerciseName={exercise.name}
      />

      <ExerciseInfoSheet
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        exerciseName={exercise.name}
      />
    </div>
  )
}
