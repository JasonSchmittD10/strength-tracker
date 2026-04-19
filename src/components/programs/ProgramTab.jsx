import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgram } from '@/hooks/useProgram'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import PrimaryButton from '@/components/shared/PrimaryButton'

export default function ProgramTab() {
  const navigate = useNavigate()
  const { data, isLoading } = useProgram()
  const [previewSession, setPreviewSession] = useState(null)

  if (isLoading) return <LoadingSpinner />

  const { program, blockInfo, nextSession } = data || {}

  function startWorkout() {
    navigate('/workout', { state: { session: previewSession, programId: program?.id } })
  }

  return (
    <div className="safe-top px-4 pb-8 max-w-lg mx-auto">
      <h1 className="font-bold text-2xl text-text-primary py-4">Program</h1>

      {/* Active program + block/week status */}
      {program && (
        <div className="bg-bg-card border border-bg-tertiary rounded-2xl p-4 mb-4">
          <div className="font-bold text-lg text-text-primary mb-1">{program.name}</div>
          <div className="text-sm text-text-secondary mb-3">{program.description}</div>

          {blockInfo ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-text-secondary">
                  Block {blockInfo.blockNumber} · Week {blockInfo.weekInBlock} of {blockInfo.weeksPerBlock}
                </span>
                <span className="text-xs font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-full">
                  {blockInfo.phaseName}
                </span>
                {blockInfo.isDeload && (
                  <span className="text-xs font-semibold text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
                    Deload
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${(blockInfo.weekInBlock / blockInfo.weeksPerBlock) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-xs text-text-muted">Set a start date to track your block progress.</div>
          )}
        </div>
      )}

      {/* Session rotation */}
      {program && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Sessions</div>
          <div className="space-y-2">
            {program.sessionOrder.map(sessionId => {
              const session = program.sessions.find(s => s.id === sessionId)
              if (!session) return null
              const isNext = nextSession?.id === session.id
              return (
                <button
                  key={session.id}
                  onClick={() => setPreviewSession(session)}
                  className={`w-full text-left bg-bg-card rounded-2xl p-4 border transition-colors active:scale-[0.98] ${
                    isNext
                      ? 'border-accent/60'
                      : 'border-bg-tertiary opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-semibold text-text-primary">{session.name}</div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      {isNext && (
                        <span className="text-xs font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-full">
                          Up Next
                        </span>
                      )}
                      <span className="text-xs font-semibold text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
                        {session.tagLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary mb-1">{session.focus}</div>
                  <div className="text-xs text-text-muted">{session.exercises.length} exercises</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Program management */}
      <button
        onClick={() => navigate('/program-selector')}
        className="w-full py-3 rounded-xl border border-bg-tertiary text-sm text-text-secondary font-medium hover:border-accent/50 active:border-accent transition-colors"
      >
        Switch Program
      </button>

      {/* Session preview sheet */}
      <SlideUpSheet
        open={!!previewSession}
        onClose={() => setPreviewSession(null)}
        title={previewSession?.name ?? ''}
        heightClass="h-[80vh]"
      >
        {previewSession && (
          <div className="flex flex-col h-full">
            {/* Session meta */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
                {previewSession.tagLabel}
              </span>
              <span className="text-xs text-text-secondary">{previewSession.focus}</span>
            </div>

            {/* Exercise list */}
            <div className="flex-1 space-y-2 overflow-y-auto pb-4">
              {previewSession.exercises.map((ex, i) => (
                <div key={i} className="bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3">
                  <div className="font-medium text-sm text-text-primary mb-1">{ex.name}</div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>{ex.sets} sets × {ex.reps}</span>
                    <span>·</span>
                    <span>{ex.restLabel} rest</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Start button */}
            <div className="pt-3 border-t border-bg-tertiary flex-shrink-0">
              <PrimaryButton onClick={startWorkout}>
                Start Workout
              </PrimaryButton>
            </div>
          </div>
        )}
      </SlideUpSheet>
    </div>
  )
}
