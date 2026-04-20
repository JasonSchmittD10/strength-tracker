import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Bookmark, ChevronRight } from 'lucide-react'
import TemplatePickerSheet from './TemplatePickerSheet'
import { useWorkoutTemplates } from '@/hooks/useTemplates'

export default function CustomWorkoutSheet({ open, onClose }) {
  const navigate = useNavigate()
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const { data: templates = [] } = useWorkoutTemplates()

  if (!open) return null

  function handleCreateFromScratch() {
    onClose()
    navigate('/build-workout')
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-[#161616] rounded-tl-[16px] rounded-tr-[16px] pt-[10px] px-[20px] pb-[34px]">
          {/* Drag pill */}
          <div className="flex justify-center mb-[16px]">
            <div className="h-[4px] w-[39px] bg-[#969698] rounded-full" />
          </div>
          {/* Title */}
          <div className="mb-[20px]">
            <h2 className="font-judge text-[26px] leading-none text-white">Custom Workout</h2>
            <p className="font-commons text-[14px] text-text-muted mt-[4px]">How would you like to start?</p>
          </div>
          {/* Option cards */}
          <div className="flex flex-col gap-[12px]">
            <button
              onClick={handleCreateFromScratch}
              className="flex items-center gap-[16px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] px-[16px] py-[16px] text-left w-full"
            >
              <div className="w-[40px] h-[40px] rounded-[8px] bg-[rgba(242,166,85,0.15)] flex items-center justify-center flex-shrink-0">
                <Dumbbell size={20} className="text-accent" />
              </div>
              <div className="flex-1">
                <div className="font-commons font-bold text-[16px] text-white leading-snug">Create from Scratch</div>
                <div className="font-commons text-[13px] text-text-muted leading-snug mt-[2px]">Build your workout lift by lift</div>
              </div>
              <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
            </button>
            <button
              onClick={() => setTemplatePickerOpen(true)}
              className="flex items-center gap-[16px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] px-[16px] py-[16px] text-left w-full"
            >
              <div className="w-[40px] h-[40px] rounded-[8px] bg-[rgba(242,166,85,0.15)] flex items-center justify-center flex-shrink-0">
                <Bookmark size={20} className="text-accent" />
              </div>
              <div className="flex-1">
                <div className="font-commons font-bold text-[16px] text-white leading-snug">My Saved Workouts</div>
                <div className="font-commons text-[13px] text-text-muted leading-snug mt-[2px]">
                  {templates.length > 0
                    ? `${templates.length} saved template${templates.length !== 1 ? 's' : ''}`
                    : 'No saved templates yet'}
                </div>
              </div>
              <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
      <TemplatePickerSheet open={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} />
    </>
  )
}
