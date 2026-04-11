import { Check } from 'lucide-react'

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]

export default function SetRow({ setNumber, set, onChange, onComplete }) {
  const { weight = '', reps = '', rpe = '', completed = false } = set

  function handleComplete() {
    if (!completed) onComplete()
    else onChange({ ...set, completed: false })
  }

  return (
    <div className={`flex items-center gap-2 py-2 ${completed ? 'opacity-60' : ''}`}>
      <span className="w-6 text-center text-xs text-text-muted font-medium">{setNumber}</span>

      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={e => onChange({ ...set, weight: e.target.value })}
        placeholder="kg"
        className="flex-1 min-w-0 bg-bg-tertiary rounded-lg px-2 py-2.5 text-center text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
      />

      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={e => onChange({ ...set, reps: e.target.value })}
        placeholder="reps"
        className="flex-1 min-w-0 bg-bg-tertiary rounded-lg px-2 py-2.5 text-center text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
      />

      <select
        value={rpe}
        onChange={e => onChange({ ...set, rpe: e.target.value })}
        className="w-16 bg-bg-tertiary rounded-lg px-1 py-2.5 text-center text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
      >
        <option value="">RPE</option>
        {RPE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
      </select>

      <button
        onClick={handleComplete}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          completed ? 'bg-success text-white' : 'bg-bg-tertiary text-text-muted hover:bg-accent/20 hover:text-accent'
        }`}
      >
        <Check size={16} />
      </button>
    </div>
  )
}
