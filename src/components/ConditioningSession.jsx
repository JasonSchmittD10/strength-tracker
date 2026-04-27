import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSaveSession } from '@/hooks/useSessions'
import { useSaveConditioningResult } from '@/hooks/useConditioningResults'
import { useProfile } from '@/hooks/useProfile'
import SteadyStateBlock from '@/components/conditioning/SteadyStateBlock'
import IntervalsBlock from '@/components/conditioning/IntervalsBlock'

// Top-level conditioning workout screen. Routes to /conditioning with the
// session passed via location state, mirroring the WorkoutScreen pattern.
//
// One block at a time (current programs all have one block per session). The
// data layer supports multi-block via conditioning_results.block_index, so
// extending later is a UI change only.
export default function ConditioningSession() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const session = state?.session
  const programId = state?.programId
  const programConfigId = state?.programConfigId ?? null
  const scheduledDate = state?.scheduledDate ?? null
  const wasSwapped = state?.wasSwapped ?? false

  const { mutateAsync: saveSession, isPending: savingSession } = useSaveSession()
  const { mutateAsync: saveResult, isPending: savingResult } = useSaveConditioningResult()
  const { data: profile } = useProfile()
  const distanceUnit = profile?.distanceUnit ?? 'mi'

  const [saveError, setSaveError] = useState(null)
  const startedAt = useState(() => new Date().toISOString())[0]

  if (!session || session.type !== 'conditioning') {
    return (
      <div className="px-4 pt-[90px] pb-8 text-text-primary">
        <button onClick={() => navigate(-1)} className="text-text-muted mb-4">
          <ArrowLeft size={20} />
        </button>
        No conditioning session loaded.
      </div>
    )
  }

  const blocks = session.conditioning ?? []
  // v1: surface the first block. Multi-block support is a UI iteration.
  const block = blocks[0]

  async function handleSaveBlock(result) {
    setSaveError(null)
    try {
      // 1. Save the parent session row first to get its id.
      const today = new Date().toISOString().slice(0, 10)
      const sessionPayload = {
        sessionId: session.id,
        sessionName: session.name,
        tag: session.tag,
        tagLabel: session.tagLabel,
        programId,
        program_session_id: session.id,
        program_config_id: programConfigId,
        scheduled_date: scheduledDate ?? today,
        was_swapped: wasSwapped,
        session_type: 'conditioning',
        modality: result.modality,
        startedAt,
        completedAt: new Date().toISOString(),
        durationSeconds: result.duration_seconds,
        duration: result.duration_seconds,
        date: today,
        // Compact summary for history-card rendering
        conditioning_summary: {
          modality: result.modality,
          duration_seconds: result.duration_seconds,
          distance_value: result.distance_value,
          distance_unit: result.distance_unit,
          avg_pace_seconds_per_unit: result.avg_pace_seconds_per_unit,
          rounds_completed: result.rounds_completed,
          rpe: result.rpe,
        },
      }
      const saved = await saveSession(sessionPayload)
      // 2. Save the per-block conditioning_results row.
      try {
        await saveResult({ ...result, session_id: saved.id })
      } catch (e) {
        // Don't block the save flow if conditioning_results table is missing
        // (pre-migration). The session blob still has conditioning_summary.
        console.warn('conditioning_results write failed', e)
      }
      navigate('/home')
    } catch (e) {
      setSaveError(e.message ?? 'Failed to save')
    }
  }

  const busy = savingSession || savingResult

  return (
    <div className="bg-bg-deep min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-deep">
        <div className="pt-[66px] px-[16px] pb-[16px] flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="text-text-muted p-1"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="font-judge font-bold text-[22px] text-white truncate">
              {session.name}
            </span>
          </div>
          {session.tagLabel && (
            <span className="flex-shrink-0 font-commons text-[12px] text-[rgba(255,255,255,0.4)] tracking-[-0.2px] border border-[rgba(255,255,255,0.1)] rounded-[4px] py-[3px] px-[6px]">
              {session.tagLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-12">
        {!block ? (
          <p className="font-commons text-text-muted">This session has no blocks.</p>
        ) : block.type === 'steady-state' || block.type === 'tempo' ? (
          <SteadyStateBlock
            block={block}
            distanceUnit={distanceUnit}
            onSave={handleSaveBlock}
            busy={busy}
          />
        ) : block.type === 'intervals' ? (
          <IntervalsBlock
            block={block}
            onSave={handleSaveBlock}
            busy={busy}
          />
        ) : (
          // amrap / circuit / event — deferred. Allow free-form logging.
          <FreeFormFallback
            block={block}
            distanceUnit={distanceUnit}
            onSave={handleSaveBlock}
            busy={busy}
          />
        )}

        {saveError && (
          <p className="font-commons text-[14px] text-danger mt-4">{saveError}</p>
        )}
      </div>
    </div>
  )
}

// Minimal log-only fallback for block types we haven't built dedicated UI for
// yet (amrap, circuit, event). User enters duration + RPE + notes manually.
function FreeFormFallback({ block, distanceUnit, onSave, busy }) {
  const [minutes, setMinutes] = useState('')
  const [rpe, setRpe] = useState(null)
  const [notes, setNotes] = useState('')
  const [distance, setDistance] = useState('')

  function handleSave() {
    const dur = minutes === '' ? 0 : Math.round(parseFloat(minutes) * 60)
    const dv = distance === '' ? null : parseFloat(distance)
    onSave({
      block_index: 0,
      modality: block.modality ?? 'open',
      duration_seconds: dur,
      distance_value: dv && !isNaN(dv) ? dv : null,
      distance_unit: dv ? distanceUnit : null,
      avg_pace_seconds_per_unit: null,
      rounds_completed: null,
      rpe,
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="font-commons text-[14px] text-accent">
          Block type "{block.type}" doesn't have a dedicated screen yet — log it free-form.
        </span>
        <p className="font-judge text-[28px] text-white leading-tight">{block.name}</p>
        {block.description && (
          <p className="font-commons text-[14px] text-text-secondary leading-[18px]">{block.description}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-commons text-[14px] text-text-secondary">Duration (minutes)</label>
        <input
          type="number" inputMode="decimal" value={minutes}
          onChange={e => setMinutes(e.target.value)}
          className="bg-bg-tertiary rounded-lg px-3 py-2.5 text-text-primary text-[16px] focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-commons text-[14px] text-text-secondary">Distance ({distanceUnit}, optional)</label>
        <input
          type="number" inputMode="decimal" value={distance}
          onChange={e => setDistance(e.target.value)}
          className="bg-bg-tertiary rounded-lg px-3 py-2.5 text-text-primary text-[16px] focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-commons text-[14px] text-text-secondary">RPE</label>
        <div className="grid grid-cols-10 gap-1">
          {[1,2,3,4,5,6,7,8,9,10].map(v => (
            <button key={v} type="button" onClick={() => setRpe(v)}
              className={`h-10 rounded-md font-commons font-semibold text-[14px] transition-colors ${
                rpe === v ? 'bg-accent text-black' : 'bg-bg-tertiary text-text-secondary'
              }`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-commons text-[14px] text-text-secondary">Notes</label>
        <textarea
          rows={3} value={notes} onChange={e => setNotes(e.target.value)}
          className="bg-bg-tertiary rounded-lg px-3 py-2.5 text-text-primary text-[16px] focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />
      </div>

      <button
        type="button" onClick={handleSave} disabled={busy}
        className="h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
