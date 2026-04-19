// src/components/workout/ExerciseBlock.jsx
import { useState, useEffect } from 'react'
import { Clock, Check, Trash2 } from 'lucide-react'
import SetRow from './SetRow'
import { EXERCISE_LIBRARY } from '@/lib/exercises'
import ExerciseHistorySheet from './ExerciseHistorySheet'
import ExerciseInfoSheet from './ExerciseInfoSheet'

export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete, isProgramMode = false, onRemoveSet, isInSuperset = false, isSelected = false, onSelect, onAddSet, isActive = false, onRemove }) {
  const [infoOpen, setInfoOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const info = EXERCISE_LIBRARY[exercise.name] || {}
  const primaryMuscle = info.muscles?.primary?.[0] || ''

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

  return (
    <div className={`bg-bg-card rounded-2xl border border-bg-tertiary p-4 ${isInSuperset ? 'mb-0' : 'mb-3'}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3 cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        {onSelect && (
          <button
            onClick={onSelect}
            className={`mr-3 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-accent border-accent' : 'border-text-muted'}`}
          >
            {isSelected && <Check size={10} className="text-black" />}
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className="font-bold text-text-primary text-base cursor-pointer hover:text-accent transition-colors"
              onClick={e => { e.stopPropagation(); setInfoOpen(true) }}
            >
              {exercise.name}
            </div>
            {collapsed && sets.every(s => s.completed) && (
              <span className="text-xs text-success font-semibold">Done</span>
            )}
          </div>
          {primaryMuscle && <div className="text-xs text-text-secondary">{primaryMuscle}</div>}
          {exercise.reps && (
            <div className="text-xs text-text-muted mt-0.5">
              {exercise.sets} × {exercise.reps} reps
            </div>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); setHistoryOpen(true) }}
          className="p-2 text-text-muted hover:text-accent transition-colors"
        >
          <Clock size={16} />
        </button>
        {onRemove && (
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            className="p-2 text-text-muted hover:text-danger transition-colors flex-shrink-0"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {!collapsed && (
        <>
          {/* Column headers */}
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6" />
            <span className="flex-1 text-center text-xs text-text-muted">Weight</span>
            <span className="flex-1 text-center text-xs text-text-muted">Reps</span>
            <span className="w-16 text-center text-xs text-text-muted">RPE</span>
            <span className="w-11" />
          </div>

          {/* Sets */}
          {sets.map((set, i) => (
            <SetRow
              key={i}
              setNumber={i + 1}
              set={set}
              onChange={updated => updateSet(i, updated)}
              onComplete={() => onSetComplete(exIdx, i)}
              onRemove={onRemoveSet && sets.length > 1 ? () => onRemoveSet(i) : undefined}
              highlighted={i === firstUncompletedIdx}
            />
          ))}

          {!isProgramMode && (
            <button
              onClick={addSet}
              className="w-full mt-2 py-2 text-xs text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
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
