import { epley, formatDuration, formatVolume, totalVolume } from '@/lib/utils'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import { useSessions } from '@/hooks/useSessions'
import { normalizeExerciseName } from '@/lib/exercises'

export default function WorkoutSummary({ open, onClose, onSave, session, durationSeconds }) {
  const { data: allSessions = [] } = useSessions()
  const vol = totalVolume(session.exercises)
  const completedSets = session.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0)

  // Detect PRs: highest e1RM ever for each exercise
  const prs = session.exercises.map(ex => {
    const name = normalizeExerciseName(ex.name)
    const currentBest = Math.max(0, ...ex.sets.filter(s => s.completed).map(s => epley(s.weight, s.reps) || 0))
    const historicBest = allSessions.reduce((best, s) => {
      const match = s.exercises?.find(e => normalizeExerciseName(e.name) === name)
      if (!match) return best
      const sessionBest = Math.max(0, ...(match.sets || []).map(st => epley(st.weight, st.reps) || 0))
      return Math.max(best, sessionBest)
    }, 0)
    return currentBest > 0 && currentBest > historicBest ? { name: ex.name, e1rm: currentBest } : null
  }).filter(Boolean)

  return (
    <SlideUpSheet open={open} onClose={onClose} title="Workout Summary" heightClass="h-auto max-h-[85vh]">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Volume" value={`${formatVolume(vol)} kg`} />
          <Stat label="Sets" value={completedSets} />
          <Stat label="Duration" value={formatDuration(durationSeconds)} />
        </div>

        {prs.length > 0 && (
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Personal Records 🏆</div>
            {prs.map(pr => (
              <div key={pr.name} className="flex items-center justify-between py-2 border-b border-bg-tertiary last:border-0">
                <span className="text-sm text-text-primary">{pr.name}</span>
                <span className="text-sm font-bold text-accent">{pr.e1rm}kg e1RM</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-bg-tertiary rounded-xl text-sm text-text-secondary hover:border-accent/30 transition-colors"
          >
            Keep Going
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 bg-accent text-white font-semibold rounded-xl text-sm hover:bg-accent-hover transition-colors"
          >
            Save & Exit
          </button>
        </div>
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
