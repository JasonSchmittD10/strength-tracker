import { useRef, useState } from 'react'

// Props:
//   length    — number of boxes, default 6
//   onComplete(code) — called when all boxes are filled
//   disabled  — grays out all inputs
export default function OtpInput({ length = 6, onComplete, disabled = false }) {
  const [values, setValues] = useState(Array(length).fill(''))
  const inputs = useRef([])

  function focusAt(idx) {
    inputs.current[idx]?.focus()
  }

  function handleChange(idx, e) {
    const raw = e.target.value
    // Only take the last character typed (in case browser pastes into single input)
    const char = raw.replace(/\D/g, '').slice(-1)
    if (!char) return

    const next = [...values]
    next[idx] = char
    setValues(next)

    if (idx < length - 1) {
      focusAt(idx + 1)
    } else {
      // Last digit — auto-submit
      const code = next.join('')
      if (code.length === length) onComplete?.(code)
    }
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace') {
      if (values[idx]) {
        // Clear this box
        const next = [...values]
        next[idx] = ''
        setValues(next)
      } else if (idx > 0) {
        // Move back and clear previous
        const next = [...values]
        next[idx - 1] = ''
        setValues(next)
        focusAt(idx - 1)
      }
      e.preventDefault()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    const next = Array(length).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setValues(next)
    const filled = pasted.length
    focusAt(Math.min(filled, length - 1))
    if (pasted.length === length) onComplete?.(pasted)
  }

  return (
    <div className="flex gap-2 justify-center">
      {values.map((val, idx) => (
        <input
          key={idx}
          ref={el => { inputs.current[idx] = el }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={e => handleChange(idx, e)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={[
            'w-12 h-14 text-center text-xl font-bold rounded-xl',
            'bg-bg-tertiary border text-text-primary',
            'focus:outline-none focus:border-accent',
            val ? 'border-accent/40' : 'border-bg-tertiary',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        />
      ))}
    </div>
  )
}
