import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useSessions } from '@/hooks/useSessions'
import { useProgram } from '@/hooks/useProgram'
import { totalVolume, formatVolume } from '@/lib/utils'

function getMonday(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - ((day + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d
}

function computeWeekStreak(sessions) {
  if (!sessions.length) return 0
  const monday = getMonday()
  let streak = 0
  for (let w = 0; w < 52; w++) {
    const start = new Date(monday)
    start.setDate(monday.getDate() - w * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    if (sessions.some(s => { const d = new Date(s.date + 'T00:00:00'); return d >= start && d < end })) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function computePRsThisMonth(sessions) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonth = sessions.filter(s => new Date(s.date + 'T00:00:00') >= monthStart)
  const prior = sessions.filter(s => new Date(s.date + 'T00:00:00') < monthStart)

  const best = {}
  prior.forEach(s => (s.exercises || []).forEach(ex => {
    ;(ex.sets || []).forEach(set => {
      const w = parseFloat(set.weight), r = parseFloat(set.reps)
      if (w && r) {
        const e1rm = w * (1 + r / 30)
        if (e1rm > (best[ex.name] ?? 0)) best[ex.name] = e1rm
      }
    })
  }))

  let count = 0
  thisMonth.forEach(s => (s.exercises || []).forEach(ex => {
    let top = 0
    ;(ex.sets || []).filter(set => set.completed).forEach(set => {
      const w = parseFloat(set.weight), r = parseFloat(set.reps)
      if (w && r) { const e1rm = w * (1 + r / 30); if (e1rm > top) top = e1rm }
    })
    if (top > (best[ex.name] ?? 0)) count++
  }))
  return count
}

function computeWeeklyVolumeBars(sessions) {
  const monday = getMonday()
  const days = Array(7).fill(0)
  sessions.forEach(s => {
    const d = new Date(s.date + 'T00:00:00')
    const diff = Math.floor((d - monday) / 86400000)
    if (diff >= 0 && diff < 7) {
      days[diff] += totalVolume(s.exercises)
    }
  })
  return days
}

function getThisWeekSessions(sessions) {
  const monday = getMonday()
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)
  return sessions
    .filter(s => { const d = new Date(s.date + 'T00:00:00'); return d >= monday && d < sunday })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function HomeScreen() {
  const navigate = useNavigate()
  const { data: sessions = [] } = useSessions()
  const { data: programData, isLoading } = useProgram()
  const { program, blockInfo, nextSession } = programData || {}

  const streak = useMemo(() => computeWeekStreak(sessions), [sessions])
  const prsThisMonth = useMemo(() => computePRsThisMonth(sessions), [sessions])
  const weekBars = useMemo(() => computeWeeklyVolumeBars(sessions), [sessions])
  const thisWeekSessions = useMemo(() => getThisWeekSessions(sessions), [sessions])

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  }).toUpperCase()

  const weeksPerBlock = program?.blockStructure?.weeksPerBlock ?? 4
  const sessionTypeName = nextSession?.name
    ? nextSession.name.split(' ')[0] + '.'
    : null

  const muscles = nextSession?.focus?.includes('·')
    ? nextSession.focus.split('·').slice(1).join('·').trim()
    : nextSession?.focus || ''

  const estimatedMins = nextSession ? Math.round(nextSession.exercises.length * 8) : 0

  const totalWeekVol = weekBars.reduce((s, v) => s + v, 0)
  const maxBar = Math.max(...weekBars, 1)

  function startWorkout() {
    if (nextSession) {
      navigate('/workout', { state: { session: nextSession, programId: program?.id } })
    } else {
      navigate('/workout', { state: { mode: 'custom' } })
    }
  }

  return (
    <div className="safe-top bg-bg-deep min-h-full px-4 pb-6">
      {/* Header row */}
      <div className="flex items-center justify-between pt-4 pb-5">
        <span className="text-xs text-text-muted font-medium tracking-widest">{dateLabel}</span>
        {blockInfo && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{program.name} · Wk {blockInfo.weekInBlock}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: weeksPerBlock }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i < blockInfo.weekInBlock ? 'bg-accent' : 'bg-bg-badge'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hero */}
      {isLoading ? (
        <div className="h-36 animate-pulse rounded-2xl bg-bg-card mb-6" />
      ) : (
        <div className="mb-6">
          <p className="text-text-muted text-sm mb-1">Today we</p>
          <h1 className="font-judge text-[72px] leading-[0.9] text-text-primary mb-3">
            {sessionTypeName ?? 'Rest.'}
          </h1>
          {nextSession && (
            <p className="text-text-muted text-sm">
              {nextSession.exercises.length} exercises · ~{estimatedMins} min · {muscles}
            </p>
          )}
        </div>
      )}

      {/* Start Workout */}
      <button
        onClick={startWorkout}
        className="w-full py-4 bg-accent hover:bg-accent-hover text-black font-bold text-base rounded-xl mb-5 transition-colors"
      >
        Start Workout
      </button>

      {/* Stats row */}
      <div className="bg-bg-stat rounded-2xl flex items-stretch mb-4">
        <div className="flex-1 py-4 flex flex-col items-center justify-center">
          <div className="font-judge text-[42px] leading-none text-text-primary">{streak}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">Streak · Wks</div>
        </div>
        <div className="w-px bg-bg-tertiary my-4" />
        <div className="flex-1 py-4 flex flex-col items-center justify-center">
          <div className="font-judge text-[42px] leading-none text-text-primary">{prsThisMonth}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">PRs This Month</div>
        </div>
      </div>

      {/* Volume This Week */}
      <div className="bg-bg-stat rounded-2xl p-4 mb-4">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-[10px] text-text-muted uppercase tracking-widest">Volume This Week</span>
          <div className="flex items-baseline gap-1">
            <span className="font-judge text-2xl text-text-primary">{formatVolume(totalWeekVol)}</span>
            <span className="text-xs text-text-muted uppercase">lbs</span>
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-14">
          {weekBars.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${v > 0 ? Math.max((v / maxBar) * 40, 6) : 0}px`,
                  backgroundColor: v > 0 ? '#f2a655' : undefined,
                }}
              />
              {v === 0 && <div className="w-full h-1 rounded-sm bg-bg-badge" />}
              <span className="text-[9px] text-text-muted">{DAY_LABELS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* This Week sessions */}
      {thisWeekSessions.length > 0 && (
        <div>
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">This Week</div>
          <div className="space-y-2">
            {thisWeekSessions.map(s => (
              <div
                key={s._id}
                className="bg-[#161616] rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-7">
                    {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-sm text-text-primary font-medium">{s.sessionName}</span>
                </div>
                <ChevronRight size={15} className="text-text-muted flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
