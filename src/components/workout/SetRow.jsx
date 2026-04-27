// src/components/workout/SetRow.jsx
import { useState, useRef, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import checkIcon from '@/assets/icons/icon-check.svg'
import { useUnitPreference } from '@/hooks/useProfile'
import { convertWeight } from '@/lib/units'

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]
const SWIPE_THRESHOLD = 60
const REMOVE_ZONE_WIDTH = 80

// Display the canonical lbs `set.weight` as a kg input string.
function lbsToKgInput(lbs) {
  if (lbs === '' || lbs == null) return ''
  const kg = convertWeight(parseFloat(lbs), 'lbs', 'kg')
  if (isNaN(kg)) return ''
  // Round to 1 decimal, trim trailing zero so editing feels natural
  return String(Math.round(kg * 10) / 10)
}

export default function SetRow({ setNumber, set, onChange, onComplete, onRemove, highlighted = false, hideComplete = false, inputType = 'reps', showLabels = false }) {
  const { weight = '', reps = '', rpe = '', completed = false } = set
  const unit = useUnitPreference()
  const [swipeX, setSwipeX] = useState(0)
  const touchStartXRef = useRef(null)

  // Local string for the kg input so user typing doesn't drift via lbs round-trip
  const [kgInput, setKgInput] = useState(() => unit === 'kg' ? lbsToKgInput(weight) : '')
  const lastInternalLbsRef = useRef(weight)

  // Sync local kg input when set.weight changes externally or the unit toggles
  useEffect(() => {
    if (unit !== 'kg') return
    if (weight === lastInternalLbsRef.current) return // change came from us; skip
    setKgInput(lbsToKgInput(weight))
    lastInternalLbsRef.current = weight
  }, [weight, unit])

  function handleWeightChange(e) {
    const v = e.target.value
    if (unit === 'kg') {
      setKgInput(v)
      const lbs = v === '' ? '' : convertWeight(parseFloat(v), 'kg', 'lbs')
      const stored = lbs === '' || isNaN(lbs) ? '' : lbs
      lastInternalLbsRef.current = stored
      onChange({ ...set, weight: stored, suggested: false })
    } else {
      onChange({ ...set, weight: v, suggested: false })
    }
  }

  function handleRepsChange(e) {
    const v = e.target.value
    onChange(
      inputType === 'time'
        ? { ...set, duration_seconds: v, suggested: false }
        : { ...set, reps: v, suggested: false }
    )
  }

  function handleComplete() {
    if (!completed) onComplete()
    else onChange({ ...set, completed: false, editing: true })
  }

  function handleTouchStart(e) {
    if (!onRemove) return
    touchStartXRef.current = e.touches[0].clientX
  }

  function handleTouchMove(e) {
    if (!onRemove || touchStartXRef.current === null) return
    const dx = touchStartXRef.current - e.touches[0].clientX
    if (swipeX > 0 && dx < -10) {
      setSwipeX(0)
      touchStartXRef.current = null
      return
    }
    if (dx > 0) setSwipeX(Math.min(dx, REMOVE_ZONE_WIDTH))
  }

  function handleTouchEnd() {
    if (!onRemove) return
    setSwipeX(prev => prev >= SWIPE_THRESHOLD ? REMOVE_ZONE_WIDTH : 0)
    touchStartXRef.current = null
  }

  function resetSwipe() {
    setSwipeX(0)
  }

  const cellState = completed
    ? 'bg-[#0a0a0a] border border-transparent opacity-50 pointer-events-none'
    : highlighted
    ? 'bg-[rgba(242,166,85,0.05)] border border-[rgba(242,166,85,0.5)]'
    : 'bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)]'

  const cellBase = `w-full h-[44px] pt-[12px] pb-[11px] px-[10px] rounded-[4px] font-commons text-[18px] text-[rgba(255,255,255,0.6)] tracking-[-0.5px] text-center focus:outline-none ${cellState}`

  const labelClass = 'font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] shrink-0'

  const innerAlign = showLabels ? 'items-end' : 'items-center'

  return (
    <div className="relative overflow-hidden mb-[12px]">
      {onRemove && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center transition-colors"
          style={{ width: REMOVE_ZONE_WIDTH, zIndex: 0, backgroundColor: swipeX > 0 ? '#f87171' : 'transparent' }}
          onClick={onRemove}
        >
          {swipeX >= SWIPE_THRESHOLD && <span className="text-white text-xs font-semibold">Remove</span>}
        </div>
      )}
      <div
        style={{
          transform: `translateX(-${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.2s ease' : 'none',
          zIndex: 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swipeX > 0 ? resetSwipe : undefined}
        className="relative flex gap-[16px] items-end w-full"
      >
        {/* Set number — fixed height to align with input cell */}
        <div className="flex flex-col h-[44px] items-center justify-center flex-shrink-0">
          <span className="font-commons font-semibold text-[18px] text-[#9d9d9d] tracking-[-0.5px]">{setNumber}</span>
        </div>

        {/* Inputs + check button */}
        <div className={`flex flex-1 gap-[8px] ${innerAlign} min-w-0`}>

          {/* Weight */}
          <div className="flex flex-1 flex-col gap-[8px] min-w-0">
            {showLabels && (
              <span className={labelClass}>
                Weight ({unit})
                {set.suggested && (
                  <span className="ml-1 text-accent">· Suggested</span>
                )}
              </span>
            )}
            <input
              type="number"
              inputMode="decimal"
              value={unit === 'kg' ? kgInput : weight}
              onChange={handleWeightChange}
              placeholder={unit}
              readOnly={completed}
              className={`${cellBase} ${set.suggested ? 'border-accent/50' : ''}`}
            />
          </div>

          {/* Reps / Time */}
          <div className="flex flex-1 flex-col gap-[8px] min-w-0">
            {showLabels && <span className={labelClass}>{inputType === 'time' ? 'Sec' : 'Reps'}</span>}
            <input
              type="number"
              inputMode="numeric"
              value={inputType === 'time' ? (set.duration_seconds ?? '') : reps}
              onChange={handleRepsChange}
              placeholder={inputType === 'time' ? 'sec' : 'reps'}
              readOnly={completed}
              className={cellBase}
            />
          </div>

          {/* RPE */}
          <div className="flex flex-1 flex-col gap-[8px] min-w-0">
            {showLabels && <span className={labelClass}>RPE</span>}
            <select
              value={rpe}
              onChange={e => onChange({ ...set, rpe: e.target.value })}
              disabled={completed}
              className={cellBase}
            >
              <option value="">RPE</option>
              {RPE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Check / Done button */}
          {!hideComplete ? (
            <div className="flex flex-col gap-[8px] flex-shrink-0">
              {showLabels && <span className={`${labelClass} invisible`}>·</span>}
              <button
                onClick={handleComplete}
                className={`h-[44px] w-[44px] rounded-[4px] flex items-center justify-center transition-colors ${
                  completed
                    ? 'bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] text-white/60'
                    : 'bg-[rgba(255,255,255,0.1)] border border-transparent text-white/80'
                }`}
              >
                {completed ? <Pencil size={16} /> : <img src={checkIcon} alt="" className="w-[16px] h-[16px]" />}
              </button>
            </div>
          ) : (
            <div className="w-[44px] flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  )
}
