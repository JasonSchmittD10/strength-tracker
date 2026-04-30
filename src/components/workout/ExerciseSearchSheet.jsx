import { useState, useRef, useEffect, useMemo } from 'react'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import PrimaryButton from '@/components/shared/PrimaryButton'
import ExerciseTile from './ExerciseTile'
import { useAlphaGroupedExercises } from '@/hooks/useExerciseLibrary'
import xmarkIcon from '@/assets/icons/icon-xmark.svg'
import searchIcon from '@/assets/icons/icon-search.svg'
import plusSmIcon from '@/assets/icons/icon-plus-sm.svg'

export default function ExerciseSearchSheet({ open, onClose, onAdd, onAddSuperset }) {
  const { data: allExercises = [], groups: alphaGroups = {}, isLoading } = useAlphaGroupedExercises()
  const [query, setQuery] = useState('')
  const [selections, setSelections] = useState(new Set())
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150)
      return () => clearTimeout(t)
    } else {
      setQuery('')
      setSelections(new Set())
    }
  }, [open])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return null
    return allExercises.filter(ex =>
      ex.name.toLowerCase().includes(q) ||
      ex.primaryMuscle.toLowerCase().includes(q)
    )
  }, [q, allExercises])

  function toggleSelection(name) {
    setSelections(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function handleAddExercise() {
    selections.forEach(name => onAdd(name))
    onClose()
  }

  function handleAddSuperset() {
    onAddSuperset([...selections])
    onClose()
  }

  const footer = (
    <div className="flex gap-[8px] pb-[8px]">
      <PrimaryButton
        variant="secondary"
        onClick={handleAddExercise}
        disabled={selections.size === 0}
      >
        <img src={plusSmIcon} alt="" className="w-[14px] h-[14px] mr-[8px] flex-shrink-0 brightness-0 invert" />
        {selections.size > 0 ? `Add Exercise (${selections.size})` : 'Add Exercise'}
      </PrimaryButton>
      <PrimaryButton
        variant="secondary"
        onClick={handleAddSuperset}
        disabled={selections.size < 2}
      >
        <img src={plusSmIcon} alt="" className="w-[14px] h-[14px] mr-[8px] flex-shrink-0 brightness-0 invert" />
        Add Superset
      </PrimaryButton>
    </div>
  )

  const stickyHeader = (
    <div className="pb-[24px]">
      {/* Header row */}
      <div className="flex items-start gap-[10px]">
        <h2 className="flex-1 font-judge text-[26px] leading-[1.2] text-white">
          Select Exercise(s) to Add
        </h2>
        <button onClick={onClose} className="flex-shrink-0 mt-[4px]" aria-label="Close">
          <img src={xmarkIcon} alt="" className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Search input */}
      <div className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-[4px] flex items-center gap-[10px] px-[10px] py-[12px] mt-[24px]">
        <img src={searchIcon} alt="" className="w-[16px] h-[16px] flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for an exercise..."
          className="flex-1 bg-transparent font-commons text-[18px] text-white placeholder-[rgba(255,255,255,0.6)] tracking-[-0.5px] leading-[1.19] focus:outline-none"
        />
      </div>
    </div>
  )

  return (
    <SlideUpSheet open={open} onClose={onClose} topOffset={48} footer={footer} stickyHeader={stickyHeader}>
      {/* Exercise list */}
      {isLoading ? (
        <p className="text-center font-commons text-[16px] text-[#8b8b8b] py-[24px]">
          Loading exercises…
        </p>
      ) : filtered ? (
        <div className="flex flex-col gap-[12px] pb-[16px]">
          {filtered.map(ex => (
            <ExerciseTile
              key={ex.name}
              exercise={ex}
              isSelected={selections.has(ex.name)}
              onSelect={toggleSelection}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-center font-commons text-[16px] text-[#8b8b8b] py-[24px]">
              No exercises found
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-[24px] pb-[16px]">
          {Object.entries(alphaGroups).map(([letter, exercises]) => (
            <div key={letter} className="flex flex-col gap-[16px]">
              <p className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19]">
                {letter}
              </p>
              <div className="flex flex-col gap-[12px]">
                {exercises.map(ex => (
                  <ExerciseTile
                    key={ex.name}
                    exercise={ex}
                    isSelected={selections.has(ex.name)}
                    onSelect={toggleSelection}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SlideUpSheet>
  )
}
