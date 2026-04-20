import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, Copy, Check, Bookmark } from 'lucide-react'
import { epley, formatDuration, formatVolume, totalVolume } from '@/lib/utils'
import { useSessions } from '@/hooks/useSessions'
import { useSaveTemplate } from '@/hooks/useTemplates'
import { useUnitPreference } from '@/hooks/useProfile'
import { normalizeExerciseName } from '@/lib/exercises'

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

export default function WorkoutSummary({
  open, onClose, onSave, session, durationSeconds,
  mode = 'program', templateId, templateName,
  externalSaving = false, externalSaveError = null,
}) {
  const { data: allSessions = [] } = useSessions()
  const { mutateAsync: saveTemplate } = useSaveTemplate()
  const unit = useUnitPreference()
  const isCustomMode = mode === 'custom' || mode === 'template'

  const [workoutName, setWorkoutName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) { setWorkoutName(templateName ?? ''); setSaveError(null) }
  }, [open, templateName])

  const { vol, completedSets, exerciseCount } = useMemo(() => {
    if (!open) return { vol: 0, completedSets: 0, exerciseCount: 0 }
    return {
      vol: totalVolume(session.exercises),
      completedSets: session.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0),
      exerciseCount: session.exercises.length,
    }
  }, [open, session.exercises])

  const prs = useMemo(() => {
    if (!open) return []
    return session.exercises.map(ex => {
      const name = normalizeExerciseName(ex.name)
      const currentBest = Math.max(0, ...ex.sets.filter(s => s.completed).map(s => epley(s.weight, s.reps) || 0))
      const historicBest = allSessions.reduce((best, s) => {
        const match = s.exercises?.find(e => normalizeExerciseName(e.name) === name)
        if (!match) return best
        const sessionBest = Math.max(0, ...(match.sets ?? []).map(st => epley(st.weight, st.reps) || 0))
        return Math.max(best, sessionBest)
      }, 0)
      return currentBest > 0 && currentBest > historicBest ? { name: ex.name, e1rm: currentBest } : null
    }).filter(Boolean)
  }, [open, session.exercises, allSessions])

  function copyWorkout() {
    const lines = session.exercises.map(ex => {
      const sets = ex.sets
        .filter(s => s.completed && s.weight && s.reps)
        .map(s => `${s.weight}×${s.reps}`)
        .join(' ')
      return sets ? `${ex.name}\n${sets}` : ex.name
    }).join('\n')
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleSaveWithTemplate() {
    setSaving(true)
    setSaveError(null)
    try {
      const name = workoutName.trim() || 'Custom Workout'
      const exercises = inferTemplateExercises(session.exercises)
      await saveTemplate({ id: templateId, name, exercises })
      await onSave(name)
    } catch (e) {
      setSaveError('Failed to save template. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveWithoutTemplate() {
    if (saving) return
    setSaving(true)
    try { await onSave(null) } finally { setSaving(false) }
  }

  const volK = vol >= 1000 ? (vol / 1000).toFixed(1) : vol

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-[16px] py-[12px]">
        <button onClick={onClose} className="flex items-center gap-[4px]">
          <ChevronLeft size={16} className="text-accent" />
          <span className="font-commons text-[14px] text-accent">Back</span>
        </button>
        <span className="font-judge text-[16px] text-white">Workout</span>
        <button className="text-[#8b8b8b]">
          <Bookmark size={16} />
        </button>
      </div>

      <div className="px-[16px] pb-[40px]">
        {/* Volume */}
        <div className="mt-[24px] mb-[8px]">
          <span className="font-commons text-[14px] text-white/40 tracking-[1px] uppercase">Total Volume</span>
        </div>
        <div className="flex items-end gap-[4px]">
          <span className="font-judge text-[48px] text-white leading-none">{volK}</span>
          {vol >= 1000 && <span className="font-judge text-[32px] text-accent leading-none mb-[2px]">k</span>}
        </div>
        <div className="font-commons text-[14px] text-[#8b8b8b] mt-[4px]">lb lifted</div>

        {/* PR badge */}
        {prs.length > 0 && (
          <div className="inline-flex items-center gap-[6px] mt-[12px] bg-[rgba(19,134,75,0.05)] border border-[rgba(19,134,75,0.15)] rounded-[8px] px-[8px] py-[4px]">
            <span className="font-commons text-[13px] text-[#13864b] font-semibold">
              {prs.length} PR{prs.length > 1 ? 's' : ''} — {prs.map(p => p.name).join(', ')}
            </span>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-[8px] mt-[24px]">
          <StatTile label="SETS" value={completedSets} />
          <StatTile label="DURATION" value={formatDuration(durationSeconds)} />
          <StatTile label="EXERCISES" value={exerciseCount} />
        </div>

        {/* What You Did */}
        <div className="mt-[32px]">
          <span className="font-commons text-[14px] text-white/40 tracking-[1px] uppercase">What You Did</span>
          <div className="mt-[12px] flex flex-col gap-[16px]">
            {session.exercises.map((ex, i) => {
              const doneSets = ex.sets.filter(s => s.completed)
              return (
                <div key={i}>
                  <div className="font-commons font-semibold text-[18px] text-white mb-[8px]">{ex.name}</div>
                  {doneSets.length > 0 ? (
                    <div className="bg-[#181818] rounded-[8px] px-[16px] py-[12px] flex flex-col gap-[8px]">
                      {doneSets.map((s, j) => (
                        <div key={j} className="flex items-center justify-between">
                          <span className="font-commons text-[14px] text-[#8b8b8b]">Set {j + 1}</span>
                          <span className="font-commons text-[14px] text-white">
                            {s.weight ? `${s.weight} ${unit} × ` : ''}{s.reps || s.duration_seconds || '—'}{s.rpe ? ` @ ${s.rpe}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#181818] rounded-[8px] px-[16px] py-[12px]">
                      <span className="font-commons text-[14px] text-[#5c5c5c]">No sets completed</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Custom mode: save-as-template */}
        {isCustomMode && (
          <div className="mt-[32px] flex flex-col gap-[12px]">
            <span className="font-commons text-[14px] text-white/40 tracking-[1px] uppercase">
              {templateId ? 'Update Template' : 'Save as Template'}
            </span>
            <input
              value={workoutName}
              onChange={e => setWorkoutName(e.target.value)}
              placeholder="e.g. Upper Body Power"
              aria-label="Workout template name"
              maxLength={100}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons text-[18px] text-white placeholder-[#5c5c5c] focus:outline-none focus:border-accent"
            />
            {saveError && <p className="font-commons text-[14px] text-danger">{saveError}</p>}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-[32px] flex flex-col gap-[12px]">
          <button
            onClick={copyWorkout}
            className="w-full flex items-center justify-center gap-[8px] py-[12px] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons text-[16px] text-[#8b8b8b]"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Workout Results'}
          </button>

          {externalSaveError && <p className="font-commons text-[14px] text-danger text-center">{externalSaveError}</p>}

          {isCustomMode ? (
            <>
              <button
                onClick={handleSaveWithTemplate}
                disabled={saving}
                className="w-full h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black disabled:opacity-50"
              >
                {saving ? 'Saving…' : templateId ? 'Update Template' : 'Done — Log Workout'}
              </button>
              <button
                onClick={handleSaveWithoutTemplate}
                disabled={saving}
                className="w-full font-commons text-[16px] text-[#8b8b8b] text-center py-[8px] disabled:opacity-50"
              >
                Don't Save Template
              </button>
            </>
          ) : (
            <button
              onClick={() => onSave(null)}
              disabled={externalSaving}
              className="w-full h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black disabled:opacity-50"
            >
              {externalSaving ? 'Saving…' : 'Done — Log Workout'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value }) {
  return (
    <div className="bg-[#181818] rounded-[2px] flex flex-col items-center py-[14px] px-[8px]">
      <span className="font-judge text-[26px] text-white leading-none">{value}</span>
      <span className="font-commons text-[11px] text-[#8b8b8b] mt-[4px] uppercase tracking-[0.5px]">{label}</span>
    </div>
  )
}
