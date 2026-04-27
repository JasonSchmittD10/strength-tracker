import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PROGRAMS } from '@/lib/programs'
import { useProgram, useSaveConfig } from '@/hooks/useProgram'
import backArrowIcon from '@/assets/icons/icon-back-arrow.svg'

const PROGRAM_META = {
  'phat':    { gear: 'Full gym', avgSession: '60 min', frequency: '5 x week' },
  'ppl-x2':  { gear: 'Full gym', avgSession: '60 min', frequency: '6 x week' },
  '531':     { gear: 'Barbell',  avgSession: '45 min', frequency: '4 x week' },
  'phul':    { gear: 'Full gym', avgSession: '60 min', frequency: '4 x week' },
  'gvt-6wk': { gear: 'Full gym', avgSession: '75 min', frequency: '3 x week' },
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function Pill({ children }) {
  return (
    <span className="font-commons text-[12px] text-[rgba(255,255,255,0.4)] tracking-[-0.2px] leading-[14px] border border-[rgba(255,255,255,0.1)] rounded-[4px] pt-[4px] pb-[2px] px-[6px] whitespace-nowrap">
      {children}
    </span>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
        {label}
      </span>
      <span className="font-commons font-bold text-[16px] text-white tracking-[-0.32px]">
        {value}
      </span>
    </div>
  )
}

function DayTile({ dayLabel, letter, state, onClick }) {
  if (state === 'rest') {
    return (
      <div className="flex-1 h-[62px] bg-[#161616] border border-[#383838] rounded-[8px] p-[8px] flex flex-col gap-[4px] items-start overflow-hidden">
        <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">{dayLabel}</span>
        <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">REST</span>
      </div>
    )
  }
  const isSelected = state === 'selected'
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-[62px] bg-[rgba(242,166,85,0.1)] rounded-[8px] p-[8px] flex flex-col gap-[4px] items-start overflow-hidden border ${
        isSelected ? 'border-[#f2a655]' : 'border-[#362819]'
      }`}
    >
      <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">{dayLabel}</span>
      <span className={`font-judge font-bold text-[32px] leading-[40px] ${isSelected ? 'text-white' : 'text-[#908d89]'}`}>
        {letter}
      </span>
    </button>
  )
}

function SessionCard({ session }) {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px] flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[8px]">
        <div className="flex gap-[8px] items-center flex-wrap">
          <span className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19]">
            {session.name}
          </span>
          <Pill>{session.tagLabel}</Pill>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
            {session.focus}
          </span>
          <span className="font-commons text-[16px] text-[#f2a655] tracking-[-0.2px] leading-[18px] whitespace-nowrap">
            {session.exercises.length} exercises
          </span>
        </div>
      </div>
      <div className="h-px bg-[rgba(255,255,255,0.1)]" />
      <div className="flex flex-col gap-[12px]">
        {session.exercises.map((ex, i) => (
          <div key={i} className="flex items-center justify-between gap-[8px]">
            <div className="flex items-center gap-[6px] min-w-0">
              <span className="w-[4px] h-[4px] rounded-full bg-[#8b8b8b] flex-shrink-0" />
              <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] truncate">
                {ex.name}
              </span>
            </div>
            <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] whitespace-nowrap flex-shrink-0">
              {ex.sets} x {ex.reps}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProgramDetailScreen() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const { data: programData } = useProgram()
  const { mutateAsync: saveConfig, isPending } = useSaveConfig()

  const program = PROGRAMS[programId]
  const isCurrentProgram = programData?.config?.activeProgramId === programId

  const weekSchedule = program?.weekSchedule ?? []
  const firstWorkoutIdx = weekSchedule.findIndex(s => s != null)
  const [selectedDay, setSelectedDay] = useState(firstWorkoutIdx === -1 ? 0 : firstWorkoutIdx)

  // Reset selection when navigating to a different program
  useEffect(() => {
    setSelectedDay(firstWorkoutIdx === -1 ? 0 : firstWorkoutIdx)
  }, [programId, firstWorkoutIdx])

  if (!program) {
    return (
      <div className="pt-[90px] px-[16px] text-white font-commons">
        Program not found.
      </div>
    )
  }

  const meta = PROGRAM_META[program.id] ?? { gear: 'Full gym', avgSession: '60 min', frequency: '4 x week' }
  const totalWeeks = program.blockStructure.weeksPerBlock * program.blockStructure.blockNames.length
  const onCount = weekSchedule.filter(s => s != null).length
  const restCount = weekSchedule.length - onCount
  const selectedSession = program.sessions.find(s => s.id === weekSchedule[selectedDay])

  async function handleStart() {
    const today = new Date().toISOString().split('T')[0]
    try {
      await saveConfig({
        ...(programData?.config ?? {}),
        activeProgramId: program.id,
        programStartDate: today,
      })
      navigate('/program')
    } catch (e) {
      console.error('Failed to start program', e)
    }
  }

  return (
    <div>
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-[#0a0a0a] to-[#0a0a0a]">
        <div className="pt-[66px] px-[16px] pb-[16px] flex items-center justify-between gap-[12px] border-b border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-[12px] min-w-0 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-[28px] h-[28px] -ml-[6px] flex-shrink-0"
              aria-label="Go back"
            >
              <img src={backArrowIcon} alt="" className="w-[5px] h-[11px]" />
            </button>
            <span className="font-judge font-bold text-[26px] text-white leading-[1.2] truncate">
              {program.name}
            </span>
          </div>
          {program.tags?.length > 0 && (
            <div className="flex items-center gap-[4px] flex-shrink-0">
              {program.tags.map(tag => (
                <Pill key={tag}>{tag}</Pill>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-[16px] pt-[24px] pb-[40px] flex flex-col gap-[24px]">
        {/* Description */}
        <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] whitespace-pre-line">
          {program.description}
          {program.designer ? `\n\nDesigned by ${program.designer}.` : ''}
        </p>

        {/* Stats */}
        <div className="flex gap-[20px] items-start">
          <Stat label="DURATION"    value={`${totalWeeks} weeks`} />
          <Stat label="FREQUENCY"   value={meta.frequency} />
          <Stat label="GEAR"        value={meta.gear} />
          <Stat label="AVG SESSION" value={meta.avgSession} />
        </div>

        <div className="h-px bg-[rgba(255,255,255,0.1)]" />

        {/* Sample week */}
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center justify-between">
            <span className="font-commons text-[16px] text-[#8b8b8b] leading-[normal]">SAMPLE WEEK</span>
            <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
              {onCount} ON · {restCount} REST
            </span>
          </div>
          <div className="flex gap-[4px] items-center w-full">
            {weekSchedule.map((sessionId, idx) => {
              const dayLabel = DAY_LABELS[idx]
              if (sessionId == null) {
                return <DayTile key={idx} dayLabel={dayLabel} state="rest" />
              }
              const session = program.sessions.find(s => s.id === sessionId)
              const letter = session?.tagLabel?.charAt(0) ?? '?'
              return (
                <DayTile
                  key={idx}
                  dayLabel={dayLabel}
                  letter={letter}
                  state={idx === selectedDay ? 'selected' : 'workout'}
                  onClick={() => setSelectedDay(idx)}
                />
              )
            })}
          </div>
          {selectedSession && <SessionCard session={selectedSession} />}
        </div>

        <div className="h-px bg-[rgba(255,255,255,0.1)]" />

        {/* What you'll need */}
        <div className="flex flex-col gap-[12px]">
          <span className="font-commons text-[16px] text-[#8b8b8b] leading-[normal]">WHAT YOU’LL NEED</span>
          {program.equipmentNote && (
            <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
              {program.equipmentNote}
            </p>
          )}
          {program.equipmentNeeded?.length > 0 && (
            <div className="flex gap-[8px] items-start flex-wrap">
              {program.equipmentNeeded.map(eq => (
                <Pill key={eq}>{eq}</Pill>
              ))}
            </div>
          )}
        </div>

        {/* Start CTA */}
        <button
          onClick={handleStart}
          disabled={isPending}
          className={`w-full h-[46px] rounded-[6px] font-commons font-bold text-[18px] tracking-[-0.36px] disabled:opacity-50 ${
            isCurrentProgram
              ? 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white'
              : 'bg-accent text-black'
          }`}
        >
          {isPending
            ? 'Starting…'
            : isCurrentProgram
              ? 'Restart Program'
              : 'Start Program'}
        </button>
      </div>
    </div>
  )
}
