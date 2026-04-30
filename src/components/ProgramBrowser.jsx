import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PROGRAMS } from '@/lib/programs'
import { getWeeksInMacrocycle } from '@/lib/scheduling'

const GOAL_OPTIONS = [
  { value: 'strength',     label: 'Strength' },
  { value: 'hypertrophy',  label: 'Hypertrophy' },
  { value: 'powerlifting', label: 'Powerlifting' },
  { value: 'hybrid',       label: 'Hybrid' },
  { value: 'endurance',    label: 'Endurance' },
  { value: 'conditioning', label: 'Conditioning' },
]

const DAYS_OPTIONS = [
  { value: '3',  label: '3' },
  { value: '4',  label: '4' },
  { value: '5',  label: '5' },
  { value: '6+', label: '6+' },
]

const EQUIPMENT_OPTIONS = [
  { value: 'barbell',          label: 'Barbell' },
  { value: 'dumbbells',        label: 'Dumbbells' },
  { value: 'cables',           label: 'Cables' },
  { value: 'machines',         label: 'Machines' },
  { value: 'rack',             label: 'Rack' },
  { value: 'pull-up-bar',      label: 'Pull-Up Bar' },
  { value: 'bodyweight',       label: 'Bodyweight' },
  { value: 'cardio-equipment', label: 'Cardio' },
  { value: 'open-space',       label: 'Open Space' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
]

function matchesDays(daysPerWeek, selectedValue) {
  if (selectedValue === '6+') return daysPerWeek >= 6
  return String(daysPerWeek) === selectedValue
}

// Derive a one-word equipment label for the program card (matches Figma "GEAR" stat).
function gearLabel(equipment) {
  if (!equipment?.length) return '—'
  if (equipment.length === 1 && equipment[0] === 'bodyweight') return 'Bodyweight'
  if (equipment.includes('machines') || equipment.length >= 5) return 'Full'
  if (equipment.includes('barbell') && equipment.includes('rack')) return 'Standard'
  return 'Minimal'
}

// ─── Filter dropdown ─────────────────────────────────────────────────────────

function ChevronDown({ open }) {
  return (
    <svg
      width="8" height="5" viewBox="0 0 8 5" fill="none"
      className={`flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M1 1L4 4L7 1" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FilterDropdown({ label, options, selected, isOpen, onClick }) {
  // selected is always an array (single-select wraps in [value])
  let displayLabel
  let active = false
  if (selected.length === 0) {
    displayLabel = label
  } else if (selected.length === 1) {
    displayLabel = options.find(o => o.value === selected[0])?.label ?? label
    active = true
  } else {
    displayLabel = `${label} (${selected.length})`
    active = true
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 w-[114px] bg-[#0a0a0a] border rounded-[4px] flex items-center justify-between gap-[6px] pt-[12px] pb-[11px] px-[10px] transition-colors ${
        isOpen
          ? 'border-accent'
          : active
            ? 'border-[rgba(242,166,85,0.4)]'
            : 'border-[rgba(255,255,255,0.1)]'
      }`}
    >
      <span className={`font-commons text-[18px] tracking-[-0.5px] leading-[1.19] truncate ${
        active || isOpen ? 'text-white' : 'text-[rgba(255,255,255,0.4)]'
      }`}>
        {displayLabel}
      </span>
      <ChevronDown open={isOpen} />
    </button>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 px-[12px] py-[6px] rounded-full font-commons text-[14px] tracking-[-0.2px] transition-colors border ${
        active
          ? 'bg-accent text-black border-accent'
          : 'bg-[rgba(255,255,255,0.05)] text-[#8b8b8b] border-[rgba(255,255,255,0.1)] hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Program card ────────────────────────────────────────────────────────────

function MetaPill({ children }) {
  return (
    <span className="font-commons text-[12px] text-[rgba(255,255,255,0.4)] tracking-[-0.2px] leading-[14px] border border-[rgba(255,255,255,0.1)] rounded-[4px] pt-[4px] pb-[2px] px-[6px] whitespace-nowrap uppercase">
      {children}
    </span>
  )
}

function StatColumn({ label, value }) {
  return (
    <div className="flex flex-col items-start justify-center">
      <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] uppercase whitespace-nowrap">
        {label}
      </span>
      <span className="font-commons font-bold text-[14px] text-white tracking-[-0.28px] whitespace-nowrap">
        {value}
      </span>
    </div>
  )
}

function ProgramCard({ program, onClick }) {
  const meta = program.meta ?? {}
  const weeks = getWeeksInMacrocycle(program)
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:border-accent/40 rounded-[8px] p-[16px] flex flex-col gap-[8px] transition-colors"
    >
      {/* Title row: name + difficulty/goal pills */}
      <div className="flex items-start justify-between gap-[8px] w-full">
        <p className="font-judge font-bold text-[32px] text-white leading-[40px] flex-1 min-w-0 truncate">
          {program.name}
        </p>
        <div className="flex gap-[8px] items-center justify-end flex-shrink-0">
          {meta.difficulty && <MetaPill>{meta.difficulty}</MetaPill>}
          {meta.primaryGoal && <MetaPill>{meta.primaryGoal}</MetaPill>}
        </div>
      </div>

      {/* Description */}
      {program.description && (
        <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] line-clamp-2 w-full">
          {program.description}
        </p>
      )}

      {/* Divider */}
      <div className="h-px w-full bg-[rgba(255,255,255,0.1)]" />

      {/* Stats row */}
      <div className="flex gap-[24px] items-start w-full">
        <StatColumn label="Duration" value={weeks > 0 ? `${weeks} weeks` : '—'} />
        <StatColumn label="Freq" value={meta.daysPerWeek ? `${meta.daysPerWeek}/wk` : '—'} />
        <StatColumn label="Gear" value={gearLabel(meta.equipment)} />
        <StatColumn label="Avg Session" value={meta.timePerSession ? `${meta.timePerSession} min` : '—'} />
      </div>
    </button>
  )
}

// ─── Main browser ────────────────────────────────────────────────────────────

export default function ProgramBrowser({ onSelect }) {
  const navigate = useNavigate()
  const [goalFilter, setGoalFilter] = useState([])
  const [daysFilter, setDaysFilter] = useState(null)
  const [equipmentFilter, setEquipmentFilter] = useState([])
  const [difficultyFilter, setDifficultyFilter] = useState([])
  const [openDropdown, setOpenDropdown] = useState(null) // 'goal' | 'days' | 'equipment' | 'difficulty' | null
  const filterRef = useRef(null)

  // Close the open dropdown when clicking outside the filter region
  useEffect(() => {
    if (!openDropdown) return
    function handleDocClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleDocClick)
    document.addEventListener('touchstart', handleDocClick)
    return () => {
      document.removeEventListener('mousedown', handleDocClick)
      document.removeEventListener('touchstart', handleDocClick)
    }
  }, [openDropdown])

  const allPrograms = useMemo(() => Object.values(PROGRAMS), [])

  const filtered = useMemo(() => {
    return allPrograms.filter(program => {
      const m = program.meta
      if (!m) return false

      if (goalFilter.length > 0) {
        const programGoals = [m.primaryGoal, ...(m.secondaryGoals ?? [])]
        const goalMatch = goalFilter.some(g => programGoals.includes(g))
        if (!goalMatch) return false
      }

      if (daysFilter && !matchesDays(m.daysPerWeek, daysFilter)) {
        return false
      }

      if (equipmentFilter.length > 0) {
        const equipMatch = equipmentFilter.some(e => m.equipment?.includes(e))
        if (!equipMatch) return false
      }

      if (difficultyFilter.length > 0 && !difficultyFilter.includes(m.difficulty)) {
        return false
      }

      return true
    })
  }, [allPrograms, goalFilter, daysFilter, equipmentFilter, difficultyFilter])

  const hasActiveFilters =
    goalFilter.length > 0 ||
    daysFilter !== null ||
    equipmentFilter.length > 0 ||
    difficultyFilter.length > 0

  function toggleMulti(setter) {
    return value => setter(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
  }

  function toggleDays(value) {
    setDaysFilter(prev => (prev === value ? null : value))
  }

  function clearAll() {
    setGoalFilter([])
    setDaysFilter(null)
    setEquipmentFilter([])
    setDifficultyFilter([])
    setOpenDropdown(null)
  }

  function handleSelect(program) {
    if (onSelect) onSelect(program)
    else navigate(`/program-detail/${program.id}`)
  }

  // Active dropdown's option list — rendered as chips below the row
  const activeFilterPanel = (() => {
    if (!openDropdown) return null
    const config = {
      goal:       { options: GOAL_OPTIONS,       selected: goalFilter,       onToggle: toggleMulti(setGoalFilter) },
      days:       { options: DAYS_OPTIONS,       selected: daysFilter ? [daysFilter] : [], onToggle: toggleDays },
      equipment:  { options: EQUIPMENT_OPTIONS,  selected: equipmentFilter,  onToggle: toggleMulti(setEquipmentFilter) },
      difficulty: { options: DIFFICULTY_OPTIONS, selected: difficultyFilter, onToggle: toggleMulti(setDifficultyFilter) },
    }[openDropdown]
    return (
      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[12px] flex flex-wrap gap-[8px]">
        {config.options.map(opt => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={config.selected.includes(opt.value)}
            onClick={() => config.onToggle(opt.value)}
          />
        ))}
      </div>
    )
  })()

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Filters */}
      <div ref={filterRef} className="flex flex-col gap-[12px]">
        <div className="flex gap-[8px] overflow-x-auto scrollbar-none -mx-[16px] px-[16px]">
          <FilterDropdown
            label="Goal"
            options={GOAL_OPTIONS}
            selected={goalFilter}
            isOpen={openDropdown === 'goal'}
            onClick={() => setOpenDropdown(prev => (prev === 'goal' ? null : 'goal'))}
          />
          <FilterDropdown
            label="Days/Week"
            options={DAYS_OPTIONS}
            selected={daysFilter ? [daysFilter] : []}
            isOpen={openDropdown === 'days'}
            onClick={() => setOpenDropdown(prev => (prev === 'days' ? null : 'days'))}
          />
          <FilterDropdown
            label="Equipment"
            options={EQUIPMENT_OPTIONS}
            selected={equipmentFilter}
            isOpen={openDropdown === 'equipment'}
            onClick={() => setOpenDropdown(prev => (prev === 'equipment' ? null : 'equipment'))}
          />
          <FilterDropdown
            label="Difficulty"
            options={DIFFICULTY_OPTIONS}
            selected={difficultyFilter}
            isOpen={openDropdown === 'difficulty'}
            onClick={() => setOpenDropdown(prev => (prev === 'difficulty' ? null : 'difficulty'))}
          />
        </div>

        {activeFilterPanel}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="self-start font-commons text-[14px] text-accent tracking-[-0.2px] underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results header + cards */}
      <div className="flex flex-col gap-[12px]">
        <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
          {filtered.length === allPrograms.length
            ? `All Programs — ${allPrograms.length}`
            : `${filtered.length} of ${allPrograms.length}`}
        </span>

        {filtered.length === 0 ? (
          <div className="bg-[rgba(255,255,255,0.03)] border border-dashed border-[rgba(255,255,255,0.1)] rounded-[8px] p-[24px] text-center">
            <p className="font-commons font-semibold text-[16px] text-white tracking-[-0.2px]">
              No programs match your filters.
            </p>
            <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] mt-[6px]">
              Try removing a filter or clearing them all.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-[12px] inline-block font-commons font-semibold text-[14px] text-accent tracking-[-0.2px] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-[12px]">
            {filtered.map(program => (
              <ProgramCard
                key={program.id}
                program={program}
                onClick={() => handleSelect(program)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
