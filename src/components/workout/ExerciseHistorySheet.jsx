import { useSessionsByExercise } from '@/hooks/useSessions'
import { epley, formatDate } from '@/lib/utils'
import { useUnitPreference } from '@/hooks/useProfile'
import SlideUpSheet from '@/components/shared/SlideUpSheet'

export default function ExerciseHistorySheet({ open, onClose, exerciseName }) {
  const { data: exSessions = [] } = useSessionsByExercise(exerciseName)
  const unit = useUnitPreference()
  const recent = exSessions.slice(0, 3)
  const chartData = exSessions.slice(0, 10).reverse()

  return (
    <SlideUpSheet open={open} onClose={onClose} title={exerciseName} heightClass="h-[70vh]">
      {chartData.length > 1 && <E1RMChart data={chartData} />}

      {recent.length === 0 ? (
        <p className="text-text-muted text-sm">No history yet.</p>
      ) : recent.map((s, i) => {
        const sets = s.exercises?.[0]?.sets || []
        const topSet = sets.reduce((b, c) => (epley(c.weight, c.reps) || 0) > (epley(b.weight, b.reps) || 0) ? c : b, sets[0] || {})
        const e1rm = epley(topSet?.weight, topSet?.reps)
        return (
          <div key={i} className="mb-4">
            <div className="text-xs text-text-muted mb-1">{formatDate(s.date, true)} · {s.sessionName}</div>
            {sets.map((set, j) => (
              <div key={j} className="text-sm text-text-secondary">
                {j + 1}. {set.weight}{unit} × {set.reps} reps{set.rpe ? ` @ ${set.rpe} RPE` : ''}
              </div>
            ))}
            {e1rm && <div className="text-xs text-accent mt-1">e1RM: {e1rm}{unit}</div>}
          </div>
        )
      })}
    </SlideUpSheet>
  )
}

function E1RMChart({ data }) {
  const values = data.map(s => {
    const sets = s.exercises?.[0]?.sets || []
    return Math.max(0, ...sets.map(st => epley(st.weight, st.reps) || 0))
  })
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1
  const W = 280, H = 80, PAD = 10

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full mb-4" style={{ overflow: 'visible' }}>
      <polyline
        points={data.map((_, i) => {
          const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
          const y = H - PAD - ((values[i] - minV) / range) * (H - PAD * 2)
          return `${x},${y}`
        }).join(' ')}
        fill="none"
        stroke="rgba(108,99,255,0.3)"
        strokeWidth="1.5"
      />
      {data.map((_, i) => {
        const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
        const y = H - PAD - ((values[i] - minV) / range) * (H - PAD * 2)
        const isLast = i === data.length - 1
        return (
          <circle key={i} cx={x} cy={y} r={isLast ? 5 : 4}
            fill={isLast ? '#6c63ff' : 'rgba(108,99,255,0.4)'}
          />
        )
      })}
    </svg>
  )
}
