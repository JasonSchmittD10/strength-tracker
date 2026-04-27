import { useState, useEffect, useRef } from 'react'
import useElapsedTimer from '@/hooks/useElapsedTimer'
import { formatDuration, modalityLabel } from '@/lib/conditioning'

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Round-based interval timer. Auto-advances WORK → REST → WORK across rounds
// using an internal countdown for each phase. The cumulative timer (elapsed)
// is the total real time the user spent in this block.
//
// Block shape (subset of ConditioningBlock):
//   { type: 'intervals', modality, rounds, workInterval: { duration, intensity },
//     restInterval: { duration, type: 'active' | 'passive' }, name, description }
export default function IntervalsBlock({ block, onSave, busy }) {
  const totalRounds = block.rounds ?? 1
  const workDur = block.workInterval?.duration ?? 0
  const restDur = block.restInterval?.duration ?? 0
  const workIntensity = block.workInterval?.intensity
  const restType = block.restInterval?.type ?? 'passive'

  const [phase, setPhase] = useState('idle') // 'idle' | 'work' | 'rest' | 'done' | 'logging'
  const [paused, setPaused] = useState(true)
  const [round, setRound] = useState(1) // 1-indexed
  const [phaseRemaining, setPhaseRemaining] = useState(workDur)
  const [laps, setLaps] = useState([]) // recorded work-interval times in seconds
  const [rpe, setRpe] = useState(null)
  const [notes, setNotes] = useState('')

  const cumulative = useElapsedTimer(paused)

  // Phase countdown
  useEffect(() => {
    if (paused || phase === 'idle' || phase === 'done' || phase === 'logging') return
    if (phaseRemaining <= 0) return
    const id = setInterval(() => {
      setPhaseRemaining(prev => {
        if (prev <= 1) {
          // advance: clear interval will run on next render
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase, paused, phaseRemaining])

  // Auto-advance when phaseRemaining hits 0
  useEffect(() => {
    if (paused || phase === 'idle' || phase === 'done' || phase === 'logging') return
    if (phaseRemaining > 0) return
    advancePhase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseRemaining])

  function advancePhase() {
    if (phase === 'work') {
      setLaps(prev => [...prev, workDur])
      if (restDur > 0 && round < totalRounds) {
        setPhase('rest')
        setPhaseRemaining(restDur)
      } else if (round < totalRounds) {
        // No rest interval — straight to next work
        setRound(r => r + 1)
        setPhase('work')
        setPhaseRemaining(workDur)
      } else {
        finishWorkout()
      }
    } else if (phase === 'rest') {
      setRound(r => r + 1)
      setPhase('work')
      setPhaseRemaining(workDur)
    }
  }

  function finishWorkout() {
    setPhase('done')
    setPaused(true)
  }

  function handleStart() {
    setPhase('work')
    setPhaseRemaining(workDur || 60)
    setPaused(false)
  }

  function handleSkip() {
    advancePhase()
  }

  function handleStop() {
    // User stops mid-workout — confirm
    if (phase === 'work' || phase === 'rest') {
      const ok = window.confirm(`Stop after round ${round} of ${totalRounds}?`)
      if (!ok) return
    }
    finishWorkout()
  }

  function handleSave() {
    onSave({
      block_index: 0,
      modality: block.modality ?? 'open',
      duration_seconds: cumulative,
      distance_value: null,
      distance_unit: null,
      avg_pace_seconds_per_unit: null,
      rounds_completed: laps.length,
      rpe,
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Header */}
      <div className="flex flex-col gap-[6px]">
        <span className="font-commons text-[14px] text-text-muted uppercase tracking-wider">
          {modalityLabel(block.modality)} · {totalRounds} rounds
        </span>
        <p className="font-judge text-[36px] text-white leading-tight">{block.name}</p>
        {block.description && (
          <p className="font-commons text-[14px] text-text-secondary leading-[18px]">
            {block.description}
          </p>
        )}
      </div>

      {/* Round counter + phase */}
      {phase !== 'idle' && phase !== 'logging' && (
        <div className="flex flex-col items-center gap-2">
          <span className="font-commons text-[16px] text-text-muted uppercase tracking-wider">
            Round {Math.min(round, totalRounds)} of {totalRounds}
          </span>
          {phase !== 'done' && (
            <span className={`font-commons font-bold text-[18px] uppercase tracking-wider ${
              phase === 'work' ? 'text-accent' : 'text-pull'
            }`}>
              {phase === 'work' ? 'Work' : `${restType === 'active' ? 'Active' : 'Passive'} Rest`}
            </span>
          )}
        </div>
      )}

      {/* Phase timer (countdown) */}
      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-[40px] flex flex-col items-center gap-3">
        {phase === 'idle' && (
          <span className="font-judge text-[64px] text-white leading-none tabular-nums">
            {formatDuration(workDur || 0)}
          </span>
        )}
        {(phase === 'work' || phase === 'rest') && (
          <span className="font-judge text-[80px] text-white leading-none tabular-nums">
            {formatDuration(phaseRemaining)}
          </span>
        )}
        {phase === 'done' && (
          <span className="font-judge text-[64px] text-white leading-none">Done</span>
        )}
        {phase === 'work' && workIntensity && (
          <span className="font-commons text-[14px] text-text-muted">
            Target: {workIntensity}
          </span>
        )}
        {phase !== 'idle' && phase !== 'logging' && (
          <span className="font-commons text-[12px] text-text-muted">
            Total: {formatDuration(cumulative)}
          </span>
        )}
      </div>

      {/* Lap times */}
      {laps.length > 0 && phase !== 'logging' && (
        <div className="flex flex-col gap-1">
          <span className="font-commons text-[12px] text-text-muted uppercase tracking-wider">Laps</span>
          <div className="flex flex-wrap gap-2">
            {laps.map((t, i) => (
              <span key={i} className="font-commons text-[14px] text-text-secondary bg-bg-tertiary rounded px-2 py-1">
                {i + 1}. {formatDuration(t)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      {phase === 'idle' && (
        <button
          type="button"
          onClick={handleStart}
          className="h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black"
        >
          Start
        </button>
      )}
      {(phase === 'work' || phase === 'rest') && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPaused(p => !p)}
            className="flex-1 h-[46px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons font-bold text-[18px] text-white"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 h-[46px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons font-bold text-[18px] text-white"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="flex-1 h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black"
          >
            Stop
          </button>
        </div>
      )}
      {phase === 'done' && (
        <button
          type="button"
          onClick={() => setPhase('logging')}
          className="h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black"
        >
          Log Result
        </button>
      )}

      {/* Logging */}
      {phase === 'logging' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-commons text-[14px] text-text-secondary">
              Completed {laps.length} of {totalRounds} rounds · Total {formatDuration(cumulative)}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-commons text-[14px] text-text-secondary">Overall RPE</label>
            <div className="grid grid-cols-10 gap-1">
              {RPE_VALUES.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRpe(v)}
                  className={`h-10 rounded-md font-commons font-semibold text-[14px] transition-colors ${
                    rpe === v
                      ? 'bg-accent text-black'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-commons text-[14px] text-text-secondary">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional"
              className="bg-bg-tertiary rounded-lg px-3 py-2.5 text-text-primary text-[16px] focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
