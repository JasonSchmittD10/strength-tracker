import { useState, useMemo, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { epley, formatDuration, totalVolume } from '@/lib/utils'
import { useSessions } from '@/hooks/useSessions'
import { useSaveTemplate } from '@/hooks/useTemplates'
import { useUnitPreference } from '@/hooks/useProfile'
import { normalizeExerciseName } from '@/lib/exercises'
import copyIcon from '@/assets/icons/icon-copy.svg'
import trendUpIcon from '@/assets/icons/icon-trend-up.svg'

// ─── Template name inference ──────────────────────────────────────────────────
function inferTemplateExercises(exercises) {
  return exercises.map(ex => {
    const completed = ex.sets.filter(s => s.completed)
    const setsCount = completed.length || ex.sets.length
    let reps = ex.reps ?? '8-12'
    if (completed.length > 0) {
      const sorted = [...completed].sort((a, b) => (parseInt(a.reps) || 0) - (parseInt(b.reps) || 0))
      reps = String(sorted[Math.floor(sorted.length / 2)].reps || '8-12')
    }
    return { name: ex.name, sets: setsCount, reps, rest: ex.rest ?? 90, restLabel: ex.restLabel ?? '90 sec' }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatTile({ label, value }) {
  return (
    <div className="bg-[#181818] rounded-[2px] flex-1 flex flex-col items-center justify-center py-[8px] pb-[8px] pt-[12px] gap-[2px]">
      <span className="font-judge text-[26px] text-white leading-none">{value}</span>
      <span className="font-commons text-[16px] text-[#8b8b8b] leading-[14px]">{label}</span>
    </div>
  )
}

function SetRow({ setNum, set, unit, isLast }) {
  const weightStr = set.weight ? `${set.weight} ${unit}` : ''
  const repsStr = set.duration_seconds
    ? `${set.duration_seconds} sec`
    : set.reps ? `${set.reps} reps` : '—'

  return (
    <>
      <div className="flex items-center gap-[14px]">
        <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] flex-shrink-0 w-[36px]">
          Set {setNum}
        </span>
        <span className="flex-1 font-commons font-semibold text-[18px] text-white tracking-[-0.5px]">
          {weightStr}
        </span>
        <span className="font-commons text-[18px] text-[#8b8b8b] tracking-[-0.5px] flex-shrink-0">
          {repsStr}
        </span>
      </div>
      {!isLast && <div className="h-px bg-[rgba(255,255,255,0.1)]" />}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WorkoutSummary({
  open, onClose, onDone,
  session, durationSeconds,
  mode = 'program', templateId, templateName,
  saveError = null,
}) {
  const { data: allSessions = [] } = useSessions()
  const { mutateAsync: saveTemplate } = useSaveTemplate()
  const unit = useUnitPreference()
  const isCustomMode = mode === 'custom' || mode === 'template'

  const [workoutName, setWorkoutName] = useState('')
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateSaveError, setTemplateSaveError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

  useEffect(() => {
    if (open) {
      setWorkoutName(templateName ?? '')
      setTemplateSaveError(null)
      setShowSaveTemplate(false)
    }
  }, [open, templateName])

  const { vol, completedSets, exerciseCount } = useMemo(() => {
    if (!open) return { vol: 0, completedSets: 0, exerciseCount: 0 }
    return {
      vol: totalVolume(session.exercises),
      completedSets: session.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0),
      exerciseCount: session.exercises.length,
    }
  }, [open, session.exercises])

  // Volume diff vs most recent previous session
  const volDiff = useMemo(() => {
    if (!open || allSessions.length === 0) return null
    const sorted = [...allSessions].sort((a, b) => new Date(b.date) - new Date(a.date))
    const prev = sorted[0]
    if (!prev?.totalVolume) return null
    return vol - prev.totalVolume
  }, [open, vol, allSessions])

  const prs = useMemo(() => {
    if (!open) return []
    return session.exercises.map(ex => {
      const name = normalizeExerciseName(ex.name)
      const currentBest = Math.max(0, ...ex.sets.filter(s => s.completed).map(s => epley(s.weight, s.reps) || 0))
      const historicBest = allSessions.reduce((best, s) => {
        const match = s.exercises?.find(e => normalizeExerciseName(e.name) === name)
        if (!match) return best
        return Math.max(best, ...(match.sets ?? []).map(st => epley(st.weight, st.reps) || 0))
      }, 0)
      return currentBest > 0 && currentBest > historicBest ? { name: ex.name, e1rm: currentBest } : null
    }).filter(Boolean)
  }, [open, session.exercises, allSessions])

  function copyWorkout() {
    const lines = session.exercises.map(ex => {
      const sets = ex.sets
        .filter(s => s.completed && (s.weight || s.reps))
        .map(s => s.weight ? `${s.weight}×${s.reps}` : `${s.reps} reps`)
        .join(' ')
      return sets ? `${ex.name}\n${sets}` : ex.name
    }).join('\n')
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleSaveTemplate() {
    setTemplateSaving(true)
    setTemplateSaveError(null)
    try {
      const name = workoutName.trim() || 'Custom Workout'
      const exercises = inferTemplateExercises(session.exercises)
      await saveTemplate({ id: templateId, name, exercises })
      setShowSaveTemplate(false)
    } catch {
      setTemplateSaveError('Failed to save template. Please try again.')
    } finally {
      setTemplateSaving(false)
    }
  }

  const volDisplay = vol >= 1000 ? (vol / 1000).toFixed(1) : String(vol)
  const showK = vol >= 1000

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-[16px] pt-[66px] pb-[12px]">
        {/* hidden back placeholder to keep title centered */}
        <div className="w-[60px] opacity-0 pointer-events-none" />
        <span className="font-judge text-[16px] text-white leading-[1.2]">Workout</span>
        <button
          onClick={() => setShowSaveTemplate(s => !s)}
          aria-label="Save as template"
          className={`w-[60px] flex justify-end ${showSaveTemplate || isCustomMode ? 'text-accent' : 'text-[#8b8b8b]'}`}
        >
          <Bookmark size={18} />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-[16px] pb-[24px]">
        {/* Volume */}
        <div className="flex flex-col items-center gap-[12px] mb-[29px]">
          <div className="flex flex-col items-center gap-[8px]">
            <span className="font-commons text-[14px] text-[rgba(255,255,255,0.4)] tracking-[1px]">
              TOTAL VOLUME
            </span>
            <div className="flex flex-col items-center gap-[12px]">
              <div className="flex items-end gap-[2px]">
                <span className="font-judge text-[48px] text-white leading-[60px]">{volDisplay}</span>
                {showK && <span className="font-judge text-[32px] text-accent leading-[40px]">k</span>}
              </div>
              <span className="font-commons text-[14px] text-[#8b8b8b]">{unit} lifted</span>
            </div>
          </div>

          {/* Volume comparison badge */}
          {volDiff !== null && (
            <div className="flex items-center gap-[8px] bg-[rgba(19,134,75,0.05)] border border-[rgba(19,134,75,0.15)] rounded-[8px] px-[8px] py-[4px]">
              <div className="w-[14px] h-[24px] flex-shrink-0 flex items-center justify-center">
                <img src={trendUpIcon} alt="" className="w-full h-full object-contain" />
              </div>
              <span className="font-commons font-semibold text-[18px] text-[#13864b] tracking-[-0.5px] whitespace-nowrap">
                {volDiff >= 0 ? '+' : ''}{volDiff} {unit} vs. last session
              </span>
            </div>
          )}

          {/* PR badges */}
          {prs.length > 0 && (
            <div className="flex flex-wrap gap-[6px] justify-center">
              {prs.map(pr => (
                <div key={pr.name} className="flex items-center gap-[6px] bg-[rgba(242,166,85,0.08)] border border-[rgba(242,166,85,0.2)] rounded-[8px] px-[8px] py-[4px]">
                  <span className="font-commons text-[13px] text-accent font-semibold">PR — {pr.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-[8px] h-[62px] mb-[29px]">
          <StatTile label="Sets"      value={completedSets} />
          <StatTile label="Duration"  value={formatDuration(durationSeconds)} />
          <StatTile label="Exercises" value={exerciseCount} />
        </div>

        {/* What You Did */}
        <p className="font-commons text-[14px] text-[rgba(255,255,255,0.4)] tracking-[1px] text-center mb-[12px]">
          WHAT YOU DID
        </p>
        <div className="flex flex-col gap-[12px]">
          {session.exercises.map((ex, i) => {
            const doneSets = ex.sets.filter(s => s.completed)
            return (
              <div key={i}>
                <p className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] mb-[12px]">
                  {ex.name}
                </p>
                <div className="bg-[#181818] rounded-[8px] px-[16px] py-[12px] flex flex-col gap-[12px]">
                  {doneSets.length > 0 ? doneSets.map((s, j) => (
                    <SetRow
                      key={j}
                      setNum={j + 1}
                      set={s}
                      unit={unit}
                      isLast={j === doneSets.length - 1}
                    />
                  )) : (
                    <span className="font-commons text-[14px] text-[#5c5c5c]">No sets completed</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Save-as-template (bookmark) */}
        {(isCustomMode || showSaveTemplate) && (
          <div className="mt-[32px] flex flex-col gap-[12px]">
            <span className="font-commons text-[14px] text-[rgba(255,255,255,0.4)] tracking-[1px] uppercase">
              {templateId ? 'Update Template' : 'Save as Template'}
            </span>
            <input
              value={workoutName}
              onChange={e => setWorkoutName(e.target.value)}
              placeholder="e.g. Upper Body Power"
              maxLength={100}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons text-[18px] text-white placeholder-[#5c5c5c] focus:outline-none focus:border-accent"
            />
            {templateSaveError && (
              <p className="font-commons text-[14px] text-[#f87171]">{templateSaveError}</p>
            )}
            <button
              onClick={handleSaveTemplate}
              disabled={templateSaving}
              className="w-full h-[46px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons font-bold text-[18px] text-white disabled:opacity-50"
            >
              {templateSaving ? 'Saving…' : templateId ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        )}
      </div>

      {/* ── Sticky footer ── */}
      <div className="flex-shrink-0 border-t border-[rgba(255,255,255,0.1)] pt-[16px] px-[16px] pb-[34px] flex flex-col gap-[10px]">
        {saveError && (
          <p className="font-commons text-[14px] text-[#f87171] text-center">{saveError}</p>
        )}
        <button
          onClick={copyWorkout}
          className="w-full h-[46px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons font-bold text-[18px] text-white flex items-center justify-center gap-[10px]"
        >
          <img src={copyIcon} alt="" className="w-[14px] h-[14px] flex-shrink-0 brightness-0 invert" />
          {copied ? 'Copied!' : 'Copy Workout Results'}
        </button>
        <button
          onClick={onDone}
          className="w-full h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black"
        >
          Done
        </button>
      </div>
    </div>
  )
}
