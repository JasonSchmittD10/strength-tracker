// Horizontal week progress bars for the current block
export default function ProgressIndicator({ blockNumber, phaseName, weeksPerBlock, weekInBlock }) {
  return (
    <div className="flex flex-col gap-[5px] w-full">
      {/* Label row: "Block N · PhaseName" */}
      <div className="flex items-center gap-[4px]">
        <span className="font-commons text-[14px] text-white leading-[14px]">
          Block {blockNumber}
        </span>
        <div className="w-[2px] h-[2px] rounded-full bg-[#8b8b8b] flex-shrink-0" />
        <span className="font-commons text-[14px] text-accent leading-[14px]">
          {phaseName}
        </span>
      </div>

      {/* Week bars */}
      <div className="flex gap-[3px] w-full">
        {Array.from({ length: weeksPerBlock }, (_, i) => {
          const weekNum = i + 1
          const isDone = weekNum < weekInBlock
          const isActive = weekNum === weekInBlock
          const isDeload = weekNum === weeksPerBlock

          return (
            <div key={i} className="flex-1 flex flex-col gap-[5px] items-center relative min-w-0">
              {/* Bar */}
              <div className={`h-[8px] w-full rounded-[2px] relative ${
                isDone ? 'bg-[#f2a655]' : isActive ? 'bg-[rgba(242,166,85,0.5)]' : 'bg-[#2b2b2c]'
              }`}>
                {isActive && (
                  <div
                    className="absolute left-0 top-0 h-full bg-[#f2a655] rounded-[2px]"
                    style={{ width: '40%' }}
                  />
                )}
              </div>
              {/* Label */}
              <span className="font-commons text-[14px] text-[#8b8b8b] text-center leading-[14px] w-full">
                {isDeload ? 'DELOAD' : `wk${weekNum}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
