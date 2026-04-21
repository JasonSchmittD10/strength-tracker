import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PROGRAMS } from '@/lib/programs'
import { useProgram, useSaveConfig } from '@/hooks/useProgram'
import backArrowIcon from '@/assets/icons/icon-back-arrow.svg'

// ─── Static metadata ──────────────────────────────────────────────────────────
const PROGRAM_META = {
  'phat':    { gear: 'Full gym', avgSession: '60 min' },
  'ppl-x2':  { gear: 'Full gym', avgSession: '60 min' },
  '531':     { gear: 'Barbell',  avgSession: '45 min' },
  'phul':    { gear: 'Full gym', avgSession: '60 min' },
  'gvt-6wk': { gear: 'Full gym', avgSession: '75 min' },
}

function getSessionsPerWeek(program) {
  const isWeekIndexed = program.sessionOrder.some(id => /-w\d+$/.test(id))
  return isWeekIndexed
    ? program.sessionOrder.length / program.blockStructure.weeksPerBlock
    : program.sessionOrder.length
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatItem({ label, value }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
        {label}
      </span>
      <span className="font-commons font-bold text-[14px] text-white tracking-[-0.28px]">
        {value}
      </span>
    </div>
  )
}

function TagBadge({ label }) {
  return (
    <span className="font-commons font-semibold text-[11px] text-[#8b8b8b] tracking-[0.4px] border border-[rgba(255,255,255,0.12)] rounded-[4px] px-[6px] py-[2px] leading-[normal]">
      {label}
    </span>
  )
}

function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[8px] overflow-hidden">
      {/* Session header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-[16px] py-[14px] flex items-center justify-between gap-[12px] text-left"
      >
        <div className="flex flex-col gap-[6px] flex-1 min-w-0">
          <div className="flex items-center gap-[8px] flex-wrap">
            <span className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19]">
              {session.name}
            </span>
            <TagBadge label={session.tagLabel} />
          </div>
          <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[1.3]">
            {session.focus}
          </span>
        </div>
        {/* Chevron */}
        <span className={`font-commons text-[#8b8b8b] text-[18px] flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ›
        </span>
      </button>

      {/* Exercises — shown when expanded */}
      {expanded && (
        <div className="border-t border-[rgba(255,255,255,0.08)]">
          {session.exercises.map((ex, i) => (
            <div
              key={i}
              className={`px-[16px] py-[10px] flex items-center justify-between gap-[12px] ${
                i < session.exercises.length - 1 ? 'border-b border-[rgba(255,255,255,0.05)]' : ''
              }`}
            >
              <span className="font-commons text-[16px] text-white tracking-[-0.2px] leading-[18px] flex-1 min-w-0">
                {ex.name}
              </span>
              <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] flex-shrink-0 whitespace-nowrap">
                {ex.sets} × {ex.reps}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProgramDetailScreen() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const { data: programData } = useProgram()
  const { mutateAsync: saveConfig, isPending } = useSaveConfig()

  const program = PROGRAMS[programId]
  const currentProgramId = programData?.config?.activeProgramId
  const isCurrentProgram = currentProgramId === programId

  if (!program) {
    return (
      <div className="pt-[90px] px-[16px] text-white font-commons">
        Program not found.
      </div>
    )
  }

  const { weeksPerBlock, blockNames } = program.blockStructure
  const totalWeeks = weeksPerBlock * blockNames.length
  const freq = getSessionsPerWeek(program)
  const meta = PROGRAM_META[program.id] ?? { gear: 'Full gym', avgSession: '60 min' }

  async function handleStart() {
    const today = new Date().toISOString().split('T')[0]
    try {
      await saveConfig({
        ...(programData?.config ?? {}),
        activeProgramId: program.id,
        programStartDate: today,
      })
      navigate('/progress')
    } catch (e) {
      console.error('Failed to start program', e)
    }
  }

  return (
    <div>
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]">
        <div className="pt-[66px] px-[16px] pb-[16px] flex items-center justify-between border-b border-[rgba(255,255,255,0.1)]">
          {/* Back + title */}
          <div className="flex items-center gap-[12px]">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-[28px] h-[28px] -ml-[6px]"
              aria-label="Go back"
            >
              <img src={backArrowIcon} alt="" className="w-[5px] h-[11px]" />
            </button>
            <span className="font-judge text-[26px] text-white leading-[1.2]">
              {program.name}
            </span>
          </div>
          {/* invisible spacer to optically balance the header */}
          <div className="w-[28px] opacity-0" />
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="px-[16px] pt-[28px] pb-[32px] flex flex-col gap-[32px]">

        {/* Overview: description + stats */}
        <div className="flex flex-col gap-[16px]">
          <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[1.5]">
            {program.description}
          </p>
          <div className="flex gap-[24px] flex-wrap">
            <StatItem label="DURATION"    value={`${totalWeeks} weeks`} />
            <StatItem label="FREQ"        value={`${freq}/wk`} />
            <StatItem label="GEAR"        value={meta.gear} />
            <StatItem label="AVG SESSION" value={meta.avgSession} />
          </div>
        </div>

        <div className="h-px bg-[rgba(255,255,255,0.1)]" />

        {/* Sessions list */}
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-baseline justify-between">
            <span className="font-commons text-[14px] text-[rgba(255,255,255,0.4)] tracking-[1px]">
              SESSIONS
            </span>
            <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px]">
              {program.sessions.length} total
            </span>
          </div>

          {program.sessions.map((session, i) => (
            <SessionCard key={session.id ?? i} session={session} />
          ))}
        </div>

        <div className="h-px bg-[rgba(255,255,255,0.1)]" />

        {/* Start CTA */}
        <div className="flex flex-col gap-[10px]">
          {isCurrentProgram && (
            <p className="font-commons text-[14px] text-[#8b8b8b] text-center tracking-[-0.2px]">
              You're currently running this program.
            </p>
          )}
          <button
            onClick={handleStart}
            disabled={isPending}
            className={`w-full h-[54px] rounded-[6px] font-commons font-bold text-[18px] tracking-[-0.36px] disabled:opacity-50 ${
              isCurrentProgram
                ? 'bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-white'
                : 'bg-accent text-black'
            }`}
          >
            {isPending
              ? 'Starting…'
              : isCurrentProgram
                ? 'Restart Program'
                : `Start ${program.name}`}
          </button>
        </div>
      </div>
    </div>
  )
}
