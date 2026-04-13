import { useNavigate } from 'react-router-dom'
import { useProgram } from '@/hooks/useProgram'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function ProgramTab() {
  const navigate = useNavigate()
  const { data, isLoading } = useProgram()

  if (isLoading) return <LoadingSpinner />

  const { program, blockInfo, nextSession } = data || {}

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
                <div
                  key={session.id}
                  className={`bg-bg-card rounded-2xl p-4 border transition-colors ${
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
                </div>
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
    </div>
  )
}
