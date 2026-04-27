import { useState, useMemo } from 'react'
import { convertWeight } from '@/lib/units'
import PrimaryButton from '@/components/shared/PrimaryButton'

// Reusable form for collecting / editing a program's userInputs.
//
// Initial values are in canonical lbs (matches storage). The form displays
// in the user's preferred unit and submits canonical lbs.
//
// Props:
//   program       — { name, userInputs }
//   weightUnit    — 'lbs' | 'kg'
//   initialValues — { [inputId]: number-in-lbs } (optional)
//   submitLabel   — button label (default 'Save')
//   onSubmit(inputsLbs)  — called on submit; inputsLbs is { [inputId]: lbs }
//   onCancel      — optional cancel callback (renders Cancel button if set)
//   busy          — disables submit while parent is saving
//   error         — optional error string from parent
export default function ProgramInputsForm({
  program,
  weightUnit = 'lbs',
  initialValues = {},
  title,
  description,
  submitLabel = 'Save',
  onSubmit,
  onCancel,
  busy = false,
  error,
}) {
  const fields = program?.userInputs ?? []

  // Local form state in display unit (kg or lbs). Keep as strings so the user
  // can clear / type freely; convert on submit.
  const initialDisplay = useMemo(() => {
    const out = {}
    for (const f of fields) {
      const stored = initialValues[f.id]
      if (stored == null || stored === '') {
        out[f.id] = ''
      } else if (weightUnit === 'kg') {
        out[f.id] = String(Math.round(convertWeight(stored, 'lbs', 'kg') * 10) / 10)
      } else {
        out[f.id] = String(stored)
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id, weightUnit, ...fields.map(f => initialValues[f.id])])

  const [values, setValues] = useState(initialDisplay)
  const [validationError, setValidationError] = useState(null)

  function setValue(id, v) {
    setValues(prev => ({ ...prev, [id]: v }))
  }

  function validRange(num) {
    if (weightUnit === 'kg') return num >= 22 && num <= 450
    return num >= 50 && num <= 1000
  }

  const allValid = useMemo(() => {
    return fields.every(f => {
      if (!f.required) return true
      const raw = values[f.id]
      if (raw == null || raw === '') return false
      const n = parseFloat(raw)
      return !isNaN(n) && n > 0 && validRange(n)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, fields, weightUnit])

  function handleSubmit(e) {
    e.preventDefault()
    setValidationError(null)
    if (!allValid) {
      setValidationError(`Enter a valid number${weightUnit === 'kg' ? ' (22–450 kg)' : ' (50–1000 lbs)'} for each field.`)
      return
    }
    const out = {}
    for (const f of fields) {
      const raw = values[f.id]
      if (raw == null || raw === '') continue
      const n = parseFloat(raw)
      if (isNaN(n)) continue
      out[f.id] = weightUnit === 'kg' ? convertWeight(n, 'kg', 'lbs') : n
    }
    onSubmit(out)
  }

  if (!fields.length) return null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {title && (
        <h2 className="font-judge text-[26px] text-white leading-tight">{title}</h2>
      )}
      {description && (
        <p className="font-commons text-[14px] text-text-secondary leading-[18px]">{description}</p>
      )}

      <div className="flex flex-col gap-4">
        {fields.map(f => (
          <div key={f.id} className="flex flex-col gap-1.5">
            <label htmlFor={`pi-${f.id}`} className="font-commons text-[14px] text-text-secondary">
              {f.label} <span className="text-text-muted">({weightUnit})</span>
            </label>
            <input
              id={`pi-${f.id}`}
              type="number"
              inputMode="decimal"
              value={values[f.id] ?? ''}
              onChange={e => setValue(f.id, e.target.value)}
              placeholder={weightUnit === 'kg' ? 'e.g. 100' : 'e.g. 225'}
              disabled={busy}
              className="bg-bg-tertiary rounded-lg px-3 py-2.5 text-text-primary text-[16px] focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            />
            {f.helpText && (
              <p className="font-commons text-[12px] text-text-muted leading-[16px]">{f.helpText}</p>
            )}
          </div>
        ))}
      </div>

      {(validationError || error) && (
        <p className="font-commons text-[14px] text-danger">{validationError || error}</p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <PrimaryButton variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </PrimaryButton>
        )}
        <PrimaryButton type="submit" disabled={!allValid || busy}>
          {busy ? 'Saving…' : submitLabel}
        </PrimaryButton>
      </div>
    </form>
  )
}
