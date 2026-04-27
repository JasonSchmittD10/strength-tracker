import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useProgramConfig, useUpdateProgramConfig } from '@/hooks/useProgramConfig'
import { useProfile } from '@/hooks/useProfile'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import SessionPickerSheet from '@/components/SessionPickerSheet'

const DAY_NAMES_FROM_SUNDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Reorders day labels by user's week_start_day (0 = Sun, 1 = Mon, ...).
function dayLabelsFor(weekStartDay) {
  return Array.from({ length: 7 }, (_, i) => DAY_NAMES_FROM_SUNDAY[(weekStartDay + i) % 7])
}

// Custom-pattern indices are aligned to weekStartDay (index 0 = first day of
// user's week). Always returns a 7-element array.
function patternForUI(program, customPattern, weekStartDay) {
  const m = program.microcycle
  if (m.weeklyPatterns) return m.weeklyPatterns[0] // base pattern (week 1)
  const base = customPattern && customPattern.length === 7 ? customPattern : (m.pattern ?? Array(7).fill('rest'))
  void weekStartDay // pattern is already in user's-week order; no rotation needed
  return base
}

function patternsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

export default function EditSchedule() {
  const navigate = useNavigate()
  const { config, program, isLoading } = useProgramConfig()
  const { data: profile } = useProfile()
  const { mutateAsync: updateConfig, isPending: saving } = useUpdateProgramConfig()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingDayIdx, setEditingDayIdx] = useState(null)
  const [error, setError] = useState(null)

  const weekStartDay = profile?.weekStartDay ?? 1
  const dayLabels = dayLabelsFor(weekStartDay)

  const isRotation = program?.microcycle?.type === 'rotation'
  const hasWeeklyPatterns = !!program?.microcycle?.weeklyPatterns
  const editable = !isLoading && !!program && !isRotation && !hasWeeklyPatterns

  const currentPattern = useMemo(() => {
    if (!program) return null
    return patternForUI(program, config?.custom_pattern, weekStartDay)
  }, [program, config, weekStartDay])

  const isCustomized = useMemo(() => {
    if (!program || !config?.custom_pattern || !editable) return false
    return !patternsEqual(config.custom_pattern, program.microcycle.pattern)
  }, [program, config, editable])

  if (isLoading) return <LoadingSpinner />
  if (!program) {
    return (
      <div className="px-4 pt-[90px] pb-8 max-w-lg mx-auto">
        <Header onBack={() => navigate(-1)} />
        <p className="font-commons text-text-muted text-sm">No active program. Pick one from the Program tab.</p>
      </div>
    )
  }

  function sessionLabel(id) {
    if (id == null || id === 'rest') return 'Rest'
    return program.sessions.find(s => s.id === id)?.name ?? id
  }

  function openPickerForDay(dayIdx) {
    if (!editable) return
    setEditingDayIdx(dayIdx)
    setSheetOpen(true)
  }

  async function handlePick(idOrNull) {
    if (editingDayIdx == null || !editable) return
    setError(null)
    const next = [...currentPattern]
    next[editingDayIdx] = idOrNull == null ? 'rest' : idOrNull
    try {
      await updateConfig({ custom_pattern: next })
    } catch (e) {
      setError(e.message ?? 'Failed to save schedule')
    } finally {
      setEditingDayIdx(null)
    }
  }

  async function handleReset() {
    setError(null)
    try {
      await updateConfig({ custom_pattern: null })
    } catch (e) {
      setError(e.message ?? 'Failed to reset schedule')
    }
  }

  return (
    <div className="px-4 pt-[90px] pb-8 max-w-lg mx-auto">
      <Header onBack={() => navigate(-1)} />

      {/* Program title + customized badge */}
      <div className="flex items-baseline justify-between mb-6 gap-3">
        <p className="font-judge text-[32px] text-white leading-[40px]">{program.name}</p>
        {isCustomized && (
          <span className="flex-shrink-0 font-commons text-[12px] text-accent bg-accent/15 border border-accent/30 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
            Customized
          </span>
        )}
      </div>

      {/* Read-only notes */}
      {isRotation && (
        <p className="font-commons text-[14px] text-text-muted leading-[18px] mb-6">
          This program rotates through sessions in a fixed order rather than following weekdays.
          Editing the weekly pattern isn't supported.
        </p>
      )}
      {hasWeeklyPatterns && (
        <p className="font-commons text-[14px] text-text-muted leading-[18px] mb-6">
          This program's schedule changes per week of the cycle. Editing per-week patterns isn't supported in this view.
        </p>
      )}

      {/* Day list */}
      {currentPattern && (
        <div className="bg-bg-card border border-bg-tertiary rounded-2xl divide-y divide-bg-tertiary mb-4">
          {currentPattern.map((sessionId, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => openPickerForDay(idx)}
              disabled={!editable}
              className="w-full flex items-center justify-between px-4 py-3 text-left disabled:opacity-60 hover:bg-bg-tertiary/40 disabled:hover:bg-transparent transition-colors"
            >
              <span className="font-commons font-semibold text-[14px] text-text-secondary uppercase tracking-wide w-12 flex-shrink-0">
                {dayLabels[idx]}
              </span>
              <span className="flex-1 font-commons text-[16px] text-white tracking-[-0.2px] truncate ml-2">
                {sessionLabel(sessionId)}
              </span>
              {editable && (
                <span className="font-commons text-[12px] text-accent ml-2 flex-shrink-0">Edit</span>
              )}
            </button>
          ))}
        </div>
      )}

      {error && <p className="font-commons text-[14px] text-danger mb-3">{error}</p>}

      {editable && (
        <button
          type="button"
          onClick={handleReset}
          disabled={!isCustomized || saving}
          className="w-full py-3 rounded-xl border border-bg-tertiary font-commons text-[14px] text-text-secondary disabled:opacity-50 hover:border-accent/40 hover:text-accent transition-colors"
        >
          {saving ? 'Saving…' : 'Reset to default'}
        </button>
      )}

      <SessionPickerSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditingDayIdx(null) }}
        program={program}
        title={editingDayIdx != null ? `${dayLabels[editingDayIdx]} session` : 'Pick a session'}
        includeRest
        onSelect={handlePick}
      />
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div className="flex items-center gap-3 py-4 -mt-[80px] mb-2">
      <button
        onClick={onBack}
        className="text-text-muted hover:text-text-primary transition-colors p-1"
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>
      <h1 className="font-bold text-xl text-text-primary">Edit Schedule</h1>
    </div>
  )
}
