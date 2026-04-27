import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Repeat, X } from 'lucide-react'
import { useSessions } from '@/hooks/useSessions'
import { useTodaysSession } from '@/hooks/useTodaysSession'
import { useCreateOverride, useDeleteOverride } from '@/hooks/useScheduleOverrides'
import { useUpdateInputs } from '@/hooks/useProgramConfig'
import { useProfile } from '@/hooks/useProfile'
import { totalVolume, formatVolume } from '@/lib/utils'
import { computePrescribedWeight } from '@/lib/loadPrescription'
import PrimaryButton from '@/components/shared/PrimaryButton'
import DestructiveButton from '@/components/shared/DestructiveButton'
import CustomWorkoutSheet from '@/components/workout/CustomWorkoutSheet'
import HomeHero from '@/components/home/HomeHero'
import SessionPickerSheet from '@/components/SessionPickerSheet'
import BlockEndProgressionModal from '@/components/program/BlockEndProgressionModal'

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

// ---------- Main screen ----------

export default function HomeScreen() {
  const navigate = useNavigate()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [swapSheetOpen, setSwapSheetOpen] = useState(false)
  const [confirmSkipOpen, setConfirmSkipOpen] = useState(false)
  const { data: sessions = [] } = useSessions()
  const { resolution, macroPosition, completedToday, isLoading, config, program, todayOverride } = useTodaysSession()
  const { mutateAsync: createOverride, isPending: creatingOverride } = useCreateOverride()
  const { mutateAsync: deleteOverride, isPending: deletingOverride } = useDeleteOverride()
  const { mutateAsync: updateInputs, isPending: savingInputs } = useUpdateInputs()
  const { data: profile } = useProfile()
  const weightUnit = profile?.weightUnit ?? 'lbs'

  // ─── Block-end progression prompt ──────────────────────────────────────────
  // Trigger: scheduling moved into a new block (current_block_number lags) and
  // we're at week 1 of a meso. Fires for any program whose userInputs declare
  // a `progression` (5/3/1 TM bumps, Conjugate ME variant rotation, etc.).
  const [tmPromptOpen, setTmPromptOpen] = useState(false)
  const programHasProgression = !!program?.userInputs?.some(i => i.progression)
  const shouldPromptBlockEnd = !!(
    programHasProgression
    && macroPosition
    && !macroPosition.completed
    && macroPosition.weekInMeso === 1
    && macroPosition.blockNumber > (config?.current_block_number ?? 1)
  )
  useEffect(() => {
    if (shouldPromptBlockEnd) setTmPromptOpen(true)
  }, [shouldPromptBlockEnd])

  async function handleBlockEndConfirm(updatedInputs) {
    await updateInputs({
      inputs: { ...(config?.inputs ?? {}), ...updatedInputs },
      currentBlockNumber: macroPosition.blockNumber,
    })
    setTmPromptOpen(false)
  }
  async function handleBlockEndSkip() {
    await updateInputs({
      inputs: config?.inputs ?? {},
      currentBlockNumber: macroPosition.blockNumber,
    })
    setTmPromptOpen(false)
  }

  const streak = useMemo(() => computeWeekStreak(sessions), [sessions])
  const prsThisMonth = useMemo(() => computePRsThisMonth(sessions), [sessions])
  const weekBars = useMemo(() => computeWeeklyVolumeBars(sessions), [sessions])
  const thisWeekSessions = useMemo(() => getThisWeekSessions(sessions), [sessions])

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  }).toUpperCase()

  const todaySession = thisWeekSessions.find(s => s.date === todayStr)
  const todaySessionObj = resolution?.type === 'session' ? resolution.session : null

  const programCompleted = resolution?.type === 'completed'

  const heroVariant = isLoading ? null
    : programCompleted
      ? 'program-done'
      : !program
        ? (completedToday ? 'completed' : 'no-plan')
        : todaySessionObj
          ? (completedToday ? 'in-plan-done' : 'in-plan')
          : 'rest'

  const sessionName = todaySessionObj?.name?.split(' ')[0] ?? null
  const completedSessionName = todaySession?.sessionName?.split(' ')[0] ?? null

  const muscles = todaySessionObj?.focus?.includes('·')
    ? todaySessionObj.focus.split('·').slice(1).join('·').trim()
    : todaySessionObj?.focus || ''

  // Estimated session length: 8 min/exercise for resistance, or sum of block
  // durations (or 30 min default) for conditioning.
  const estimatedMins = !todaySessionObj
    ? 0
    : todaySessionObj.type === 'conditioning'
      ? (todaySessionObj.conditioning ?? []).reduce((m, b) => m + (b.duration ?? 0), 0) || 30
      : Math.round((todaySessionObj.exercises?.length ?? 0) * 8)

  // Headline-lift prescription preview (first exercise with a prescription)
  const headlinePrescription = useMemo(() => {
    if (!todaySessionObj || !program || !config?.inputs) return null
    for (const ex of todaySessionObj.exercises) {
      const rx = computePrescribedWeight(ex, config.inputs, macroPosition, weightUnit)
      if (!rx) continue
      const headline = rx.perSet
        ? `${rx.perSet[rx.perSet.length - 1].formattedWeight} × ${rx.perSet.length} sets`
        : `${rx.formattedWeight} × ${ex.sets ?? 1} sets`
      return { name: ex.name, label: headline }
    }
    return null
  }, [todaySessionObj, program, config, macroPosition, weightUnit])

  const totalWeekVol = weekBars.reduce((s, v) => s + v, 0)
  const maxBar = Math.max(...weekBars, 1)

  // ─── Override actions ──────────────────────────────────────────────────────
  const swapInProgress = todayOverride?.override_type === 'swap'
  const skipInProgress = todayOverride?.override_type === 'skip'
  const wasSwappedFromRest = swapInProgress && !todayOverride?.original_session_id

  async function handleSwapPick(newSessionId) {
    if (!config?.id || !newSessionId) return
    await createOverride({
      programConfigId: config.id,
      date: todayStr,
      overrideType: 'swap',
      originalSessionId: todayOverride?.original_session_id ?? (resolution?.session?.id ?? null),
      newSessionId,
    })
  }

  async function handleSkipConfirm() {
    if (!config?.id) return
    await createOverride({
      programConfigId: config.id,
      date: todayStr,
      overrideType: 'skip',
      originalSessionId: resolution?.session?.id ?? null,
    })
    setConfirmSkipOpen(false)
  }

  async function handleCancelOverride() {
    if (!config?.id || !todayOverride) return
    await deleteOverride({ id: todayOverride.id })
  }

  // For rest-day variant copy: name of the next training day's session (within this week)
  const nextAfterRest = useMemo(() => {
    if (!program || todaySessionObj) return null
    const m = program.microcycle
    if (m?.type !== 'calendar') return null
    const pattern = m.weeklyPatterns
      ? (m.weeklyPatterns[(macroPosition?.weekInMeso ?? 1) - 1] ?? m.weeklyPatterns[0])
      : ((config?.custom_pattern && config.custom_pattern.length) ? config.custom_pattern : m.pattern)
    if (!pattern) return null
    // dayIdx of today (using same weekStart as resolution; default Mon=0)
    const todayDayIdx = (today.getDay() - 1 + 7) % 7
    for (let off = 1; off < 7; off++) {
      const id = pattern[(todayDayIdx + off) % 7]
      if (id && id !== 'rest') {
        return program.sessions.find(s => s.id === id)?.name ?? null
      }
    }
    return null
  }, [program, todaySessionObj, macroPosition, today, config])

  return (
    <div className="safe-top bg-bg-deep min-h-full pb-6">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-sm text-text-muted">{dateLabel}</span>
        {macroPosition && program && !programCompleted && (
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-2.5 py-1.5">
            <span className="text-xs text-text-muted">{program.name}</span>
            <div className="w-0.5 h-0.5 rounded-full bg-accent flex-shrink-0" />
            <span className="text-xs text-white">Wk {macroPosition.weekInBlock}</span>
            <div className="flex items-end gap-1.5 h-1">
              {Array.from({ length: macroPosition.weeksInBlock }).map((_, i) => (
                <div
                  key={i}
                  className="w-px h-full flex-shrink-0"
                  style={{ backgroundColor: i < macroPosition.weekInBlock ? '#f2a655' : '#3f3f3f' }}
                />
              ))}
            </div>
            <span className="text-xs text-text-muted">{macroPosition.weekInBlock}/{macroPosition.weeksInBlock}</span>
          </div>
        )}
      </div>

      {/* Hero — 36px below header */}
      <div className="px-4 mt-9">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-bg-card" />
        ) : programCompleted ? (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col w-full">
              <span className="font-commons text-[16px] text-text-muted leading-normal">Today we</span>
              <p className="font-judge text-[72px] leading-none text-white">Done.</p>
              <span className="font-commons text-[16px] text-text-muted leading-normal">
                Program complete. Time to pick a new one.
              </span>
            </div>
            <PrimaryButton onClick={() => navigate('/program')}>Pick a New Program</PrimaryButton>
          </div>
        ) : (
          <HomeHero
            variant={heroVariant}
            sessionName={heroVariant === 'in-plan-done' ? completedSessionName : sessionName}
            exerciseCount={todaySessionObj?.exercises?.length ?? todaySessionObj?.conditioning?.length ?? 0}
            estimatedMins={estimatedMins}
            muscles={muscles}
            daysThisWeek={thisWeekSessions.length}
            nextSessionName={nextAfterRest}
            onStart={() => {
              const route = todaySessionObj?.type === 'conditioning' ? '/conditioning' : '/workout'
              navigate(route, {
                state: {
                  session: todaySessionObj,
                  programId: program?.id,
                  programConfigId: config?.id,
                  scheduledDate: todayStr,
                  wasSwapped: swapInProgress,
                },
              })
            }}
            onViewRecap={() => navigate('/history')}
            onLogRecovery={() => navigate('/workout', { state: { mode: 'custom', preset: 'recovery' } })}
            onMobility={() => navigate('/workout', { state: { mode: 'custom', preset: 'mobility' } })}
            onStartCustom={() => setPickerOpen(true)}
            onStartNewPlan={() => navigate('/program-selector')}
          />
        )}
        {resolution?.skipped && (
          <p className="font-commons text-[14px] text-text-muted mt-3">Today's session was skipped.</p>
        )}

        {/* Headline-lift prescription preview */}
        {heroVariant === 'in-plan' && headlinePrescription && (
          <p className="font-commons text-[14px] text-accent mt-3 tracking-[-0.2px]">
            {headlinePrescription.name}: {headlinePrescription.label}
          </p>
        )}

        {/* Override actions */}
        {!isLoading && !programCompleted && program && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {heroVariant === 'in-plan' && (
              <>
                <button
                  type="button"
                  onClick={() => setSwapSheetOpen(true)}
                  className="inline-flex items-center gap-1.5 font-commons text-[14px] text-accent hover:underline"
                >
                  <Repeat size={14} />
                  {swapInProgress ? 'Swap again' : 'Swap'}
                </button>
                {!swapInProgress && (
                  <button
                    type="button"
                    onClick={() => setConfirmSkipOpen(true)}
                    className="font-commons text-[14px] text-text-muted hover:text-text-secondary"
                  >
                    Skip today
                  </button>
                )}
                {swapInProgress && (
                  <button
                    type="button"
                    onClick={handleCancelOverride}
                    disabled={deletingOverride}
                    className="inline-flex items-center gap-1 font-commons text-[14px] text-text-muted hover:text-text-secondary disabled:opacity-50"
                  >
                    <X size={14} />
                    {wasSwappedFromRest ? 'Cancel train-anyway' : 'Cancel swap'}
                  </button>
                )}
              </>
            )}
            {skipInProgress && (
              <button
                type="button"
                onClick={handleCancelOverride}
                disabled={deletingOverride}
                className="inline-flex items-center gap-1 font-commons text-[14px] text-accent hover:underline disabled:opacity-50"
              >
                <X size={14} />
                Undo skip
              </button>
            )}
            {heroVariant === 'rest' && !skipInProgress && (
              <button
                type="button"
                onClick={() => setSwapSheetOpen(true)}
                className="inline-flex items-center gap-1.5 font-commons text-[14px] text-accent hover:underline"
              >
                <Repeat size={14} />
                Train anyway
              </button>
            )}
          </div>
        )}
      </div>

      {/* Session picker for swap / train-anyway */}
      {program && (
        <SessionPickerSheet
          open={swapSheetOpen}
          onClose={() => setSwapSheetOpen(false)}
          program={program}
          weekInMeso={macroPosition?.weekInMeso}
          excludeSessionId={resolution?.session?.id}
          title={heroVariant === 'rest' ? 'Train anyway' : 'Swap session'}
          note={heroVariant === 'rest' ? "This won't affect your program timeline." : null}
          onSelect={handleSwapPick}
        />
      )}

      {/* Skip confirmation */}
      {confirmSkipOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-6">
          <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-text-primary text-lg mb-2">
              Skip today's {resolution?.session?.name ?? 'session'}?
            </h3>
            <p className="text-text-secondary text-sm mb-5">
              You can't undo this without manually editing the schedule.
            </p>
            <div className="flex gap-3">
              <PrimaryButton variant="secondary" onClick={() => setConfirmSkipOpen(false)} disabled={creatingOverride}>
                Cancel
              </PrimaryButton>
              <DestructiveButton onClick={handleSkipConfirm} disabled={creatingOverride}>
                {creatingOverride ? 'Skipping…' : 'Skip'}
              </DestructiveButton>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal rule — only after in-plan hero, 36px below hero */}
      {heroVariant === 'in-plan' && <div className="h-px bg-[#3e3e3e] mt-9" />}

      {/* Stats + Volume block — 36px from rule (or hero), 32px gap between rows */}
      <div className="px-4 mt-9 flex flex-col gap-8">

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

      {/* Custom Workout — 36px below volume */}
      <div className="px-4 mt-9">
        <PrimaryButton onClick={() => setPickerOpen(true)}>
          Custom Workout
        </PrimaryButton>
      </div>

      {/* This Week — 36px below button */}
      {thisWeekSessions.length > 0 && (
        <div className="mt-9">
          <div className="px-4 pb-[13px]">
            <span className="text-lg font-semibold text-white/60 tracking-[-0.36px]">This Week</span>
          </div>
          <div className="flex flex-col gap-0.5 px-4">
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

      <CustomWorkoutSheet open={pickerOpen} onClose={() => setPickerOpen(false)} />

      {/* 5/3/1 block-end TM update prompt */}
      <BlockEndProgressionModal
        open={tmPromptOpen}
        program={program}
        currentInputs={config?.inputs ?? {}}
        weightUnit={weightUnit}
        blockNumber={macroPosition?.blockNumber}
        busy={savingInputs}
        onConfirm={handleBlockEndConfirm}
        onSkip={handleBlockEndSkip}
      />
    </div>
  )
}
