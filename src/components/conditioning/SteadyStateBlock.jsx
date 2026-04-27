import { useState, useEffect, useMemo } from 'react'
import useElapsedTimer from '@/hooks/useElapsedTimer'
import { computeAvgPace, formatDuration, formatPace, modalityLabel } from '@/lib/conditioning'

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Steady-state and tempo-style conditioning block: one timer that counts up,
// optional distance + RPE + notes at the end. Same UI is used for both type
// 'steady-state' and 'tempo' (the only difference is target intensity copy).
export default function SteadyStateBlock({ block, distanceUnit = 'mi', onSave, busy }) {
  const [phase, setPhase] = useState('idle') // 'idle' | 'running' | 'logging'
  const [paused, setPaused] = useState(true)
  const elapsed = useElapsedTimer(paused)
  const [distance, setDistance] = useState('')
  const [rpe, setRpe] = useState(null)
  const [notes, setNotes] = useState('')

  function handleStart() {
    setPhase('running')
    setPaused(false)
  }
  function handleStop() {
    setPaused(true)
    setPhase('logging')
  }
  function handleSave() {
    const dv = distance === '' ? null : parseFloat(distance)
    onSave({
      block_index: 0,
      modality: block.modality ?? 'open',
      duration_seconds: elapsed,
      distance_value: dv && !isNaN(dv) ? dv : null,
      distance_unit: dv ? distanceUnit : null,
      avg_pace_seconds_per_unit: computeAvgPace(elapsed, dv),
      rounds_completed: null,
      rpe,
      notes: notes.trim() || null,
    })
  }

  const targetMinutes = block.duration ?? null

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Header */}
      <div className="flex flex-col gap-[6px]">
        <span className="font-commons text-[14px] text-text-muted uppercase tracking-wider">
          {modalityLabel(block.modality)}
          {targetMinutes ? ` · ${targetMinutes} min target` : ''}
        </span>
        <p className="font-judge text-[36px] text-white leading-tight">{block.name}</p>
        {block.description && (
          <p className="font-commons text-[14px] text-text-secondary leading-[18px]">
            {block.description}
          </p>
        )}
        {block.targetIntensity && (
          <span className="self-start mt-1 font-commons text-[14px] text-accent bg-accent/15 border border-accent/30 px-2 py-0.5 rounded-full font-semibold">
            Target: {block.targetIntensity}
          </span>
        )}
      </div>

      {/* Timer */}
      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-[40px] flex flex-col items-center gap-3">
        <span className="font-judge text-[64px] sm:text-[80px] text-white leading-none tabular-nums">
          {formatDuration(elapsed)}
        </span>
        {phase === 'running' && (
          <span className="font-commons text-[12px] text-text-muted uppercase tracking-wider">
            {paused ? 'Paused' : 'Running'}
          </span>
        )}
      </div>

      {/* Controls */}
      {phase !== 'logging' && (
        <div className="flex gap-3">
          {phase === 'idle' ? (
            <button
              type="button"
              onClick={handleStart}
              className="flex-1 h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black"
            >
              Start
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPaused(p => !p)}
                className="flex-1 h-[46px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons font-bold text-[18px] text-white"
              >
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={handleStop}
                className="flex-1 h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black"
              >
                Stop
              </button>
            </>
          )}
        </div>
      )}

      {/* Logging — distance + RPE + notes */}
      {phase === 'logging' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-commons text-[14px] text-text-secondary">
              Distance ({distanceUnit})
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={distance}
              onChange={e => setDistance(e.target.value)}
              placeholder={distanceUnit === 'km' ? 'e.g. 6.5' : 'e.g. 4.0'}
              className="bg-bg-tertiary rounded-lg px-3 py-2.5 text-text-primary text-[16px] focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {distance && parseFloat(distance) > 0 && (
              <span className="font-commons text-[12px] text-text-muted">
                Avg pace: {formatPace(computeAvgPace(elapsed, parseFloat(distance)), distanceUnit)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-commons text-[14px] text-text-secondary">RPE</label>
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setPhase('running'); setPaused(false) }}
              disabled={busy}
              className="flex-1 h-[46px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons font-bold text-[18px] text-white disabled:opacity-50"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="flex-1 h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
