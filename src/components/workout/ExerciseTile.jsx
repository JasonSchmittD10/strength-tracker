import plusSmIcon from '@/assets/icons/icon-plus-sm.svg'

export default function ExerciseTile({ exercise, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(exercise.name)}
      className={`w-full flex items-center gap-[8px] p-[16px] rounded-[8px] border border-[rgba(255,255,255,0.1)] text-left transition-colors ${
        isSelected ? 'bg-[rgba(255,255,255,0.9)]' : 'bg-[rgba(255,255,255,0.05)]'
      }`}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
        <span className={`font-commons font-semibold text-[18px] tracking-[-0.5px] leading-[1.19] ${
          isSelected ? 'text-black' : 'text-white'
        }`}>
          {exercise.name}
        </span>
        <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
          {exercise.primaryMuscle}
        </span>
      </div>
      <img
        src={plusSmIcon}
        alt=""
        className={`w-[16px] h-[16px] flex-shrink-0 ${isSelected ? '' : 'brightness-0 invert opacity-60'}`}
      />
    </button>
  )
}
