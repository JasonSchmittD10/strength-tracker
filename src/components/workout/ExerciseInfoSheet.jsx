import { useState, useEffect } from 'react'
import { EXERCISE_LIBRARY } from '@/lib/exercises'
import SlideUpSheet from '@/components/shared/SlideUpSheet'

export default function ExerciseInfoSheet({ open, onClose, exerciseName, initialTab = 'info' }) {
  // reserved for future tab expansion (History, Notes, PRs)
  const [activeTab, setActiveTab] = useState(initialTab)
  useEffect(() => { setActiveTab(initialTab) }, [initialTab])
  const info = EXERCISE_LIBRARY[exerciseName] || {}
  const hasPattern = !!info.pattern
  const hasMuscles = !!info.muscles
  const hasCues = info.cues?.length > 0
  const hasNotes = !!info.notes
  const hasContent = hasPattern || hasMuscles || hasCues || hasNotes

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
                  {info.muscles.primary?.length > 0 && (
                    <div className="text-sm text-text-primary">Primary: {info.muscles.primary.join(', ')}</div>
                  )}
                  {info.muscles.secondary?.length > 0 && (
                    <div className="text-sm text-text-secondary">Secondary: {info.muscles.secondary.join(', ')}</div>
                  )}
                </div>
              )}
            </div>
          )}
          {hasCues && (
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Coaching Cues</div>
              <ul className="space-y-2">
                {info.cues.map((cue) => (
                  <li key={cue} className="text-sm text-text-secondary pl-3 border-l-2 border-accent/40">{cue}</li>
                ))}
              </ul>
            </div>
          )}
          {hasNotes && (
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Notes</div>
              <p className="text-sm text-text-secondary">{info.notes}</p>
            </div>
          )}
        </div>
      )}
    </SlideUpSheet>
  )
}
