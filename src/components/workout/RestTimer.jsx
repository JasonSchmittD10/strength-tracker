import { useEffect, useState, useRef } from 'react'

export default function RestTimer({ duration, onDismiss, fullScreen = false, onMinimize, onExpand }) {
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

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  if (fullScreen) {
    const pct = remaining / duration
    const r = 80, cx = 96, cy = 96
    const circumference = 2 * Math.PI * r
    const dashOffset = circumference * (1 - pct)

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary">
        <div className="text-sm text-text-muted mb-8 uppercase tracking-widest font-medium">Rest</div>

        <svg width="192" height="192" viewBox="0 0 192 192" className="mb-6">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(108,99,255,0.15)" strokeWidth="8" />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none" stroke="#6c63ff" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#f0f2ff" fontSize="42" fontWeight="bold" fontFamily="Syne, sans-serif">
            {mins}:{String(secs).padStart(2, '0')}
          </text>
        </svg>

        <div className="flex items-center gap-4 mb-10">
          <button onClick={onDismiss} className="px-7 py-3 text-sm font-semibold text-black bg-accent hover:bg-accent-hover rounded-xl transition-colors">Skip Rest</button>
        </div>

        <button onClick={onMinimize} className="text-text-muted text-sm hover:text-text-primary transition-colors">
          Minimize ↓
        </button>
      </div>
    )
  }

  // Minimized — thin bar with just the timer
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary border-t border-bg-tertiary">
      <button
        onClick={onExpand}
        className="w-full flex items-center justify-center gap-2 py-2"
        aria-label="Expand rest timer"
      >
        <span className="text-xs text-text-muted uppercase tracking-widest font-medium">Rest</span>
        <span className="font-mono font-bold text-text-primary text-sm">
          {mins}:{String(secs).padStart(2, '0')}
        </span>
      </button>
    </div>
  )
}
