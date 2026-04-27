import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PROGRAMS } from '@/lib/programs'

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

function FilterRow({ title, options, selected, onToggle }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] uppercase">
        {title}
      </span>
      <div className="flex gap-[8px] overflow-x-auto scrollbar-none -mx-[16px] px-[16px] pb-[2px]">
        {options.map(opt => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={selected.includes(opt.value)}
            onClick={() => onToggle(opt.value)}
          />
        ))}
      </div>
    </div>
  )
}

function GoalBadge({ goal }) {
  const label = goal.charAt(0).toUpperCase() + goal.slice(1)
  return (
    <span className="inline-flex items-center font-commons font-semibold text-[12px] text-accent bg-accent/15 border border-accent/30 px-[8px] py-[3px] rounded-full tracking-[-0.2px] uppercase">
      {label}
    </span>
  )
}

function MetaPill({ children }) {
  return (
    <span className="font-commons text-[12px] text-[rgba(255,255,255,0.5)] tracking-[-0.2px] leading-[14px] border border-[rgba(255,255,255,0.1)] rounded-[4px] py-[3px] px-[6px] whitespace-nowrap capitalize">
      {children}
    </span>
  )
}

function EquipmentTag({ value }) {
  const label = EQUIPMENT_OPTIONS.find(o => o.value === value)?.label ?? value
  return (
    <span className="font-commons text-[11px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[4px] px-[6px] py-[2px] whitespace-nowrap">
      {label}
    </span>
  )
}

function ProgramCard({ program, onClick }) {
  const meta = program.meta
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:border-accent/40 rounded-[8px] p-[16px] flex flex-col gap-[12px] transition-colors"
    >
      <div className="flex items-start justify-between gap-[12px]">
        <p className="font-judge text-[28px] text-white leading-[34px] flex-1 min-w-0">
          {program.name}
        </p>
        <GoalBadge goal={meta.primaryGoal} />
      </div>

      <div className="flex flex-wrap items-center gap-[6px]">
        <MetaPill>{meta.daysPerWeek} days/wk</MetaPill>
        <MetaPill>{meta.difficulty}</MetaPill>
        <MetaPill>{meta.timePerSession} min</MetaPill>
      </div>

      {meta.equipment?.length > 0 && (
        <div className="flex flex-wrap gap-[4px]">
          {meta.equipment.map(eq => (
            <EquipmentTag key={eq} value={eq} />
          ))}
        </div>
      )}

      <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] line-clamp-3">
        {program.description}
      </p>

      {meta.author && (
        <span className="font-commons text-[12px] text-[#5c5c5c] tracking-[-0.2px] leading-[14px]">
          By {meta.author}
        </span>
      )}
    </button>
  )
}

export default function ProgramBrowser({ onSelect }) {
  const navigate = useNavigate()
  const [goalFilter, setGoalFilter] = useState([])
  const [daysFilter, setDaysFilter] = useState(null)
  const [equipmentFilter, setEquipmentFilter] = useState([])
  const [difficultyFilter, setDifficultyFilter] = useState([])

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
  }

  function handleSelect(program) {
    if (onSelect) onSelect(program)
    else navigate(`/program-detail/${program.id}`)
  }

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Filters */}
      <div className="flex flex-col gap-[16px]">
        <FilterRow
          title="Goal"
          options={GOAL_OPTIONS}
          selected={goalFilter}
          onToggle={toggleMulti(setGoalFilter)}
        />
        <FilterRow
          title="Days / week"
          options={DAYS_OPTIONS}
          selected={daysFilter ? [daysFilter] : []}
          onToggle={toggleDays}
        />
        <FilterRow
          title="Equipment"
          options={EQUIPMENT_OPTIONS}
          selected={equipmentFilter}
          onToggle={toggleMulti(setEquipmentFilter)}
        />
        <FilterRow
          title="Difficulty"
          options={DIFFICULTY_OPTIONS}
          selected={difficultyFilter}
          onToggle={toggleMulti(setDifficultyFilter)}
        />

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

      <div className="h-px bg-[rgba(255,255,255,0.1)]" />

      {/* Results header */}
      <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
        {filtered.length === allPrograms.length
          ? `All Programs — ${allPrograms.length}`
          : `${filtered.length} of ${allPrograms.length}`}
      </span>

      {/* Cards */}
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
  )
}
