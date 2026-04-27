import SlideUpSheet from '@/components/shared/SlideUpSheet'

// Pick a session from the active program. Used by Home Swap, Home
// "Train anyway", and EditSchedule (with includeRest).
//
// Props:
//   open, onClose      — sheet visibility
//   program            — active program object
//   weekInMeso         — for weeklyPatterns programs, restrict to current week's sessions
//   excludeSessionId   — hide this session id from the list (e.g. today's scheduled session)
//   includeRest        — show "Rest" as the first option (returns null in onSelect)
//   title              — sheet title (default "Pick a session")
//   note               — optional description text under the title
//   onSelect(idOrNull) — called with sessionId, or null when "Rest" is picked
export default function SessionPickerSheet({
  open,
  onClose,
  program,
  weekInMeso,
  excludeSessionId,
  includeRest = false,
  title = 'Pick a session',
  note,
  onSelect,
}) {
  if (!program) return null

  const items = pickSessions(program, weekInMeso).filter(s => s.id !== excludeSessionId)

  function handleSelect(idOrNull) {
    onSelect(idOrNull)
    onClose()
  }

  return (
    <SlideUpSheet open={open} onClose={onClose} title={title}>
      {note && (
        <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] mb-[16px]">
          {note}
        </p>
      )}
      <div className="flex flex-col gap-[8px] pb-[8px]">
        {includeRest && (
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="w-full text-left bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] hover:border-accent/40 rounded-[8px] p-[14px] flex items-center justify-between transition-colors"
          >
            <span className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px]">Rest</span>
            <span className="font-commons text-[12px] text-[#8b8b8b] uppercase tracking-[1px]">Off day</span>
          </button>
        )}
        {items.length === 0 && (
          <p className="font-commons text-[14px] text-[#8b8b8b] py-[12px]">
            No other sessions available in this program.
          </p>
        )}
        {items.map(session => (
          <button
            key={session.id}
            type="button"
            onClick={() => handleSelect(session.id)}
            className="w-full text-left bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:border-accent/40 rounded-[8px] p-[14px] flex flex-col gap-[6px] transition-colors"
          >
            <div className="flex items-center justify-between gap-[8px]">
              <span className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] truncate">
                {session.name}
              </span>
              {session.tagLabel && (
                <span className="flex-shrink-0 font-commons text-[12px] text-[rgba(255,255,255,0.4)] tracking-[-0.2px] border border-[rgba(255,255,255,0.1)] rounded-[4px] py-[3px] px-[6px]">
                  {session.tagLabel}
                </span>
              )}
            </div>
            {session.focus && (
              <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
                {session.focus}
              </span>
            )}
          </button>
        ))}
      </div>
    </SlideUpSheet>
  )
}

// Returns the unique workout sessions referenced by the program's current
// pattern (excluding 'rest'). For weeklyPatterns programs, restrict to the
// supplied weekInMeso so users in week 2 of 5/3/1 don't see week-3 sessions.
function pickSessions(program, weekInMeso) {
  const m = program.microcycle
  let pattern
  if (m.weeklyPatterns) {
    const idx = (weekInMeso ?? 1) - 1
    pattern = m.weeklyPatterns[idx] ?? m.weeklyPatterns[0]
  } else {
    pattern = m.pattern ?? []
  }
  const ids = [...new Set(pattern.filter(id => id && id !== 'rest'))]
  return ids
    .map(id => program.sessions.find(s => s.id === id))
    .filter(Boolean)
}
