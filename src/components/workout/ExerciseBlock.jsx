// src/components/workout/ExerciseBlock.jsx
import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import SetRow from './SetRow'
import { EXERCISE_LIBRARY } from '@/lib/exercises'
import ExerciseHistorySheet from './ExerciseHistorySheet'

export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete, isProgramMode = false }) {
  const [cuesOpen, setCuesOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const info = EXERCISE_LIBRARY[exercise.name] || {}
  const primaryMuscle = info.muscles?.primary?.[0] || ''

  function updateSet(setIdx, updated) {
    const next = sets.map((s, i) => i === setIdx ? updated : s)
    onChange(next)
  }

  function addSet() {
    const last = sets[sets.length - 1] || {}
    onChange([...sets, { weight: last.weight || '', reps: last.reps || '', rpe: '', completed: false }])
  }

  return (
    <div className="bg-bg-card rounded-2xl border border-bg-tertiary p-4 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-text-primary text-base">{exercise.name}</div>
          {primaryMuscle && <div className="text-xs text-text-secondary">{primaryMuscle}</div>}
          {exercise.reps && (
            <div className="text-xs text-text-muted mt-0.5">
              {exercise.sets} × {exercise.reps} reps
            </div>
          )}
        </div>
        <button onClick={() => setHistoryOpen(true)} className="p-2 text-text-muted hover:text-accent transition-colors">
          <Clock size={16} />
        </button>
      </div>

      {/* Cues toggle */}
      {info.cues?.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setCuesOpen(v => !v)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Coaching cues {cuesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {cuesOpen && (
            <ul className="mt-2 space-y-1">
              {info.cues.map((cue, i) => (
                <li key={i} className="text-xs text-text-secondary pl-2 border-l border-accent/30">{cue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6" />
        <span className="flex-1 text-center text-xs text-text-muted">Weight</span>
        <span className="flex-1 text-center text-xs text-text-muted">Reps</span>
        <span className="w-16 text-center text-xs text-text-muted">RPE</span>
        <span className="w-9" />
      </div>

      {/* Sets */}
      {sets.map((set, i) => (
        <SetRow
          key={i}
          setNumber={i + 1}
          set={set}
          onChange={updated => updateSet(i, updated)}
          onComplete={() => onSetComplete(exIdx, i)}
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

      <ExerciseHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        exerciseName={exercise.name}
      />
    </div>
  )
}
