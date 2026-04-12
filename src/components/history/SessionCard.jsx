import { useState } from 'react'
import { formatDate, formatDuration, formatVolume, totalVolume } from '@/lib/utils'
import { useUnitPreference } from '@/hooks/useProfile'
import { useDeleteSession } from '@/hooks/useSessions'
import SlideUpSheet from '@/components/shared/SlideUpSheet'

const TAG_COLORS = {
  push: 'bg-push/15 text-push border-push/30',
  pull: 'bg-pull/15 text-pull border-pull/30',
  legs: 'bg-legs/15 text-legs border-legs/30',
}

export default function SessionCard({ session }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { mutateAsync: deleteSession, isPending: deleting } = useDeleteSession()
  const unit = useUnitPreference()

  async function handleDelete() {
    await deleteSession(session._id)
    setDetailOpen(false)
    setConfirmDelete(false)
  }
  const vol = totalVolume(session.exercises || [])
  const completedSets = (session.exercises || []).reduce((n, ex) => n + (ex.sets || []).filter(s => s.completed !== false).length, 0)

  return (
    <>
      <button
        onClick={() => setDetailOpen(true)}
        className="w-full bg-bg-card border border-bg-tertiary rounded-2xl p-4 text-left hover:border-accent/30 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {session.tag && (
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[session.tag] || 'bg-accent/15 text-accent border-accent/30'}`}>
                  {session.tagLabel || session.tag}
                </span>
              )}
            </div>
            <div className="font-bold text-text-primary">{session.sessionName}</div>
            <div className="text-xs text-text-muted mt-0.5">{formatDate(session.date)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-text-secondary">{formatVolume(vol)} {unit}</div>
            {session.duration && <div className="text-xs text-text-muted">{formatDuration(session.duration)}</div>}
            <div className="text-xs text-text-muted">{completedSets} sets</div>
          </div>
        </div>
      </button>

      <SlideUpSheet
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setConfirmDelete(false) }}
        title={session.sessionName}
        footer={confirmDelete ? (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary text-center">Delete this workout? This can't be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2 text-danger text-sm font-medium hover:opacity-80 transition-opacity"
          >
            Delete Workout
          </button>
        )}
      >
        <div className="space-y-4">
          <div className="flex gap-4 text-sm text-text-secondary">
            <span>{formatDate(session.date)}</span>
            {session.duration && <span>{formatDuration(session.duration)}</span>}
            <span>{formatVolume(vol)} {unit}</span>
          </div>
          {(session.exercises || []).map((ex, i) => {
            const exVol = totalVolume([ex])
            return (
              <div key={i}>
                <div className="font-semibold text-text-primary mb-1">{ex.name}</div>
                <div className="text-xs text-text-muted mb-1">{formatVolume(exVol)} {unit} volume</div>
                {(ex.sets || []).map((s, j) => (
                  <div key={j} className="text-sm text-text-secondary py-0.5">
                    {j + 1}. {s.weight}{unit} × {s.reps} reps{s.rpe ? ` @ ${s.rpe} RPE` : ''}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </SlideUpSheet>
    </>
  )
}
