import { useState, useMemo } from 'react'
import { convertWeight, formatWeight } from '@/lib/units'
import PrimaryButton from '@/components/shared/PrimaryButton'
import ModalOverlay from '@/components/shared/ModalOverlay'

// Block-end progression prompt. Generalized over `userInputs[i].progression`:
//
//   { type: 'increment', byUnit: { lbs: 10, kg: 5 } }   — TM/1RM bumps
//   { type: 'rotate' }                                  — cycle through select options
//
// Triggered from HomeScreen when scheduling.blockNumber > config.current_block_number.
// On Update / Skip the modal always bumps current_block_number so we don't
// re-prompt; Update also patches `inputs`.

function nextSelectOption(input, blockNumber) {
  const opts = input.options ?? []
  if (!opts.length) return null
  // Block N (1-indexed) → opts[(N - 1) % opts.length]
  return opts[(Math.max(1, blockNumber) - 1) % opts.length]
}

function suggestedNextLbs(input, currentLbs, weightUnit) {
  if (input.progression?.type !== 'increment' || currentLbs == null) return null
  const inc = input.progression.byUnit ?? {}
  if (weightUnit === 'kg') {
    const incKg = inc.kg ?? 0
    const currentKg = convertWeight(currentLbs, 'lbs', 'kg')
    return convertWeight(currentKg + incKg, 'kg', 'lbs')
  }
  return currentLbs + (inc.lbs ?? 0)
}

// Friendly label for select-input options, e.g. 'box-squat' → 'Box Squat'.
// Special-cases acronyms ('ssb', 'ohp', 'rpe') so they render uppercased.
const ACRONYMS = new Set(['ssb', 'ohp', 'rpe', 'rdl', 'tm', 'rm', '1rm', 'amrap'])
function titleizeKey(key) {
  if (!key) return ''
  return key
    .split('-')
    .map(w => ACRONYMS.has(w.toLowerCase())
      ? w.toUpperCase()
      : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Headline copy summarizing the program's progression rules.
function progressionSummary(program, weightUnit) {
  const incs = (program?.userInputs ?? [])
    .filter(i => i.progression?.type === 'increment')
    .map(i => `${i.label}: +${i.progression.byUnit?.[weightUnit] ?? 0} ${weightUnit}`)
  const rotations = (program?.userInputs ?? [])
    .filter(i => i.progression?.type === 'rotate')
    .map(i => i.label)
  const parts = []
  if (incs.length) parts.push(`Suggested bumps: ${incs.join(' · ')}`)
  if (rotations.length) parts.push(`Rotates: ${rotations.join(' · ')}`)
  return parts.join('. ')
}

// Props:
//   open, program, currentInputs, weightUnit, blockNumber
//   onConfirm(updatedInputs)  — bumps current_block_number + writes inputs
//   onSkip()                  — bumps current_block_number; keeps inputs
//   busy
export default function BlockEndProgressionModal({
  open, program, currentInputs, weightUnit = 'lbs', blockNumber,
  onConfirm, onSkip, busy,
}) {
  const fields = (program?.userInputs ?? []).filter(i => i.progression)

  // Serialize the relevant input values into a single stable dep so the deps
  // array length doesn't change across programs (rules-of-hooks).
  const inputsKey = JSON.stringify(fields.map(f => currentInputs?.[f.id] ?? null))
  const initial = useMemo(() => {
    const out = {}
    for (const f of fields) {
      if (f.progression.type === 'increment') {
        const lbs = currentInputs?.[f.id]
        const next = suggestedNextLbs(f, lbs, weightUnit)
        if (next == null) {
          out[f.id] = ''
        } else if (weightUnit === 'kg') {
          out[f.id] = String(Math.round(convertWeight(next, 'lbs', 'kg') * 10) / 10)
        } else {
          out[f.id] = String(Math.round(next))
        }
      } else if (f.progression.type === 'rotate') {
        out[f.id] = nextSelectOption(f, blockNumber) ?? f.options?.[0] ?? ''
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id, weightUnit, blockNumber, inputsKey])

  const [values, setValues] = useState(initial)

  if (!open || !program) return null

  function handleConfirm() {
    const out = { ...(currentInputs ?? {}) }
    for (const f of fields) {
      const raw = values[f.id]
      if (raw == null || raw === '') continue
      if (f.progression.type === 'increment') {
        const n = parseFloat(raw)
        if (isNaN(n)) continue
        out[f.id] = weightUnit === 'kg' ? convertWeight(n, 'kg', 'lbs') : n
      } else if (f.progression.type === 'rotate') {
        out[f.id] = raw
      }
    }
    onConfirm(out)
  }

  return (
    <ModalOverlay className="flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-6">
      <div className="bg-bg-secondary rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-judge text-[26px] text-white leading-tight">Block {blockNumber} starting</h2>
          <p className="font-commons text-[14px] text-text-secondary leading-[18px]">
            {progressionSummary(program, weightUnit)}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map(f => {
            if (f.progression.type === 'increment') {
              const currentLbs = currentInputs?.[f.id]
              return (
                <div key={f.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`be-${f.id}`} className="font-commons text-[14px] text-text-secondary">
                      {f.label}
                    </label>
                    <span className="font-commons text-[12px] text-text-muted">
                      Current: {currentLbs != null ? formatWeight(currentLbs, weightUnit) : '—'}
                    </span>
                  </div>
                  <input
                    id={`be-${f.id}`}
                    type="number"
                    inputMode="decimal"
                    value={values[f.id] ?? ''}
                    onChange={e => setValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                    disabled={busy}
                    className="bg-bg-tertiary rounded-lg px-3 py-2.5 text-text-primary text-[16px] focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                  />
                </div>
              )
            }
            if (f.progression.type === 'rotate') {
              const current = currentInputs?.[f.id]
              return (
                <div key={f.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`be-${f.id}`} className="font-commons text-[14px] text-text-secondary">
                      {f.label}
                    </label>
                    <span className="font-commons text-[12px] text-text-muted">
                      Current: {current ? titleizeKey(current) : '—'}
                    </span>
                  </div>
                  <select
                    id={`be-${f.id}`}
                    value={values[f.id] ?? ''}
                    onChange={e => setValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                    disabled={busy}
                    className="bg-bg-tertiary rounded-lg px-3 py-2.5 text-text-primary text-[16px] focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                  >
                    {(f.options ?? []).map(opt => (
                      <option key={opt} value={opt}>{titleizeKey(opt)}</option>
                    ))}
                  </select>
                </div>
              )
            }
            return null
          })}
        </div>

        <div className="flex gap-3">
          <PrimaryButton variant="secondary" onClick={onSkip} disabled={busy}>
            Skip
          </PrimaryButton>
          <PrimaryButton onClick={handleConfirm} disabled={busy}>
            {busy ? 'Saving…' : 'Update'}
          </PrimaryButton>
        </div>
      </div>
    </ModalOverlay>
  )
}
