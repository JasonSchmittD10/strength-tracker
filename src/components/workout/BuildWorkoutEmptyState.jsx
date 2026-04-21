import emptyWorkoutIcon from '@/assets/icons/icon-empty-workout.svg'
import plusSmIcon from '@/assets/icons/icon-plus-sm.svg'
import PrimaryButton from '@/components/shared/PrimaryButton'

export default function BuildWorkoutEmptyState({ onAdd }) {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] px-[16px] py-[36px] w-full flex flex-col items-center gap-[24px]">
      <div className="flex flex-col items-center gap-[16px] w-full">
        <img src={emptyWorkoutIcon} alt="" className="w-[64px] h-[64px]" />
        <div className="flex flex-col items-center gap-[8px] w-full">
          <p className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19] text-center">
            No exercises yet.
          </p>
          <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] text-center">
            Add a single exercise or create a superset.
          </p>
        </div>
      </div>
      <PrimaryButton onClick={onAdd}>
        <img src={plusSmIcon} alt="" className="w-[14px] h-[14px] mr-[8px]" />
        Add Exercise
      </PrimaryButton>
    </div>
  )
}
