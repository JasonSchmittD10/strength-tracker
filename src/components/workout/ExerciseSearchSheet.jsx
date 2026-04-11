import { useState, useRef, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import { EXERCISE_LIBRARY } from '@/lib/exercises'

// Maps each primary muscle string to a display group
const MUSCLE_TO_GROUP = {
  Chest: 'Chest',
  'Upper Chest': 'Chest',
  Lats: 'Back',
  'Mid/Upper Back': 'Back',
  'Mid Back': 'Back',
  'Front Delts': 'Shoulders',
  Shoulders: 'Shoulders',
  'Lateral Delts': 'Shoulders',
  'Rear Delts': 'Shoulders',
  Triceps: 'Arms',
  'Triceps (Long Head)': 'Arms',
  Biceps: 'Arms',
  'Biceps (Long Head)': 'Arms',
  Brachialis: 'Arms',
  Brachioradialis: 'Arms',
  Quads: 'Legs',
  Glutes: 'Legs',
  Hamstrings: 'Legs',
  Gastrocnemius: 'Legs',
  Soleus: 'Legs',
}

const GROUP_ORDER = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs']

const ALL_EXERCISES = Object.keys(EXERCISE_LIBRARY).map(name => {
  const primaryMuscle = EXERCISE_LIBRARY[name].muscles?.primary?.[0] || ''
  return {
    name,
    primaryMuscle,
    group: MUSCLE_TO_GROUP[primaryMuscle] || 'Other',
  }
})

const GROUPED_EXERCISES = GROUP_ORDER.reduce((acc, group) => {
  const exs = ALL_EXERCISES.filter(e => e.group === group)
  if (exs.length) acc[group] = exs
  return acc
}, {})

export default function ExerciseSearchSheet({ open, onClose, onAdd }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      // Small delay lets the sheet animate in before focus
      const t = setTimeout(() => inputRef.current?.focus(), 120)
      return () => clearTimeout(t)
    } else {
      setQuery('')
    }
  }, [open])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? ALL_EXERCISES.filter(ex =>
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscle.toLowerCase().includes(q)
      )
    : null

  function handleSelect(name) {
    onAdd(name)
    onClose()
  }

  return (
    <SlideUpSheet open={open} onClose={onClose} title="Add Exercise" heightClass="h-[90vh]">
      <div className="mb-3 flex-shrink-0">
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search exercises"
          placeholder="Search exercises or muscle group…"
          className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 -mx-5 px-5">
        {filtered ? (
          <>
            {filtered.map(ex => <ExerciseRow key={ex.name} exercise={ex} onSelect={handleSelect} />)}
            {filtered.length === 0 && (
              <p className="text-center text-text-muted text-sm py-10">No exercises found</p>
            )}
          </>
        ) : (
          Object.entries(GROUPED_EXERCISES).map(([group, exercises]) => (
            <div key={group} className="mb-5">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                {group}
              </div>
              {exercises.map(ex => <ExerciseRow key={ex.name} exercise={ex} onSelect={handleSelect} />)}
            </div>
          ))
        )}
      </div>
    </SlideUpSheet>
  )
}

function ExerciseRow({ exercise, onSelect }) {
  return (
    <button
      onClick={() => onSelect(exercise.name)}
      className="w-full flex items-center justify-between py-3 border-b border-bg-tertiary last:border-0 text-left"
    >
      <div>
        <div className="text-sm font-medium text-text-primary">{exercise.name}</div>
        <div className="text-xs text-text-muted">{exercise.primaryMuscle}</div>
      </div>
      <ChevronRight size={16} className="text-text-muted flex-shrink-0 ml-2" aria-hidden="true" />
    </button>
  )
}
