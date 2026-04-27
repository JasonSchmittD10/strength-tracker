import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEndProgram, useUpdateInputs } from '@/hooks/useProgramConfig'
import { useTodaysSession } from '@/hooks/useTodaysSession'
import { useProfile } from '@/hooks/useProfile'
import { formatWeight } from '@/lib/units'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import DestructiveButton from '@/components/shared/DestructiveButton'
import clockIcon from '@/assets/icons/icon-clock.svg'
import ProgressIndicator from '@/components/progress/ProgressIndicator'
import JourneyBlocks from '@/components/progress/JourneyBlocks'
import ProgramBrowser from '@/components/ProgramBrowser'
import ProgramInputsForm from '@/components/ProgramInputsForm'

// ─── Next Up session tile ─────────────────────────────────────────────────────
function NextUpTile({ session, programId, onStart }) {
  const exerciseCount = session.exercises?.length ?? 0
  const estimatedMins = Math.round(exerciseCount * 8)

  return (
    <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px] flex items-center justify-between gap-[12px]">
      <div className="flex flex-col gap-[8px] flex-1 min-w-0">
        <p className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19] truncate">
          {session.name}
        </p>
        <div className="flex gap-[24px] items-center">
          <div className="flex items-center gap-[4px]">
            <img src={clockIcon} alt="" className="w-[12px] h-[12px] flex-shrink-0 brightness-0 invert opacity-60" />
            <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] whitespace-nowrap">
              {estimatedMins} min
            </span>
          </div>
          <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] whitespace-nowrap">
            {exerciseCount} exercises
          </span>
        </div>
      </div>
      <button
        onClick={onStart}
        className="flex-shrink-0 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons font-bold text-[18px] text-white tracking-[-0.36px]"
      >
        Start
      </button>
    </div>
  )
}

// ─── On-program state ─────────────────────────────────────────────────────────
function OnProgram({ program, config, resolution, macroPosition, completedToday }) {
  const navigate = useNavigate()
  const endProgram = useEndProgram()
  const { mutateAsync: updateInputs, isPending: savingInputs } = useUpdateInputs()
  const { data: profile } = useProfile()
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const [editInputsOpen, setEditInputsOpen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const todaySession = resolution?.type === 'session' ? resolution.session : null
  const programDone = resolution?.type === 'completed'
  const weightUnit = profile?.weightUnit ?? 'lbs'
  const hasInputs = !!program.userInputs?.length
  const inputs = config?.inputs ?? {}

  function handleStart() {
    const route = todaySession?.type === 'conditioning' ? '/conditioning' : '/workout'
    navigate(route, {
      state: {
        session: todaySession,
        programId: program.id,
        programConfigId: config?.id,
        scheduledDate: today,
      },
    })
  }

  function handleEndConfirmed() {
    endProgram.mutate(today, { onSuccess: () => setConfirmEndOpen(false) })
  }

  async function handleSaveInputs(nextInputs) {
    try {
      await updateInputs({ inputs: nextInputs })
      setEditInputsOpen(false)
    } catch (e) {
      console.error('Failed to save inputs', e)
    }
  }

  return (
    <div className="px-[16px] pt-[90px] pb-[40px] flex flex-col gap-[36px]">
      {/* Header: program label + name + progress indicator */}
      <div className="flex flex-col gap-[23px]">
        <div className="flex flex-col gap-[4px]">
          <span className="font-commons text-[14px] text-[#8b8b8b] leading-[14px]">PROGRAM</span>
          <p className="font-judge text-[48px] text-white leading-[60px]">{program.name}</p>
        </div>
        {macroPosition && !programDone && (
          <ProgressIndicator
            blockNumber={macroPosition.blockNumber}
            phaseName={macroPosition.weekLabel}
            weeksPerBlock={macroPosition.weeksInBlock}
            weekInBlock={macroPosition.weekInBlock}
          />
        )}
      </div>

      {/* Today's session — or rest / completed state */}
      {todaySession && !completedToday && (
        <div className="flex flex-col gap-[8px]">
          <span className="font-commons text-[16px] text-[#8b8b8b] leading-[normal]">Today</span>
          <NextUpTile session={todaySession} programId={program.id} onStart={handleStart} />
        </div>
      )}
      {todaySession && completedToday && (
        <div className="flex flex-col gap-[8px]">
          <span className="font-commons text-[16px] text-[#8b8b8b] leading-[normal]">Today</span>
          <p className="font-commons text-[18px] text-white tracking-[-0.5px]">
            {todaySession.name} — done.
          </p>
        </div>
      )}
      {resolution?.type === 'rest' && (
        <div className="flex flex-col gap-[8px]">
          <span className="font-commons text-[16px] text-[#8b8b8b] leading-[normal]">Today</span>
          <p className="font-commons text-[18px] text-white tracking-[-0.5px]">
            Rest day{resolution.skipped ? ' (skipped session)' : '.'}
          </p>
        </div>
      )}
      {programDone && (
        <div className="flex flex-col gap-[8px]">
          <span className="font-commons text-[16px] text-[#8b8b8b] leading-[normal]">Status</span>
          <p className="font-commons text-[18px] text-white tracking-[-0.5px]">
            Program complete. Pick a new one below.
          </p>
        </div>
      )}

      {/* Journey — all blocks */}
      <JourneyBlocks
        program={program}
        blockInfo={macroPosition ?? { blockNumber: 1, weekInBlock: 1 }}
      />

      {/* Program inputs (TMs / 1RMs) — only for programs that need them */}
      {hasInputs && (
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center justify-between">
            <span className="font-commons text-[16px] text-[#8b8b8b] leading-[normal]">Your numbers</span>
            <button
              onClick={() => setEditInputsOpen(true)}
              className="font-commons text-[14px] text-accent hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.06)]">
            {program.userInputs.map(field => {
              const v = inputs[field.id]
              return (
                <div key={field.id} className="flex items-center justify-between px-[16px] py-[12px]">
                  <span className="font-commons text-[16px] text-white tracking-[-0.2px]">{field.label}</span>
                  <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px]">
                    {v == null || v === '' ? '—' : formatWeight(v, weightUnit)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Edit inputs modal */}
      {editInputsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-6">
          <div className="bg-bg-secondary rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <ProgramInputsForm
              program={program}
              weightUnit={weightUnit}
              initialValues={inputs}
              title="Edit your numbers"
              description="Used to prescribe weights for the main lifts."
              submitLabel="Save"
              busy={savingInputs}
              onSubmit={handleSaveInputs}
              onCancel={() => setEditInputsOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Switch + Edit Schedule + End Program */}
      <div className="flex flex-col gap-[16px]">
        <button
          onClick={() => navigate('/edit-schedule')}
          className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons font-bold text-[18px] text-white tracking-[-0.36px]"
        >
          Edit Schedule
        </button>
        <button
          onClick={() => navigate('/program-selector')}
          className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons font-bold text-[18px] text-white tracking-[-0.36px]"
        >
          Switch Program
        </button>
        <DestructiveButton onClick={() => setConfirmEndOpen(true)}>
          End Program
        </DestructiveButton>
      </div>

      {/* Confirm end-program dialog */}
      {confirmEndOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-[24px]">
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px] w-full max-w-sm flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[6px]">
              <h3 className="font-judge text-[22px] text-white leading-snug">End program?</h3>
              <p className="font-commons text-[16px] text-[rgba(255,255,255,0.6)] leading-[1.4]">
                You'll lose your current progress and return to program selection. You can start a new program any time.
              </p>
            </div>
            <div className="flex flex-col gap-[10px]">
              <DestructiveButton onClick={handleEndConfirmed} disabled={endProgram.isPending}>
                {endProgram.isPending ? 'Ending…' : 'End Program'}
              </DestructiveButton>
              <button
                onClick={() => setConfirmEndOpen(false)}
                disabled={endProgram.isPending}
                className="w-full h-[46px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons font-bold text-[18px] text-white disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── No-program state ─────────────────────────────────────────────────────────
function NoProgram() {
  return (
    <div className="px-[16px] pt-[90px] pb-[40px] flex flex-col gap-[36px]">
      {/* Header */}
      <div className="flex flex-col gap-[4px]">
        <span className="font-commons text-[14px] text-[#8b8b8b] leading-[14px]">PROGRAM</span>
        <p className="font-judge text-[48px] text-white leading-[60px]">Pick your next block.</p>
        <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
          Structure beats motivation. Run a program and see what happens.
        </p>
      </div>

      <ProgramBrowser />
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function ProgressTab() {
  const { resolution, macroPosition, completedToday, isLoading, config, program } = useTodaysSession()

  if (isLoading) return <LoadingSpinner />

  if (!program) {
    return <NoProgram />
  }

  return (
    <OnProgram
      program={program}
      config={config}
      resolution={resolution}
      macroPosition={macroPosition}
      completedToday={completedToday}
    />
  )
}
