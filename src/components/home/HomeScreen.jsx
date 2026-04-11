import { useNavigate } from 'react-router-dom'
import { useSessions } from '@/hooks/useSessions'
import { useProgram } from '@/hooks/useProgram'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatDuration, formatVolume, totalVolume } from '@/lib/utils'

const TAG_COLORS = {
  push: 'bg-push/15 text-push border-push/30',
  pull: 'bg-pull/15 text-pull border-pull/30',
  legs: 'bg-legs/15 text-legs border-legs/30',
}

function TagPill({ tag, label }) {
  return (
    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || 'bg-accent/15 text-accent border-accent/30'}`}>
      {label}
    </span>
  )
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: sessions = [] } = useSessions()
  const { data: programData, isLoading } = useProgram()

  const { config, program, blockInfo, nextSession } = programData || {}
  const recent = sessions.slice(0, 3)

  function startSession(session) {
    navigate('/workout', { state: { session, programId: program?.id } })
  }

  const initial = user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="safe-top px-4 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <h1 className="font-bold text-2xl text-text-primary tracking-tight">Hybrid</h1>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold"
        >
          {initial}
        </button>
      </div>

      {/* Block info badge */}
      {blockInfo && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-text-muted font-medium">
            Block {blockInfo.blockNumber} · Week {blockInfo.weekInBlock} ·{' '}
            <span className={blockInfo.isDeload ? 'text-warning' : 'text-text-secondary'}>
              {blockInfo.phaseName}
            </span>
          </span>
        </div>
      )}

      {/* Next Up card */}
      {isLoading ? (
        <div className="bg-bg-card rounded-2xl p-5 mb-4 h-32 animate-pulse" />
      ) : nextSession && (
        <div className="bg-bg-card rounded-2xl border border-bg-tertiary p-5 mb-4">
          <div className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Up Next</div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TagPill tag={nextSession.tag} label={nextSession.tagLabel} />
              </div>
              <div className="text-xl font-bold text-text-primary">{nextSession.name}</div>
              <div className="text-sm text-text-secondary mt-0.5">{nextSession.focus}</div>
              <div className="text-xs text-text-muted mt-1">{nextSession.exercises.length} exercises</div>
            </div>
          </div>
          {blockInfo?.isDeload && (
            <div className="text-xs text-warning mb-3">↓ Deload week — reduce loads ~10%</div>
          )}
          <button
            onClick={() => startSession(nextSession)}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Start Workout
          </button>
        </div>
      )}

      {/* Quick Start */}
      {program && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-text-secondary mb-2">Quick Start</div>
          <div className="grid grid-cols-3 gap-2">
            {program.sessions.map(s => (
              <button
                key={s.id}
                onClick={() => startSession(s)}
                className="bg-bg-card border border-bg-tertiary rounded-xl p-3 text-left hover:border-accent/50 transition-colors"
              >
                <TagPill tag={s.tag} label={s.tagLabel} />
                <div className="text-xs font-semibold text-text-primary mt-1.5">{s.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-text-secondary">Recent</div>
            <button onClick={() => navigate('/history')} className="text-xs text-accent">See all</button>
          </div>
          <div className="space-y-2">
            {recent.map((s, i) => (
              <div key={s._id || i} className="bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-primary">{s.sessionName}</div>
                  <div className="text-xs text-text-muted">{formatDate(s.date, true)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-secondary">{formatVolume(totalVolume(s.exercises))} kg</div>
                  {s.duration && <div className="text-xs text-text-muted">{formatDuration(s.duration)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
