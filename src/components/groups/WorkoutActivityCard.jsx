import { useState } from 'react'
import { formatVolume, formatDuration } from '@/lib/utils'
import { PROGRAMS } from '@/lib/programs'
import SessionDetailSheet from './SessionDetailSheet'

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

function formatDisplayDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const now = new Date()
  const diffMs = now - d
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Props:
//   activity  — activity row, optionally with `profiles` join
//   compact   — boolean, shows condensed layout (HomeScreen)
export default function WorkoutActivityCard({ activity, compact = false }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { summary } = activity

  if (!summary) return null

  const {
    sessionName,
    programId,
    totalSets,
    totalVolume: vol,
    durationSeconds,
    prs = [],
    displayDate,
  } = summary

  const programLabel = PROGRAMS[programId]?.name ?? (programId === 'custom' ? 'Custom' : programId)
  const tagInfo = getSessionTag(sessionName)
  const displayName =
    activity.profiles?.display_name ||
    (activity.user_id ? activity.user_id.slice(0, 8) : 'You')
  const initial = displayName[0]?.toUpperCase() || '?'
  const timeLabel = formatDisplayDate(displayDate || activity.created_at)

  if (compact) {
    return (
      <>
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 flex items-center justify-between text-left hover:border-accent/30 transition-colors"
        >
          <div>
            <div className="text-sm font-semibold text-text-primary">{sessionName}</div>
            <div className="text-xs text-text-muted">{timeLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-secondary">{formatVolume(vol ?? 0)} kg</div>
            {durationSeconds > 0 && (
              <div className="text-xs text-text-muted">{formatDuration(durationSeconds)}</div>
            )}
          </div>
        </button>
        <SessionDetailSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          activity={activity}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        className="w-full bg-bg-card border border-bg-tertiary rounded-2xl p-4 text-left hover:border-accent/30 transition-colors"
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initial}
            </div>
            <span className="text-sm font-medium text-text-primary">{displayName}</span>
          </div>
          <span className="text-xs text-text-muted">{timeLabel}</span>
        </div>

        {/* Session name + tag */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-base font-bold text-text-primary">{sessionName}</span>
          {tagInfo && (
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[tagInfo.tag]}`}>
              {tagInfo.label}
            </span>
          )}
        </div>

        {/* Program label */}
        <div className="text-xs text-text-muted mb-3">{programLabel}</div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-bg-secondary rounded-xl py-2 text-center">
            <div className="text-sm font-bold text-text-primary">{totalSets ?? 0}</div>
            <div className="text-xs text-text-muted">Sets</div>
          </div>
          <div className="bg-bg-secondary rounded-xl py-2 text-center">
            <div className="text-sm font-bold text-text-primary">{formatVolume(vol ?? 0)}</div>
            <div className="text-xs text-text-muted">Volume</div>
          </div>
          <div className="bg-bg-secondary rounded-xl py-2 text-center">
            <div className="text-sm font-bold text-text-primary">
              {durationSeconds > 0 ? formatDuration(durationSeconds) : '—'}
            </div>
            <div className="text-xs text-text-muted">Duration</div>
          </div>
        </div>

        {/* PR badges */}
        {prs.length > 0 && (
          <div className="space-y-1">
            {prs.slice(0, 2).map((pr, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-warning">
                <span>🏆</span>
                <span className="font-medium">PR: {pr.exercise} — {pr.e1RM} kg e1RM</span>
              </div>
            ))}
            {prs.length > 2 && (
              <div className="text-xs text-text-muted">+{prs.length - 2} more PR{prs.length - 2 > 1 ? 's' : ''}</div>
            )}
          </div>
        )}
      </button>

      <SessionDetailSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        activity={activity}
      />
    </>
  )
}
