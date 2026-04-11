import { useEffect, useState, useRef } from 'react'

export default function RestTimer({ duration, onDismiss }) {
  const [remaining, setRemaining] = useState(duration)
  const endRef = useRef(Date.now() + duration * 1000)

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        if (navigator.vibrate) navigator.vibrate([40, 30, 80])
        onDismiss()
      }
    }
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [onDismiss])

  const pct = remaining / duration
  const r = 36, cx = 44, cy = 44
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - pct)

  function addTime(delta) {
    endRef.current += delta * 1000
    setRemaining(v => Math.max(0, v + delta))
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div className="pointer-events-auto bg-bg-secondary border border-bg-tertiary rounded-t-2xl w-full max-w-sm mx-auto p-6 pb-8 safe-bottom">
        <div className="flex flex-col items-center gap-4">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(108,99,255,0.15)" strokeWidth="6" />
            <circle
              cx={cx} cy={cy} r={r}
              fill="none" stroke="#6c63ff" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
            <text x={cx} y={cy + 6} textAnchor="middle" fill="#f0f2ff" fontSize="18" fontWeight="bold" fontFamily="Syne, sans-serif">
              {mins}:{String(secs).padStart(2, '0')}
            </text>
          </svg>

          <div className="text-sm text-text-secondary">Rest</div>

          <div className="flex items-center gap-3">
            <button onClick={() => addTime(-30)} className="px-4 py-2 text-sm text-text-secondary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">−30s</button>
            <button onClick={onDismiss} className="px-6 py-2 text-sm font-semibold text-text-primary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">Skip</button>
            <button onClick={() => addTime(30)} className="px-4 py-2 text-sm text-text-secondary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">+30s</button>
          </div>
        </div>
      </div>
    </div>
  )
}
