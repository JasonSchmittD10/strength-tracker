import { useNavigate } from 'react-router-dom'
import { useProgram } from '@/hooks/useProgram'
import { PROGRAMS } from '@/lib/programs'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import clockIcon from '@/assets/icons/icon-clock.svg'
import ProgressIndicator from './ProgressIndicator'
import JourneyBlocks from './JourneyBlocks'
import ProgramTile from './ProgramTile'

// ─── Next Up session tile ─────────────────────────────────────────────────────
function NextUpTile({ session, programId, onStart }) {
  const exerciseCount = session.exercises?.length ?? 0
  const estimatedMins = Math.round(exerciseCount * 8)

  return (
    <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px] flex items-center justify-between gap-[12px]">
      <div className="flex flex-col gap-[8px] flex-1 min-w-0">
        <p className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19] truncate">
          {session.name}
        </p>
        <div className="flex gap-[24px] items-center">
          <div className="flex items-center gap-[4px]">
            <img src={clockIcon} alt="" className="w-[12px] h-[12px] flex-shrink-0 brightness-0 invert opacity-60" />
            <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] whitespace-nowrap">
              {estimatedMins} min
            </span>
          </div>
          <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] whitespace-nowrap">
            {exerciseCount} exercises
          </span>
        </div>
      </div>
      <button
        onClick={onStart}
        className="flex-shrink-0 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons font-bold text-[18px] text-white tracking-[-0.36px]"
      >
        Start
      </button>
    </div>
  )
}

// ─── On-program state ─────────────────────────────────────────────────────────
function OnProgram({ program, blockInfo, nextSession, config }) {
  const navigate = useNavigate()

  function handleStart() {
    navigate('/workout', { state: { session: nextSession, programId: program.id } })
  }

  return (
    <div className="px-[16px] pt-[90px] pb-[40px] flex flex-col gap-[36px]">
      {/* Header: program label + name + progress indicator */}
      <div className="flex flex-col gap-[23px]">
        <div className="flex flex-col gap-[4px]">
          <span className="font-commons text-[14px] text-[#8b8b8b] leading-[14px]">PROGRAM</span>
          <p className="font-judge text-[48px] text-white leading-[60px]">{program.name}</p>
        </div>
        {blockInfo && (
          <ProgressIndicator
            blockNumber={blockInfo.blockNumber}
            phaseName={blockInfo.phaseName}
            weeksPerBlock={blockInfo.weeksPerBlock}
            weekInBlock={blockInfo.weekInBlock}
          />
        )}
      </div>

      {/* Next Up */}
      {nextSession && (
        <div className="flex flex-col gap-[8px]">
          <span className="font-commons text-[16px] text-[#8b8b8b] leading-[normal]">Next Up</span>
          <NextUpTile
            session={nextSession}
            programId={program.id}
            onStart={handleStart}
          />
        </div>
      )}

      {/* Journey — all blocks */}
      <JourneyBlocks
        program={program}
        blockInfo={blockInfo ?? { blockNumber: 1, weekInBlock: 1, weeksPerBlock: program.blockStructure.weeksPerBlock }}
      />

      {/* Switch Program */}
      <button
        onClick={() => navigate('/program-selector')}
        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons font-bold text-[18px] text-white tracking-[-0.36px]"
      >
        Switch Program
      </button>
    </div>
  )
}

// ─── No-program state ─────────────────────────────────────────────────────────
function NoProgram() {
  const navigate = useNavigate()
  const programs = Object.values(PROGRAMS)

  return (
    <div className="px-[16px] pt-[90px] pb-[40px] flex flex-col gap-[36px]">
      {/* Header */}
      <div className="flex flex-col gap-[4px]">
        <span className="font-commons text-[14px] text-[#8b8b8b] leading-[14px]">PROGRAM</span>
        <p className="font-judge text-[48px] text-white leading-[60px]">Pick your next block.</p>
        <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
          Structure beats motivation. Run a program and see what happens.
        </p>
      </div>

      {/* Program list */}
      <div className="flex flex-col gap-[12px]">
        <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
          All Programs — {programs.length}
        </span>
        {programs.map(program => (
          <button
            key={program.id}
            onClick={() => navigate(`/program-detail/${program.id}`)}
            className="w-full text-left"
          >
            <ProgramTile program={program} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function ProgressTab() {
  const { data: programData, isLoading } = useProgram()

  if (isLoading) return <LoadingSpinner />

  const { program, blockInfo, nextSession, config } = programData || {}

  if (!program) {
    return <NoProgram />
  }

  return (
    <OnProgram
      program={program}
      blockInfo={blockInfo}
      nextSession={nextSession}
      config={config}
    />
  )
}
