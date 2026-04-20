import PrimaryButton from '@/components/shared/PrimaryButton'

// variant: 'in-plan' | 'in-plan-done' | 'rest' | 'no-plan' | 'completed'
export default function HomeHero({
  variant = 'no-plan',
  sessionName,
  exerciseCount,
  estimatedMins,
  muscles,
  daysThisWeek,
  nextSessionName,
  onStart,
  onViewRecap,
  onLogRecovery,
  onMobility,
  onStartCustom,
  onStartNewPlan,
}) {
  const inPlan = variant === 'in-plan' || variant === 'in-plan-done'

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Text block */}
      <div className="flex flex-col w-full">
        <span className="font-commons text-[16px] text-text-muted leading-normal">
          {inPlan ? 'Today' : 'Today we'}
        </span>

        {variant === 'in-plan-done' ? (
          <div className="flex items-baseline gap-4">
            <span className="font-judge text-[72px] leading-none text-white/60">{sessionName}.</span>
            <span className="font-judge text-[72px] leading-none text-white">Done</span>
          </div>
        ) : (
          <p className="font-judge text-[72px] leading-none text-white">
            {variant === 'in-plan'  ? `${sessionName}.`
            : variant === 'rest'    ? 'Rest.'
            : variant === 'no-plan' ? 'Lift.'
            :                         'Lifted'}
          </p>
        )}

        <span className="font-commons text-[16px] text-text-muted leading-normal">
          {variant === 'in-plan'     && `${exerciseCount} exercises · ~${estimatedMins} min · ${muscles}`}
          {variant === 'in-plan-done' && 'Workout = Crushed.'}
          {variant === 'rest'        && `You've trained ${daysThisWeek} day${daysThisWeek !== 1 ? 's' : ''} this week. Muscles grow when you let them.${nextSessionName ? ` Tomorrow: ${nextSessionName}.` : ''}`}
          {variant === 'no-plan'     && "What are you going to go for today?"}
          {variant === 'completed'   && "Great work today, you crushed it."}
        </span>
      </div>

      {/* Buttons */}
      {variant === 'in-plan' && (
        <PrimaryButton onClick={onStart}>Start Workout</PrimaryButton>
      )}

      {(variant === 'in-plan-done' || variant === 'completed') && (
        <PrimaryButton variant="secondary" onClick={onViewRecap}>View Workout Recap</PrimaryButton>
      )}

      {variant === 'rest' && (
        <div className="flex flex-col gap-3 w-full">
          <PrimaryButton variant="secondary" onClick={onLogRecovery}>Log Recovery</PrimaryButton>
          <PrimaryButton variant="secondary" onClick={onMobility}>Mobility</PrimaryButton>
        </div>
      )}

      {variant === 'no-plan' && (
        <div className="flex flex-col gap-4 w-full">
          <PrimaryButton onClick={onStartCustom}>Start Custom Workout</PrimaryButton>
          <PrimaryButton variant="secondary" onClick={onStartNewPlan}>Start New Plan</PrimaryButton>
        </div>
      )}
    </div>
  )
}
