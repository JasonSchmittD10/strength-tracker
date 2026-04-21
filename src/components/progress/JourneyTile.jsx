import journeyDoneIcon from '@/assets/icons/icon-journey-done.svg'

// state: 'done' | 'active' | 'tocome'
export default function JourneyTile({ state = 'tocome', weekLabel, sessionCount }) {
  const isDone = state === 'done'
  const isActive = state === 'active'
  const isToCome = state === 'tocome'

  return (
    <div className={`flex-1 flex flex-col gap-[4px] p-[8px] rounded-[8px] overflow-hidden border min-w-0 ${
      isToCome
        ? 'bg-[#161616] border-[#2d2d2d]'
        : isActive
          ? 'bg-[rgba(242,166,85,0.1)] border-[#f2a655]'
          : 'bg-[rgba(242,166,85,0.1)] border-[rgba(242,166,85,0.1)]'
    }`}>
      {/* Header row: week label + done checkmark */}
      <div className="flex items-center justify-between">
        <span className={`font-commons text-[14px] leading-[normal] ${
          isToCome ? 'text-[rgba(255,255,255,0.4)]' : isActive ? 'text-accent' : 'text-[#8b8b8b]'
        }`}>
          {weekLabel}
        </span>
        <div className="w-[11px] h-[9px] flex-shrink-0">
          {isDone && (
            <img src={journeyDoneIcon} alt="" className="block w-full h-full" />
          )}
        </div>
      </div>

      {/* Count + label */}
      <div>
        <p className={`font-judge text-[32px] leading-[normal] ${
          isToCome ? 'text-[rgba(255,255,255,0.4)]' : isActive ? 'text-white' : 'text-[rgba(255,255,255,0.5)]'
        }`}>
          {sessionCount}
        </p>
        <span className={`font-commons text-[12px] tracking-[-0.2px] leading-[14px] ${
          isToCome ? 'text-[rgba(255,255,255,0.4)]' : 'text-[#8b8b8b]'
        }`}>
          sessions
        </span>
      </div>
    </div>
  )
}
