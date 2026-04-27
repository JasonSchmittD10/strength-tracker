import JourneyTile from './JourneyTile'
import { getWeeksInMacrocycle, getMesoForWeek, getSessionsPerWeek } from '@/lib/scheduling'

export default function JourneyBlocks({ program, blockInfo }) {
  const weeksPerBlock = getWeeksInMacrocycle(program)
  const blockName = program.macrocycle.name
  const sessionsPerWeek = getSessionsPerWeek(program)
  const isOneShot = program.macrocycle.repeatStrategy === 'one-shot'

  // Use safe fallback if no start date yet
  const currentBlock = blockInfo?.blockNumber ?? 1
  const currentWeek = blockInfo?.weekInBlock ?? 1

  // Show 3 blocks for repeating programs; just 1 for one-shot
  const startBlock = isOneShot ? 1 : Math.max(1, currentBlock - 1)
  const displayBlocks = isOneShot ? [1] : [startBlock, startBlock + 1, startBlock + 2]

  return (
    <div className="flex flex-col gap-[24px] w-full">
      {displayBlocks.map((blockNum, idx) => {
        const isCurrent = blockNum === currentBlock
        const isPast = blockNum < currentBlock

        return (
          <div key={idx} className="flex flex-col gap-[8px]">
            {/* Block header */}
            <div className="flex flex-col">
              <span className="font-commons text-[16px] text-white leading-[18px] tracking-[-0.2px]">
                Block {blockNum}
              </span>
              <div className="flex items-center justify-between">
                <span className="font-judge text-[32px] text-white leading-[40px]">
                  {blockName}
                </span>
                {isCurrent && (
                  <div className="flex items-center gap-[8px]">
                    <div className="w-[8px] h-[8px] rounded-full bg-accent flex-shrink-0" />
                    <span className="font-commons text-[16px] text-accent tracking-[-0.2px] leading-[18px]">
                      Current
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Week tiles */}
            <div className="flex gap-[8px]">
              {Array.from({ length: weeksPerBlock }, (_, weekIdx) => {
                const weekNum = weekIdx + 1
                const lookup = getMesoForWeek(program, weekNum)
                const isDeload = !!lookup?.isDeload
                const weekLabel = isDeload ? 'DELOAD' : (lookup?.weekLabel ?? `Week ${weekNum}`)

                let tileState
                if (isPast) {
                  tileState = 'done'
                } else if (isCurrent) {
                  if (weekNum < currentWeek) tileState = 'done'
                  else if (weekNum === currentWeek) tileState = 'active'
                  else tileState = 'tocome'
                } else {
                  tileState = 'tocome'
                }

                return (
                  <JourneyTile
                    key={weekIdx}
                    state={tileState}
                    weekLabel={weekLabel}
                    sessionCount={sessionsPerWeek}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
