import { useEffect, useState } from 'react'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import { supabase } from '@/lib/supabase'
import { formatDuration, formatVolume } from '@/lib/utils'
import { useUnitPreference } from '@/hooks/useProfile'
import { formatWeight, convertWeight } from '@/lib/units'

const TAG_COLORS = {
  push: 'bg-push/15 text-push border-push/30',
  pull: 'bg-pull/15 text-pull border-pull/30',
  legs: 'bg-legs/15 text-legs border-legs/30',
}

function getSessionTag(sessionName) {
  const lower = (sessionName || '').toLowerCase()
  if (lower.includes('push')) return { tag: 'push', label: 'PUSH' }
  if (lower.includes('pull')) return { tag: 'pull', label: 'PULL' }
  if (lower.includes('leg')) return { tag: 'legs', label: 'LEGS' }
  return null
}

// Props:
//   open      — boolean
//   onClose   — function
//   activity  — activity row with summary and session_id
export default function SessionDetailSheet({ open, onClose, activity }) {
  const [sessionData, setSessionData] = useState(null)
  const [loading, setLoading] = useState(false)
  const unit = useUnitPreference()

  useEffect(() => {
    if (!open || !activity?.session_id) return
    setLoading(true)
    supabase
      .from('sessions')
      .select('id, data, created_at')
      .eq('id', activity.session_id)
      .single()
      .then(({ data, error }) => {
        setLoading(false)
        if (!error && data) setSessionData(data.data)
      })
  }, [open, activity?.session_id])

  const summary = activity?.summary ?? {}
  const { sessionName, durationSeconds, totalVolume, prs = [] } = summary

  const tagInfo = getSessionTag(sessionName)
  const prExercises = new Set(prs.map(pr => pr.exercise))

  function formatDate(isoString) {
    if (!isoString) return ''
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  }

  return (
    <SlideUpSheet
      open={open}
      onClose={onClose}
      title={sessionName || 'Workout'}
      heightClass="h-[90vh]"
    >
      {/* Header summary */}
      <div className="flex items-center gap-2 mb-4">
        {tagInfo && (
          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[tagInfo.tag]}`}>
            {tagInfo.label}
          </span>
        )}
        <span className="text-xs text-text-muted">{formatDate(summary.displayDate || activity?.created_at)}</span>
      </div>

      {/* Stats summary row */}
      <div className="flex gap-4 mb-5 text-sm">
        {totalVolume != null && (
          <div>
            <span className="font-bold text-text-primary">{formatVolume(convertWeight(totalVolume, 'lbs', unit))}</span>
            <span className="text-text-muted ml-1">{unit}</span>
          </div>
        )}
        {durationSeconds > 0 && (
          <div>
            <span className="font-bold text-text-primary">{formatDuration(durationSeconds)}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Exercises */}
      {sessionData && (
        <div className="space-y-5">
          {(sessionData.exercises || []).map((ex, i) => {
            const exVolume = (ex.sets || [])
              .filter(s => s.completed !== false)
              .reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)
            const hasPR = prExercises.has(ex.name)

            return (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-text-primary text-sm">{ex.name}</span>
                  {hasPR && (
                    <span className="text-xs bg-warning/15 text-warning border border-warning/30 px-1.5 py-0.5 rounded-full font-medium">
                      🏆 PR
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {(ex.sets || []).map((s, j) => (
                    <div
                      key={j}
                      className={`text-xs flex items-center gap-2 py-1 px-2 rounded-lg ${s.completed === false ? 'opacity-40' : 'bg-bg-primary/50'}`}
                    >
                      <span className="text-text-muted w-10">Set {j + 1}</span>
                      <span className="text-text-primary font-medium">{formatWeight(s.weight, unit)} × {s.reps}</span>
                      {s.rpe && <span className="text-text-muted">@ RPE {s.rpe}</span>}
                    </div>
                  ))}
                </div>
                {exVolume > 0 && (
                  <div className="text-xs text-text-muted mt-1.5 px-2">
                    Total: {formatVolume(convertWeight(exVolume, 'lbs', unit))} {unit}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </SlideUpSheet>
  )
}
