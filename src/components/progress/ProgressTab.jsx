import { useState } from 'react'
import { useSessions } from '@/hooks/useSessions'
import { normalizeExerciseName } from '@/lib/exercises'
import { epley, formatDate, formatVolume, totalVolume } from '@/lib/utils'
import ExerciseChart from './ExerciseChart'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

const METRICS = [
  { key: 'e1rm', label: 'e1RM' },
  { key: 'volume', label: 'Volume' },
  { key: 'maxWeight', label: 'Max Weight' },
]

export default function ProgressTab() {
  const { data: sessions = [], isLoading } = useSessions()
  const [selectedExercise, setSelectedExercise] = useState('')
  const [metric, setMetric] = useState('e1rm')

  const exerciseNames = [...new Set(
    sessions.flatMap(s => (s.exercises || []).map(e => normalizeExerciseName(e.name)))
  )].sort()

  if (isLoading) return <LoadingSpinner />

  const exerciseData = selectedExercise
    ? sessions
        .filter(s => s.exercises?.some(e => normalizeExerciseName(e.name) === selectedExercise))
        .map(s => ({
          ...s,
          exercises: s.exercises.filter(e => normalizeExerciseName(e.name) === selectedExercise),
        }))
        .slice(0, 20)
        .reverse()
    : []

  const allSets = exerciseData.flatMap(s => s.exercises?.flatMap(e => e.sets || []) || [])
  const bestE1RM = allSets.length ? Math.max(0, ...allSets.map(s => epley(s.weight, s.reps) || 0)) : 0
  const bestSession = exerciseData.find(s => {
    const sets = s.exercises?.[0]?.sets || []
    return sets.some(st => (epley(st.weight, st.reps) || 0) === bestE1RM)
  })

  return (
    <div className="safe-top px-4 pb-4 max-w-lg mx-auto">
      <h1 className="font-bold text-2xl text-text-primary py-4">Progress</h1>

      <select
        value={selectedExercise}
        onChange={e => setSelectedExercise(e.target.value)}
        className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent mb-4"
      >
        <option value="">Select exercise…</option>
        {exerciseNames.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {selectedExercise && (
        <>
          <div className="flex gap-2 mb-4">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  metric === m.key
                    ? 'bg-accent text-white'
                    : 'bg-bg-card border border-bg-tertiary text-text-muted hover:border-accent/30'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {exerciseData.length > 1 ? (
            <div className="bg-bg-card border border-bg-tertiary rounded-2xl p-4 mb-4">
              <ExerciseChart data={exerciseData} metric={metric} />
            </div>
          ) : (
            <div className="bg-bg-card border border-bg-tertiary rounded-2xl p-4 mb-4 text-center text-text-muted text-sm py-8">
              {exerciseData.length === 0 ? 'No data yet.' : 'Log 2+ sessions to see chart.'}
            </div>
          )}

          {bestE1RM > 0 && (
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-4">
              <div className="text-xs text-text-muted mb-1">Personal Best e1RM</div>
              <div className="text-2xl font-bold text-accent">{bestE1RM} kg</div>
              {bestSession && (
                <div className="text-xs text-text-secondary mt-1">{formatDate(bestSession.date)}</div>
              )}
            </div>
          )}

          {exerciseData.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-text-secondary mb-2">Recent Sessions</div>
              {[...exerciseData].reverse().slice(0, 5).map((s, i) => {
                const sets = s.exercises?.[0]?.sets || []
                const topSet = sets.length ? sets.reduce((b, c) => (epley(c.weight, c.reps) || 0) > (epley(b.weight, b.reps) || 0) ? c : b) : {}
                const vol = totalVolume(s.exercises)
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-bg-tertiary last:border-0">
                    <div>
                      <div className="text-sm text-text-primary">{formatDate(s.date, true)}</div>
                      <div className="text-xs text-text-muted">
                        {topSet.weight}kg × {topSet.reps} · {formatVolume(vol)} kg
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-accent">
                      {epley(topSet.weight, topSet.reps) || '—'} kg
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
