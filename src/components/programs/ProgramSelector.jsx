import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { useProgram, useSaveConfig } from '@/hooks/useProgram'
import { PROGRAMS } from '@/lib/programs'

const COMING_SOON = [
  {
    id: 'phul',
    name: 'PHUL',
    description: 'Upper/Lower split twice per week — power and hypertrophy focus.',
    structure: '4 sessions · Upper Power / Lower Power / Upper Hypertrophy / Lower Hypertrophy',
    blockSummary: 'Power + Hypertrophy blocks',
  },
  {
    id: '531-bbb',
    name: '5/3/1 BBB',
    description: "Jim Wendler's 5/3/1 with Boring But Big supplemental work.",
    structure: '4 sessions · Squat / Bench / Deadlift / Press days',
    blockSummary: 'Percentage-based wave loading',
  },
]


function deriveStructureSummary(program) {
  const tags = [...new Set(program.sessions.map(s => s.tagLabel))]
  return `${program.sessions.length} sessions · ${tags.join(' / ')}`
}

function deriveBlockSummary(program) {
  const { weeksPerBlock, phaseByWeek } = program.blockStructure
  const phases = [...new Set(Object.values(phaseByWeek).filter(p => !p.toLowerCase().includes('deload')))]
  return `${weeksPerBlock}-week blocks · ${phases.slice(0, 2).join(' & ')}`
}

export default function ProgramSelector() {
  const navigate = useNavigate()
  const { data: programData } = useProgram()
  const { mutateAsync: saveConfig, isPending } = useSaveConfig()

  const activeId = programData?.config?.activeProgramId ?? 'ppl-x2'
  const [confirmProgram, setConfirmProgram] = useState(null)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [configError, setConfigError] = useState(null)

  async function handleStartProgram() {
    setConfigError(null)
    try {
      await saveConfig({
        ...programData?.config,
        activeProgramId: confirmProgram.id,
        programStartDate: startDate,
      })
      setConfirmProgram(null)
      navigate('/program')
    } catch {
      setConfigError('Failed to update program. Please try again.')
    }
  }

  return (
    <div className="safe-top px-4 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={() => navigate('/program')}
          className="text-text-muted hover:text-text-primary transition-colors p-1"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-xl text-text-primary">Choose Program</h1>
      </div>

      <div className="space-y-3">
        {/* Available programs */}
        {Object.values(PROGRAMS).map(program => {
          const isActive = program.id === activeId
          return (
            <button
              key={program.id}
              onClick={() => { if (!isActive) setConfirmProgram(program) }}
              disabled={isActive}
              className={`w-full text-left bg-bg-card border rounded-2xl p-4 transition-colors ${
                isActive
                  ? 'border-accent/50 cursor-default'
                  : 'border-bg-tertiary hover:border-accent/50 active:border-accent'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="font-bold text-lg text-text-primary">{program.name}</div>
                {isActive && (
                  <span className="flex items-center gap-1 text-xs font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                    <Check size={10} />
                    Active
                  </span>
                )}
              </div>
              <div className="text-sm text-text-secondary mb-2">{program.description}</div>
              <div className="text-xs text-text-muted">{deriveStructureSummary(program)}</div>
              <div className="text-xs text-text-muted mt-0.5">{deriveBlockSummary(program)}</div>
            </button>
          )
        })}

        {/* Coming soon programs */}
        {COMING_SOON.map(program => (
          <div
            key={program.id}
            className="w-full bg-bg-card border border-bg-tertiary rounded-2xl p-4 opacity-50"
          >
            <div className="flex items-start justify-between mb-1">
              <div className="font-bold text-lg text-text-primary">{program.name}</div>
              <span className="text-xs font-bold text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                Coming Soon
              </span>
            </div>
            <div className="text-sm text-text-secondary mb-2">{program.description}</div>
            <div className="text-xs text-text-muted">{program.structure}</div>
            <div className="text-xs text-text-muted mt-0.5">{program.blockSummary}</div>
          </div>
        ))}
      </div>

      {/* Confirm program change dialog */}
      {confirmProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="font-bold text-text-primary mb-2">Start {confirmProgram.name}?</h3>
            <p className="text-text-secondary text-sm mb-4">
              Choose a start date. Your block and week progress will be calculated from this date.
            </p>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent mb-4"
            />
            {configError && (
              <p className="text-xs text-danger mb-3">{configError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmProgram(null); setConfigError(null) }}
                className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleStartProgram}
                disabled={isPending}
                className="flex-1 py-2.5 bg-accent text-black rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {isPending ? 'Starting\u2026' : 'Start Program'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
