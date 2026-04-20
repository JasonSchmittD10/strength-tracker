// src/components/workout/SetRow.jsx
import { useState, useRef } from 'react'
import { Check, Pencil } from 'lucide-react'
import { useUnitPreference } from '@/hooks/useProfile'

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]
const SWIPE_THRESHOLD = 60
const REMOVE_ZONE_WIDTH = 80

export default function SetRow({ setNumber, set, onChange, onComplete, onRemove, highlighted = false, hideComplete = false, inputType = 'reps', showLabels = false }) {
  const { weight = '', reps = '', rpe = '', completed = false } = set
  const unit = useUnitPreference()
  const [swipeX, setSwipeX] = useState(0)
  const touchStartXRef = useRef(null)

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

  const inputStateClass = completed
    ? 'bg-[#0a0a0a] border border-transparent text-white/60 opacity-50 pointer-events-none'
    : highlighted
    ? 'bg-[rgba(242,166,85,0.05)] border border-[rgba(242,166,85,0.5)] text-white/60'
    : 'bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] text-white/60'

  const inputBase = 'w-full rounded-[4px] py-[12px] font-commons text-[18px] text-center focus:outline-none min-h-[44px]'
  const inputClass = `${inputBase} px-[10px] ${inputStateClass}`
  const rpeSelectClass = `${inputBase} px-[4px] ${inputStateClass}`

  return (
    <div className="relative overflow-hidden rounded-[4px] mb-[8px]">
      {onRemove && (
        <div
          className="absolute right-0 top-0 bottom-0 bg-danger flex items-center justify-center"
          style={{ width: REMOVE_ZONE_WIDTH }}
          onClick={onRemove}
        >
          <span className="text-white text-xs font-semibold">Remove</span>
        </div>
      )}
      <div
        style={{
          transform: `translateX(-${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.2s ease' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swipeX > 0 ? resetSwipe : undefined}
        className="flex items-end gap-[8px] bg-bg-card"
      >
        {/* Set number */}
        <div className="flex flex-col items-center justify-end flex-shrink-0 w-[24px]">
          {showLabels && <span className="font-commons text-[14px] text-[#8b8b8b] mb-[8px] invisible">·</span>}
          <span className="font-commons font-semibold text-[18px] text-[#9d9d9d] leading-none pb-[13px]">{setNumber}</span>
        </div>

        {/* Weight */}
        <div className="flex-1 flex flex-col gap-[4px]">
          {showLabels && <span className="font-commons text-[14px] text-[#8b8b8b] text-center">Weight</span>}
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={e => onChange({ ...set, weight: e.target.value })}
            placeholder={unit}
            readOnly={completed}
            className={inputClass}
          />
        </div>

        {/* Reps / Time */}
        <div className="flex-1 flex flex-col gap-[4px]">
          {showLabels && <span className="font-commons text-[14px] text-[#8b8b8b] text-center">{inputType === 'time' ? 'Sec' : 'Reps'}</span>}
          <input
            type="number"
            inputMode="numeric"
            value={inputType === 'time' ? (set.duration_seconds ?? '') : reps}
            onChange={e => onChange(
              inputType === 'time'
                ? { ...set, duration_seconds: e.target.value }
                : { ...set, reps: e.target.value }
            )}
            placeholder={inputType === 'time' ? 'sec' : 'reps'}
            readOnly={completed}
            className={inputClass}
          />
        </div>

        {/* RPE */}
        <div className="flex-1 flex flex-col gap-[4px]">
          {showLabels && <span className="font-commons text-[14px] text-[#8b8b8b] text-center">RPE</span>}
          <select
            value={rpe}
            onChange={e => onChange({ ...set, rpe: e.target.value })}
            disabled={completed}
            className={rpeSelectClass}
          >
            <option value="">RPE</option>
            {RPE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* Check / Done button */}
        {!hideComplete ? (
          <button
            onClick={handleComplete}
            className={`w-[44px] h-[44px] rounded-[4px] flex items-center justify-center flex-shrink-0 transition-colors ${
              completed
                ? 'bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] text-white/60'
                : 'bg-[rgba(255,255,255,0.1)] border border-transparent text-white/80'
            }`}
          >
            {completed ? <Pencil size={16} /> : <Check size={16} />}
          </button>
        ) : (
          <div className="w-[44px] flex-shrink-0" />
        )}
      </div>
    </div>
  )
}
