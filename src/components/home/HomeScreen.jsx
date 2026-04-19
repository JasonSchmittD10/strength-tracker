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

// ---------- Hero variants ----------

function HeroInPlan({ sessionTypeName, exerciseCount, estimatedMins, muscles, onStart }) {
  return (
    <div className="flex flex-col items-start">
      <p className="text-base text-text-muted">Today we</p>
      <h1 className="font-judge text-[72px] leading-[0.95] text-white">{sessionTypeName}</h1>
      <p className="text-base text-text-muted mb-4">
        {exerciseCount} exercises · ~{estimatedMins} min · {muscles}
      </p>
      <button
        onClick={onStart}
        className="w-full py-3 bg-accent hover:bg-accent-hover text-black font-bold text-lg rounded-[6px] transition-colors"
      >
        Start Workout
      </button>
    </div>
  )
}

function HeroRest({ daysThisWeek, nextSessionName, onLogRecovery, onMobility }) {
  const tomorrowText = nextSessionName ? ` Tomorrow: ${nextSessionName}.` : ''
  return (
    <div className="flex flex-col items-start">
      <p className="text-base text-text-muted">Today we</p>
      <h1 className="font-judge text-[72px] leading-[0.95] text-white">Rest.</h1>
      <p className="text-base text-text-muted mb-4">
        You've trained {daysThisWeek} day{daysThisWeek !== 1 ? 's' : ''} this week. Muscles grow when you let them.{tomorrowText}
      </p>
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={onLogRecovery}
          className="w-full py-3 bg-bg-stat text-white font-bold text-lg rounded-[6px] hover:bg-bg-badge transition-colors"
        >
          Log Recovery
        </button>
        <button
          onClick={onMobility}
          className="w-full py-3 bg-bg-stat text-white font-bold text-lg rounded-[6px] hover:bg-bg-badge transition-colors"
        >
          Mobility
        </button>
      </div>
    </div>
  )
}

function HeroNoPlan({ onStartCustom, onStartPlan }) {
  return (
    <div className="flex flex-col items-start">
      <p className="text-base text-text-muted">Today we</p>
      <h1 className="font-judge text-[72px] leading-[0.95] text-white">Lift.</h1>
      <p className="text-base text-text-muted mb-4">What are you going to go for today?</p>
      <div className="flex flex-col gap-4 w-full">
        <button
          onClick={onStartCustom}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-black font-bold text-lg rounded-[6px] transition-colors"
        >
          Start Custom Workout
        </button>
        <button
          onClick={onStartPlan}
          className="w-full py-3 bg-bg-stat text-white font-bold text-lg rounded-[6px] hover:bg-bg-badge transition-colors"
        >
          Start New Plan
        </button>
      </div>
    </div>
  )
}

// ---------- Main screen ----------

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

  // "In Plan": program + nextSession exist
  // "Rest": program exists but no nextSession (all sessions done this week)
  // "No Plan": no program
  const heroVariant = isLoading ? null : !program ? 'no-plan' : nextSession ? 'in-plan' : 'rest'

  const sessionTypeName = nextSession?.name
    ? nextSession.name.split(' ')[0] + '.'
    : null

  const muscles = nextSession?.focus?.includes('·')
    ? nextSession.focus.split('·').slice(1).join('·').trim()
    : nextSession?.focus || ''

  const estimatedMins = nextSession ? Math.round(nextSession.exercises.length * 8) : 0

  const totalWeekVol = weekBars.reduce((s, v) => s + v, 0)
  const maxBar = Math.max(...weekBars, 1)

  // For rest variant: find next upcoming session name from program order
  const nextAfterRest = useMemo(() => {
    if (!program || nextSession) return null
    const completedThisWeek = new Set(thisWeekSessions.map(s => s.sessionId))
    return program.sessions.find(s => !completedThisWeek.has(s.id))?.name ?? null
  }, [program, nextSession, thisWeekSessions])

  return (
    <div className="safe-top bg-bg-deep min-h-full pb-6">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="text-sm text-text-muted">{dateLabel}</span>
        {blockInfo && (
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-2.5 py-1.5">
            <span className="text-xs text-text-muted">{program.name}</span>
            <div className="w-0.5 h-0.5 rounded-full bg-accent flex-shrink-0" />
            <span className="text-xs text-white">Wk {blockInfo.weekInBlock}</span>
            <div className="flex items-end gap-1.5 h-1">
              {Array.from({ length: weeksPerBlock }).map((_, i) => (
                <div
                  key={i}
                  className="w-px h-full flex-shrink-0"
                  style={{ backgroundColor: i < blockInfo.weekInBlock ? '#f2a655' : '#3f3f3f' }}
                />
              ))}
            </div>
            <span className="text-xs text-text-muted">{blockInfo.weekInBlock}/{weeksPerBlock}</span>
          </div>
        )}
      </div>

      {/* Horizontal rule */}
      <div className="h-px bg-[#3e3e3e] w-full" />

      {/* Hero */}
      <div className="px-4 pt-5 pb-4">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-bg-card" />
        ) : heroVariant === 'in-plan' ? (
          <HeroInPlan
            sessionTypeName={sessionTypeName}
            exerciseCount={nextSession.exercises.length}
            estimatedMins={estimatedMins}
            muscles={muscles}
            onStart={() => navigate('/workout', { state: { session: nextSession, programId: program?.id } })}
          />
        ) : heroVariant === 'rest' ? (
          <HeroRest
            daysThisWeek={thisWeekSessions.length}
            nextSessionName={nextAfterRest}
            onLogRecovery={() => navigate('/workout', { state: { mode: 'custom', preset: 'recovery' } })}
            onMobility={() => navigate('/workout', { state: { mode: 'custom', preset: 'mobility' } })}
          />
        ) : (
          <HeroNoPlan
            onStartCustom={() => navigate('/workout', { state: { mode: 'custom' } })}
            onStartPlan={() => navigate('/program-selector')}
          />
        )}
      </div>

      {/* Horizontal rule — only after in-plan hero (which has its own Start Workout CTA) */}
      {heroVariant === 'in-plan' && <div className="h-px bg-[#3e3e3e] w-full" />}

      {/* Stats + Volume block — 36px from rule, 32px gap between rows */}
      <div className="px-4 pt-9 flex flex-col gap-8">

        {/* STREAK | PRS THIS MONTH */}
        <div className="flex items-start justify-between w-[302px]">
          <div className="flex flex-col gap-[5px]">
            <span className="text-sm text-text-muted leading-[14px]">STREAK</span>
            <div className="flex items-center gap-1">
              <span className="font-judge text-[36px] leading-none text-white">{streak}</span>
              <span className="text-sm text-text-muted leading-[14px]">WKS</span>
            </div>
          </div>
          <div className="flex flex-col gap-[5px]">
            <span className="text-sm text-text-muted leading-[14px]">PRS THIS MONTH</span>
            <span className="font-judge text-[36px] leading-none text-white">{prsThisMonth}</span>
          </div>
        </div>

        {/* VOLUME THIS WEEK + bars */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[5px]">
            <span className="text-sm text-text-muted leading-[14px]">VOLUME THIS WEEK</span>
            <div className="flex items-center gap-[5px]">
              <span className="font-judge text-[36px] leading-none text-white">{formatVolume(totalWeekVol)}</span>
              <span className="text-sm text-text-muted leading-[14px]">LBs</span>
            </div>
          </div>
          <div className="flex items-end gap-1 w-[185px]">
            {weekBars.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: v > 0 ? `${Math.max((v / maxBar) * 23, 4)}px` : '2px',
                  backgroundColor: v > 0 ? '#f2a655' : '#2b2b2c',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Start Custom Workout — outline button, 36px below volume */}
      <div className="px-4 pt-9">
        <button
          onClick={() => navigate('/workout', { state: { mode: 'custom' } })}
          className="w-full py-3 bg-bg-deep border border-accent text-accent font-bold text-lg rounded-[6px] hover:bg-accent/5 transition-colors tracking-[-0.36px]"
        >
          Start Custom Workout
        </button>
      </div>

      {/* This Week — 36px below button */}
      {thisWeekSessions.length > 0 && (
        <div className="pt-9">
          <div className="px-4 pb-[13px]">
            <span className="text-lg font-semibold text-white/60 tracking-[-0.36px]">This Week</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {thisWeekSessions.map(s => (
              <div
                key={s._id}
                className="bg-[#161616] flex items-center justify-between px-[11px] py-[10px]"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-text-muted w-[26px]">
                    {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-base font-semibold text-white/60 tracking-[-0.32px]">{s.sessionName}</span>
                </div>
                <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
