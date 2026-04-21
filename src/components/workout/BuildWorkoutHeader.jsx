import backArrowIcon from '@/assets/icons/icon-back-arrow.svg'
import plusIcon from '@/assets/icons/icon-plus.svg'

export default function BuildWorkoutHeader({ onBack, onAdd }) {
  return (
    <div className="sticky top-0 z-10 bg-bg-primary flex items-center justify-between px-[16px] pb-[16px] border-b border-[rgba(255,255,255,0.1)] flex-shrink-0">
      <div className="flex items-center gap-[12px]">
        <button onClick={onBack} className="p-[4px] -ml-[4px]" aria-label="Go back">
          <img src={backArrowIcon} alt="" className="w-[5px] h-[11px]" />
        </button>
        <h1 className="font-judge text-[26px] leading-[1.2] text-white">Build Workout</h1>
      </div>
      <button onClick={onAdd} className="p-[4px] -mr-[4px]" aria-label="Add exercise">
        <img src={plusIcon} alt="" className="w-[16px] h-[16px]" />
      </button>
    </div>
  )
}
