import workoutIcon from '@/assets/icons/icon-workout.svg'
import pauseIcon from '@/assets/icons/icon-pause.svg'
import playIcon from '@/assets/icons/icon-play.svg'
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext'
import { getWorkoutDisplay, formatElapsed } from '@/lib/workoutDisplay'

export default function MinimizedWorkoutBar() {
  const { params, elapsedSeconds, isPaused, expand, togglePause } = useActiveWorkout()
  const { title, subtitle } = getWorkoutDisplay(params)

  function handlePauseClick(e) {
    e.stopPropagation()
    togglePause()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={expand}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); expand() } }}
      className="fixed bottom-[84px] left-0 right-0 z-30 w-full h-[65px] bg-bg-primary border-t border-[rgba(255,255,255,0.1)] flex items-center justify-between p-[16px] cursor-pointer active:opacity-80"
      aria-label="Resume workout"
    >
      <div className="flex items-center gap-[8px] min-w-0">
        <div className="bg-[rgba(255,255,255,0.1)] rounded-[4px] p-[6px] w-[32px] h-[32px] flex items-center justify-center flex-shrink-0">
          <img src={workoutIcon} alt="" className="w-[20px] h-[20px]" />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="font-judge font-bold text-[16px] text-white leading-[1.2] truncate">
            {title}
          </span>
          {subtitle && (
            <span className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-[12px] flex-shrink-0">
        <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[0.5px] leading-[14px]">
          {formatElapsed(elapsedSeconds)}
        </span>
        <button
          onClick={handlePauseClick}
          className="bg-[rgba(255,255,255,0.1)] rounded-[4px] p-[8px] w-[32px] h-[32px] flex items-center justify-center"
          aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
        >
          <img src={isPaused ? playIcon : pauseIcon} alt="" className="w-[16px] h-[16px]" />
        </button>
      </div>
    </div>
  )
}
