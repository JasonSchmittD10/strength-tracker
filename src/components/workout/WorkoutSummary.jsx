import { useState, useMemo, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { epley, formatDuration, formatVolume, totalVolume } from '@/lib/utils'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import { useSessions } from '@/hooks/useSessions'
import { useSaveTemplate } from '@/hooks/useTemplates'
import { useUnitPreference } from '@/hooks/useProfile'
import { normalizeExerciseName } from '@/lib/exercises'

// Convert live exercise data → template exercise definition
function inferTemplateExercises(exercises) {
  return exercises.map(ex => {
    const completed = ex.sets.filter(s => s.completed)
    const setsCount = completed.length || ex.sets.length
    // Median reps of completed sets as a string, fallback to ex.reps
    let reps = ex.reps ?? '8-12'
    if (completed.length > 0) {
      const sorted = [...completed].sort((a, b) => (parseInt(a.reps) || 0) - (parseInt(b.reps) || 0))
      reps = String(sorted[Math.floor(sorted.length / 2)].reps || '8-12')
    }
    return {
      name: ex.name,
      sets: setsCount,
      reps,
      rest: ex.rest ?? 90,
      restLabel: ex.restLabel ?? '90 sec',
    }
  })
}

export default function WorkoutSummary({
  open, onClose, onSave, session, durationSeconds,
  mode = 'program', templateId, templateName,
}) {
  const { data: allSessions = [] } = useSessions()
  const { mutateAsync: saveTemplate } = useSaveTemplate()
  const unit = useUnitPreference()
  const isCustomMode = mode === 'custom' || mode === 'template'

  const [workoutName, setWorkoutName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [copied, setCopied] = useState(false)

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

  // Reset name field and error when sheet opens
  useEffect(() => {
    if (open) { setWorkoutName(templateName ?? ''); setSaveError(null) }
  }, [open, templateName])

  const { vol, completedSets } = useMemo(() => {
    if (!open) return { vol: 0, completedSets: 0 }
    return {
      vol: totalVolume(session.exercises),
      completedSets: session.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0),
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
    try {
      await onSave(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlideUpSheet open={open} onClose={onClose} title="Workout Summary" heightClass="h-auto max-h-[90vh]">
      <div className="space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Volume" value={`${formatVolume(vol)} ${unit}`} />
          <Stat label="Sets" value={completedSets} />
          <Stat label="Duration" value={formatDuration(durationSeconds)} />
        </div>

        {/* Copy workout */}
        <button
          onClick={copyWorkout}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary hover:border-accent/40 hover:text-accent transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Workout'}
        </button>

        {/* PRs */}
        {prs.length > 0 && (
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Personal Records 🏆</div>
            {prs.map(pr => (
              <div key={pr.name} className="flex items-center justify-between py-2 border-b border-bg-tertiary last:border-0">
                <span className="text-sm text-text-primary">{pr.name}</span>
                <span className="text-sm font-bold text-accent">{pr.e1rm}{unit} e1RM</span>
              </div>
            ))}
          </div>
        )}

        {/* Save as Template section — custom/template modes only */}
        {isCustomMode ? (
          <div className="space-y-3 pt-2 border-t border-bg-tertiary">
            <div className="text-xs text-text-muted uppercase tracking-wider">
              {templateId ? 'Update Template' : 'Save as Template'}
            </div>
            <input
              value={workoutName}
              onChange={e => setWorkoutName(e.target.value)}
              placeholder="e.g. Upper Body Power"
              aria-label="Workout template name"
              maxLength={100}
              className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {saveError && (
              <p className="text-xs text-danger">{saveError}</p>
            )}
            <button
              onClick={handleSaveWithTemplate}
              disabled={saving}
              className="w-full py-3 bg-accent text-white font-semibold rounded-xl text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : templateId ? 'Update Template' : 'Save to My Workouts'}
            </button>
            <button
              onClick={handleSaveWithoutTemplate}
              disabled={saving}
              className="w-full py-2 text-text-muted text-sm hover:text-text-secondary transition-colors disabled:opacity-50"
            >
              Don't Save
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary hover:border-accent/30 transition-colors"
            >
              Keep Going
            </button>
          </div>
        ) : (
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-bg-tertiary rounded-xl text-sm text-text-secondary hover:border-accent/30 transition-colors"
            >
              Keep Going
            </button>
            <button
              onClick={() => onSave(null)}
              className="flex-1 py-3 bg-accent text-white font-semibold rounded-xl text-sm hover:bg-accent-hover transition-colors"
            >
              Save & Exit
            </button>
          </div>
        )}
      </div>
    </SlideUpSheet>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-bg-tertiary rounded-xl p-3 text-center">
      <div className="text-lg font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-muted mt-0.5">{label}</div>
    </div>
  )
}
