// Static metadata that can't be derived from program structure
const PROGRAM_META = {
  'phat':    { gear: 'Full',    avgSession: '60 min' },
  'ppl-x2':  { gear: 'Full',    avgSession: '60 min' },
  '531':     { gear: 'Barbell', avgSession: '45 min' },
  'phul':    { gear: 'Full',    avgSession: '60 min' },
  'gvt-6wk': { gear: 'Full',    avgSession: '75 min' },
}

function getSessionsPerWeek(program) {
  const isWeekIndexed = program.sessionOrder.some(id => /-w\d+$/.test(id))
  return isWeekIndexed
    ? program.sessionOrder.length / program.blockStructure.weeksPerBlock
    : program.sessionOrder.length
}

export default function ProgramTile({ program }) {
  const { weeksPerBlock, blockNames } = program.blockStructure
  const totalWeeks = weeksPerBlock * blockNames.length
  const freq = getSessionsPerWeek(program)
  const meta = PROGRAM_META[program.id] ?? { gear: 'Full', avgSession: '60 min' }

  return (
    <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px] flex flex-col gap-[8px] w-full">
      {/* Name */}
      <p className="font-judge text-[32px] text-white leading-[40px]">{program.name}</p>

      {/* Description */}
      <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
        {program.description}
      </p>

      {/* Divider */}
      <div className="h-px bg-[rgba(255,255,255,0.1)]" />

      {/* Stats row */}
      <div className="flex gap-[24px]">
        <div className="flex flex-col">
          <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">DURATION</span>
          <span className="font-commons font-bold text-[14px] text-white tracking-[-0.28px]">{totalWeeks} weeks</span>
        </div>
        <div className="flex flex-col">
          <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">FREQ</span>
          <span className="font-commons font-bold text-[14px] text-white tracking-[-0.28px]">{freq}/wk</span>
        </div>
        <div className="flex flex-col">
          <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">GEAR</span>
          <span className="font-commons font-bold text-[14px] text-white tracking-[-0.28px]">{meta.gear}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">AVG SESSION</span>
          <span className="font-commons font-bold text-[14px] text-white tracking-[-0.28px]">{meta.avgSession}</span>
        </div>
      </div>
    </div>
  )
}
