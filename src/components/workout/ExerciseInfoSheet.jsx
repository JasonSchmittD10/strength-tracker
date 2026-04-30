import { useState, useEffect } from 'react'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import { useExerciseByName } from '@/hooks/useExerciseLibrary'

export default function ExerciseInfoSheet({ open, onClose, exerciseName, initialTab = 'info' }) {
  // reserved for future tab expansion (History, Notes, PRs)
  const [activeTab, setActiveTab] = useState(initialTab)
  useEffect(() => { setActiveTab(initialTab) }, [initialTab])
  const { data: info } = useExerciseByName(exerciseName)
  const hasPattern = !!info?.pattern
  const primary = info?.muscles_primary ?? []
  const secondary = info?.muscles_secondary ?? []
  const hasMuscles = primary.length > 0 || secondary.length > 0
  const cues = info?.cues ?? []
  const hasCues = cues.length > 0
  const hasDescription = !!info?.description
  const hasContent = hasPattern || hasMuscles || hasCues || hasDescription

  return (
    <SlideUpSheet open={open} onClose={onClose} title={exerciseName}>
      {!hasContent ? (
        <p className="text-text-muted text-sm">No info available for this exercise.</p>
      ) : (
        <div className="space-y-5">
          {(hasPattern || hasMuscles) && (
            <div className="space-y-3">
              {hasPattern && (
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Movement Pattern</div>
                  <div className="text-sm text-text-primary">{info.pattern}</div>
                </div>
              )}
              {hasMuscles && (
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Muscles</div>
                  {primary.length > 0 && (
                    <div className="text-sm text-text-primary">Primary: {primary.join(', ')}</div>
                  )}
                  {secondary.length > 0 && (
                    <div className="text-sm text-text-secondary">Secondary: {secondary.join(', ')}</div>
                  )}
                </div>
              )}
            </div>
          )}
          {hasCues && (
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Coaching Cues</div>
              <ul className="space-y-2">
                {cues.map((cue) => (
                  <li key={cue} className="text-sm text-text-secondary pl-3 border-l-2 border-accent/40">{cue}</li>
                ))}
              </ul>
            </div>
          )}
          {hasDescription && (
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Notes</div>
              <p className="text-sm text-text-secondary">{info.description}</p>
            </div>
          )}
        </div>
      )}
    </SlideUpSheet>
  )
}
