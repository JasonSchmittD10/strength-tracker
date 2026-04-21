import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import TemplatePickerSheet from './TemplatePickerSheet'
import { useWorkoutTemplates } from '@/hooks/useTemplates'
import createScratchIcon from '@/assets/icons/icon-create-scratch.svg'
import savedWorkoutsIcon from '@/assets/icons/icon-saved-workouts.svg'

function WorkoutTile({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-[16px] bg-[#222] border border-[#383838] rounded-[8px] p-[16px] text-left w-full"
    >
      <div className="w-[36px] h-[36px] flex-shrink-0 flex items-center justify-center">
        <img src={icon} alt="" className="w-full h-full" />
      </div>
      <div className="flex flex-col gap-[2px]">
        <span className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19]">
          {title}
        </span>
        <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
          {subtitle}
        </span>
      </div>
    </button>
  )
}

export default function CustomWorkoutSheet({ open, onClose }) {
  const navigate = useNavigate()
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const { data: templates = [] } = useWorkoutTemplates()

  function handleCreateFromScratch() {
    onClose()
    navigate('/build-workout')
  }

  const templateSubtitle = templates.length > 0
    ? `${templates.length} saved template${templates.length !== 1 ? 's' : ''}`
    : 'No saved templates yet'

  return (
    <>
      <SlideUpSheet open={open} onClose={onClose}>
        <div className="flex flex-col gap-[24px] pb-[8px]">
          <div className="flex flex-col gap-[8px]">
            <h2 className="font-judge text-[26px] leading-[1.2] text-white">Custom Workout</h2>
            <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
              How would you like to start?
            </p>
          </div>
          <div className="flex flex-col gap-[12px]">
            <WorkoutTile
              icon={createScratchIcon}
              title="Create from Scratch"
              subtitle="Build your workout lift by lift"
              onClick={handleCreateFromScratch}
            />
            <WorkoutTile
              icon={savedWorkoutsIcon}
              title="My Saved Workouts"
              subtitle={templateSubtitle}
              onClick={() => setTemplatePickerOpen(true)}
            />
          </div>
        </div>
      </SlideUpSheet>
      <TemplatePickerSheet open={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} />
    </>
  )
}
