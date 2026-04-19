import { useNavigate } from 'react-router-dom'
import { useWorkoutTemplates } from '@/hooks/useTemplates'
import { formatDate } from '@/lib/utils'
import SlideUpSheet from '@/components/shared/SlideUpSheet'

export default function TemplatePickerSheet({ open, onClose }) {
  const navigate = useNavigate()
  const { data: templates = [], isLoading } = useWorkoutTemplates()

  function handlePick(template) {
    onClose()
    navigate('/workout', { state: { mode: 'template', template } })
  }

  function handleStartEmpty() {
    onClose()
    navigate('/workout', { state: { mode: 'custom' } })
  }

  const footer = (
    <button
      onClick={handleStartEmpty}
      className="w-full text-center text-sm text-text-muted py-1"
    >
      Start Empty Workout
    </button>
  )

  return (
    <SlideUpSheet open={open} onClose={onClose} title="My Workouts" footer={footer}>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-bg-tertiary animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <p className="text-text-secondary text-sm">No saved workouts yet.</p>
          <p className="text-text-muted text-xs">Tap "Build Workout" on the home screen to create one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => handlePick(t)}
              className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-left hover:border-accent/40 transition-colors"
            >
              <div className="font-semibold text-text-primary text-sm">{t.name}</div>
              <div className="text-xs text-text-muted mt-0.5">
                {t.exercises?.length ?? 0} exercises · {formatDate(t.created_at, true)}
              </div>
            </button>
          ))}
        </div>
      )}
    </SlideUpSheet>
  )
}
