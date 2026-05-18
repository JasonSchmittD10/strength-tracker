import { useState } from 'react'
import { formatDate, formatDuration, formatVolume, totalVolume } from '@/lib/utils'
import { useUnitPreference } from '@/hooks/useProfile'
import { useDeleteSession } from '@/hooks/useSessions'
import { formatWeight, convertWeight } from '@/lib/units'
import {
  formatDuration as formatDurationHMS,
  formatPace,
  modalityLabel,
} from '@/lib/conditioning'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import PrimaryButton from '@/components/shared/PrimaryButton'
import DestructiveButton from '@/components/shared/DestructiveButton'

const TAG_CLASSES = {
  push: 'border-push/40 text-push',
  pull: 'border-pull/40 text-pull',
  legs: 'border-legs/40 text-legs',
  conditioning: 'border-accent/40 text-accent',
}

function CategoryPill({ tag, label }) {
  const cls = TAG_CLASSES[tag] || 'border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)]'
  return (
    <span
      className={`border ${cls} rounded-[4px] pt-[4px] pb-[2px] px-[6px] font-commons text-[12px] tracking-[-0.2px] leading-[14px] uppercase`}
    >
      {label}
    </span>
  )
}

function StatTile({ label, value }) {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] pt-[16px] pb-[12px] px-[16px] flex flex-col gap-[4px]">
      <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] uppercase whitespace-nowrap overflow-hidden text-ellipsis">
        {label}
      </p>
      <p className="font-judge font-bold text-[28px] text-white leading-none">
        {value}
      </p>
    </div>
  )
}

export default function SessionCard({ session }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { mutateAsync: deleteSession, isPending: deleting } = useDeleteSession()
  const unit = useUnitPreference()

  const isConditioning = session.session_type === 'conditioning'
  const cs = session.conditioning_summary ?? null

  async function handleDelete() {
    await deleteSession(session._id)
    setDetailOpen(false)
    setConfirmDelete(false)
  }

  const vol = totalVolume(session.exercises || [])
  const volDisplay = formatVolume(convertWeight(vol, 'lbs', unit))
  const completedSets = (session.exercises || []).reduce(
    (n, ex) => n + (ex.sets || []).filter(s => s.completed !== false).length,
    0,
  )

  const conditioningPillLabel = modalityLabel(cs?.modality ?? session.modality) || 'Conditioning'

  return (
    <>
      <button
        onClick={() => setDetailOpen(true)}
        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px] text-left active:opacity-80 transition-opacity"
      >
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex flex-col gap-[8px] min-w-0 flex-1">
            {(isConditioning || session.tag) && (
              <div className="flex flex-wrap gap-[8px]">
                {isConditioning ? (
                  <CategoryPill tag="conditioning" label={conditioningPillLabel} />
                ) : (
                  <CategoryPill tag={session.tag} label={session.tagLabel || session.tag} />
                )}
              </div>
            )}
            <p className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19] truncate">
              {session.sessionName}
            </p>
            <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
              {formatDate(session.date)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-[2px] flex-shrink-0">
            {isConditioning ? (
              <>
                {session.duration != null && (
                  <p className="font-judge font-bold text-[22px] text-white leading-none">
                    {formatDurationHMS(session.duration)}
                  </p>
                )}
                {cs?.distance_value != null && (
                  <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                    {cs.distance_value} {cs.distance_unit}
                  </p>
                )}
                {cs?.avg_pace_seconds_per_unit && cs?.distance_unit && (
                  <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                    {formatPace(cs.avg_pace_seconds_per_unit, cs.distance_unit)}
                  </p>
                )}
                {cs?.rounds_completed != null && (
                  <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                    {cs.rounds_completed} rounds
                  </p>
                )}
                {cs?.rpe != null && (
                  <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                    RPE {cs.rpe}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-judge font-bold text-[22px] text-white leading-none whitespace-nowrap">
                  {volDisplay} <span className="text-[14px] text-[#8b8b8b]">{unit}</span>
                </p>
                {session.duration != null && (
                  <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                    {formatDuration(session.duration)}
                  </p>
                )}
                <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                  {completedSets} sets
                </p>
              </>
            )}
          </div>
        </div>
      </button>

      <SlideUpSheet
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setConfirmDelete(false) }}
        title={session.sessionName}
        footer={confirmDelete ? (
          <div className="flex flex-col gap-[12px]">
            <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] text-center">
              Delete this workout? This can't be undone.
            </p>
            <div className="flex gap-[12px]">
              <PrimaryButton variant="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancel
              </PrimaryButton>
              <DestructiveButton onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </DestructiveButton>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full font-commons font-bold text-[18px] text-[#c02727] tracking-[-0.36px] text-center py-[8px]"
          >
            Delete Workout
          </button>
        )}
      >
        {isConditioning ? (
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-wrap items-center gap-[12px]">
              <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                {formatDate(session.date)}
              </span>
              {session.duration != null && (
                <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                  {formatDurationHMS(session.duration)}
                </span>
              )}
              {cs?.modality && (
                <CategoryPill tag="conditioning" label={modalityLabel(cs.modality)} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-[12px]">
              {cs?.distance_value != null && (
                <StatTile label="DISTANCE" value={`${cs.distance_value} ${cs.distance_unit}`} />
              )}
              {cs?.avg_pace_seconds_per_unit && cs?.distance_unit && (
                <StatTile label="AVG PACE" value={formatPace(cs.avg_pace_seconds_per_unit, cs.distance_unit)} />
              )}
              {cs?.rounds_completed != null && (
                <StatTile label="ROUNDS" value={cs.rounds_completed} />
              )}
              {cs?.rpe != null && (
                <StatTile label="RPE" value={cs.rpe} />
              )}
            </div>
            {session.notes && (
              <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] whitespace-pre-line">
                {session.notes}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-[24px]">
            <div className="flex flex-wrap items-center gap-[12px]">
              <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                {formatDate(session.date)}
              </span>
              {session.duration != null && (
                <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                  {formatDuration(session.duration)}
                </span>
              )}
              <span className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]">
                {volDisplay} {unit}
              </span>
            </div>
            <div className="flex flex-col gap-[16px]">
              {(session.exercises || []).map((ex, i) => {
                const exVol = totalVolume([ex])
                const exVolDisplay = formatVolume(convertWeight(exVol, 'lbs', unit))
                return (
                  <div
                    key={i}
                    className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px] flex flex-col gap-[8px]"
                  >
                    <div className="flex items-baseline justify-between gap-[8px]">
                      <p className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19]">
                        {ex.name}
                      </p>
                      <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] whitespace-nowrap">
                        {exVolDisplay} {unit}
                      </p>
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      {(ex.sets || []).map((s, j) => (
                        <p
                          key={j}
                          className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]"
                        >
                          <span className="text-[rgba(255,255,255,0.4)]">{j + 1}.</span>{' '}
                          {formatWeight(s.weight, unit)} × {s.reps} reps{s.rpe ? ` @ ${s.rpe} RPE` : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </SlideUpSheet>
    </>
  )
}
