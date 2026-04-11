import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useSessions } from '@/hooks/useSessions'
import { useProgram } from '@/hooks/useProgram'
import { useAuth } from '@/hooks/useAuth'
import { useWorkoutTemplates, useDeleteTemplate } from '@/hooks/useTemplates'
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
  const { data: templates = [] } = useWorkoutTemplates()
  const { mutateAsync: deleteTemplate, isPending: deletePending } = useDeleteTemplate()

  const [templateToDelete, setTemplateToDelete] = useState(null)

  const { config, program, blockInfo, nextSession } = programData || {}
  const recent = sessions.slice(0, 3)

  function startSession(session) {
    navigate('/workout', { state: { session, programId: program?.id } })
  }

  function startCustomWorkout() {
    navigate('/workout', { state: { mode: 'custom' } })
  }

  function startTemplateWorkout(template) {
    navigate('/workout', { state: { mode: 'template', template } })
  }

  async function confirmDelete() {
    if (!templateToDelete) return
    await deleteTemplate(templateToDelete.id)
    setTemplateToDelete(null)
  }

  // Compute last-used date for a template by matching sessionName
  function getLastUsed(templateName) {
    const match = sessions.find(s => s.sessionName === templateName)
    return match?.date ? formatDate(match.date, true) : 'Never used'
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

      {/* Start Custom Workout */}
      <button
        onClick={startCustomWorkout}
        className="w-full mb-4 py-3 border border-accent text-accent font-semibold rounded-xl text-sm hover:bg-accent/10 transition-colors"
      >
        Start Custom Workout
      </button>

      {/* My Workouts section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-text-secondary">My Workouts</div>
          <button
            onClick={startCustomWorkout}
            className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            aria-label="Start custom workout"
          >
            <Plus size={14} />
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-5 text-center">
            <p className="text-text-muted text-sm">
              No saved workouts yet. Start a custom workout and save it when you're done.
            </p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                lastUsed={getLastUsed(template.name)}
                onStart={() => startTemplateWorkout(template)}
                onDeleteRequest={() => setTemplateToDelete(template)}
              />
            ))}
          </div>
        )}
      </div>

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

      {/* Delete confirmation dialog */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="font-bold text-text-primary mb-2">Delete "{templateToDelete.name}"?</h3>
            <p className="text-text-secondary text-sm mb-5">This workout template will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setTemplateToDelete(null)}
                className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletePending}
                className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {deletePending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TemplateCard({ template, lastUsed, onStart, onDeleteRequest }) {
  const longPressTimer = useRef(null)

  function handleTouchStart() {
    longPressTimer.current = setTimeout(onDeleteRequest, 600)
  }
  function handleTouchEnd() {
    clearTimeout(longPressTimer.current)
  }

  return (
    <button
      onClick={onStart}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={e => { e.preventDefault(); onDeleteRequest() }}
      aria-label={`Start ${template.name} workout`}
      className="flex-shrink-0 w-36 bg-bg-card border border-bg-tertiary rounded-xl p-3 text-left hover:border-accent/50 transition-colors"
    >
      <div className="text-xs font-semibold text-text-primary mb-1 truncate">{template.name}</div>
      <div className="text-xs text-text-muted">{template.exercises?.length ?? 0} exercises</div>
      <div className="text-xs text-text-muted mt-0.5">{lastUsed}</div>
    </button>
  )
}
