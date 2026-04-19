// src/components/workout/SetRow.jsx
import { useState, useRef } from 'react'
import { Check, Pencil } from 'lucide-react'
import { useUnitPreference } from '@/hooks/useProfile'

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]
const SWIPE_THRESHOLD = 60
const REMOVE_ZONE_WIDTH = 80

export default function SetRow({ setNumber, set, onChange, onComplete, onRemove, highlighted = false, hideComplete = false }) {
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

  return (
    <div className={`relative overflow-hidden rounded-lg ${highlighted ? 'ring-1 ring-accent' : ''}`}>
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
        className={`flex items-center gap-2 py-2 bg-bg-card ${completed ? 'opacity-60' : ''}`}
      >
        <span className="w-6 text-center text-xs text-text-muted font-medium">{setNumber}</span>

        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={e => onChange({ ...set, weight: e.target.value })}
          placeholder={unit}
          readOnly={completed}
          className={`flex-1 min-w-0 bg-bg-tertiary rounded-lg px-2 py-2.5 text-center text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px] ${completed ? 'pointer-events-none' : ''}`}
        />

        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={e => onChange({ ...set, reps: e.target.value })}
          placeholder="reps"
          readOnly={completed}
          className={`flex-1 min-w-0 bg-bg-tertiary rounded-lg px-2 py-2.5 text-center text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px] ${completed ? 'pointer-events-none' : ''}`}
        />

        <select
          value={rpe}
          onChange={e => onChange({ ...set, rpe: e.target.value })}
          disabled={completed}
          className={`w-16 bg-bg-tertiary rounded-lg px-1 py-2.5 text-center text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px] ${completed ? 'pointer-events-none' : ''}`}
        >
          <option value="">RPE</option>
          {RPE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>

        {!hideComplete ? (
          <button
            onClick={handleComplete}
            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              completed ? 'bg-success text-white' : 'bg-bg-tertiary text-text-muted hover:bg-accent/20 hover:text-accent'
            }`}
          >
            {completed ? <Pencil size={16} /> : <Check size={16} />}
          </button>
        ) : (
          <div className="w-11 flex-shrink-0" />
        )}
      </div>
    </div>
  )
}
