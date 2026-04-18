import { useState, useRef, useEffect } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import { EXERCISE_LIBRARY } from '@/lib/exercises'

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
  return { name, primaryMuscle, group: MUSCLE_TO_GROUP[primaryMuscle] || 'Other' }
})

const GROUPED_EXERCISES = GROUP_ORDER.reduce((acc, group) => {
  const exs = ALL_EXERCISES.filter(e => e.group === group)
  if (exs.length) acc[group] = exs
  return acc
}, {})

export default function ExerciseSearchSheet({ open, onClose, onAdd, onAddSuperset }) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('single')          // 'single' | 'superset'
  const [supersetSelections, setSupersetSelections] = useState(new Set())
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120)
      return () => clearTimeout(t)
    } else {
      setQuery('')
      setMode('single')
      setSupersetSelections(new Set())
    }
  }, [open])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? ALL_EXERCISES.filter(ex =>
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscle.toLowerCase().includes(q)
      )
    : null

  function handleRowTap(name) {
    if (mode === 'single') {
      onAdd(name)
      onClose()
    } else {
      setSupersetSelections(prev => {
        const next = new Set(prev)
        next.has(name) ? next.delete(name) : next.add(name)
        return next
      })
    }
  }

  function handleSupersetConfirm() {
    onAddSuperset([...supersetSelections])
    setSupersetSelections(new Set())
    setMode('single')
    onClose()
  }

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={() => { setMode('single'); setSupersetSelections(new Set()) }}
        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
          mode === 'single'
            ? 'bg-accent text-black'
            : 'bg-bg-card border border-bg-tertiary text-text-muted'
        }`}
      >
        Add Exercise
      </button>
      <button
        onClick={() => {
          if (mode === 'single') {
            setMode('superset')
          } else if (supersetSelections.size >= 2) {
            handleSupersetConfirm()
          }
        }}
        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
          mode === 'superset' && supersetSelections.size >= 2
            ? 'bg-accent text-black'
            : mode === 'superset'
            ? 'bg-bg-card border border-accent/50 text-accent'
            : 'bg-bg-card border border-bg-tertiary text-text-muted'
        }`}
      >
        {mode === 'superset' && supersetSelections.size >= 2
          ? `Add Superset (${supersetSelections.size})`
          : 'Add Superset'}
      </button>
    </div>
  )

  return (
    <SlideUpSheet open={open} onClose={onClose} title="Add Exercise" heightClass="h-[90vh]" footer={footer}>
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
            {filtered.map(ex => (
              <ExerciseRow
                key={ex.name}
                exercise={ex}
                onSelect={handleRowTap}
                selectable={mode === 'superset'}
                isSelected={supersetSelections.has(ex.name)}
              />
            ))}
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
              {exercises.map(ex => (
                <ExerciseRow
                  key={ex.name}
                  exercise={ex}
                  onSelect={handleRowTap}
                  selectable={mode === 'superset'}
                  isSelected={supersetSelections.has(ex.name)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </SlideUpSheet>
  )
}

function ExerciseRow({ exercise, onSelect, selectable, isSelected }) {
  return (
    <button
      onClick={() => onSelect(exercise.name)}
      className="w-full flex items-center justify-between py-3 border-b border-bg-tertiary last:border-0 text-left"
    >
      <div>
        <div className="text-sm font-medium text-text-primary">{exercise.name}</div>
        <div className="text-xs text-text-muted">{exercise.primaryMuscle}</div>
      </div>
      {selectable ? (
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 transition-colors ${
          isSelected ? 'bg-accent border-accent' : 'border-bg-tertiary'
        }`}>
          {isSelected && <Check size={10} className="text-black" />}
        </div>
      ) : (
        <ChevronRight size={16} className="text-text-muted flex-shrink-0 ml-2" aria-hidden="true" />
      )}
    </button>
  )
}
