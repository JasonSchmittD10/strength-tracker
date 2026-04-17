import { useState } from 'react'
import { Trophy } from 'lucide-react'
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

function formatFullDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} at ${time}`
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
  const avatarUrl = activity.profiles?.avatar_url || null
  const timeLabel = formatDisplayDate(displayDate || activity.created_at)
  const fullDate = formatFullDate(displayDate || activity.created_at)

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
        className="w-full bg-bg-deep rounded-[12px] p-4 text-left"
      >
        {/* User + timestamp */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-bg-tertiary flex items-center justify-center">
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              : <span className="text-white text-sm font-bold">{initial}</span>
            }
          </div>
          <div className="min-w-0">
            <div className="text-base font-commons text-text-primary leading-tight">{displayName}</div>
            <div className="text-xs font-commons text-text-secondary tracking-[0.01em]">{fullDate}</div>
          </div>
        </div>

        {/* Session title + program */}
        <div className="mb-4">
          <div className="font-judge text-[26px] font-bold leading-tight text-text-primary">{sessionName}</div>
          <div className="text-base font-commons text-text-secondary">{programLabel}</div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { value: formatVolume(vol ?? 0), label: 'Volume' },
            { value: totalSets ?? 0, label: 'Sets' },
            { value: durationSeconds > 0 ? formatDuration(durationSeconds) : '—', label: 'Duration' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-bg-stat rounded-sm py-4 flex flex-col items-center justify-center gap-1">
              <div className="font-judge text-[26px] font-bold leading-none text-text-primary">{value}</div>
              <div className="text-sm font-commons text-text-secondary text-center">{label}</div>
            </div>
          ))}
        </div>

        {/* PR badge */}
        {prs.length > 0 && (
          <div className="bg-bg-badge rounded-sm px-3 py-2 flex items-center gap-2">
            <Trophy size={22} className="text-warning flex-shrink-0" />
            <span className="font-commons font-semibold text-text-primary text-sm">
              PR: {prs[0].exercise} - {prs[0].e1RM} kg e1RM
            </span>
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
